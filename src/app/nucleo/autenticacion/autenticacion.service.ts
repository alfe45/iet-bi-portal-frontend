import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, defer, finalize, map, Observable, of, shareReplay, Subscription, switchMap, tap, throwError } from 'rxjs';
import { RolUsuario } from '../modelos/modelos-prototipo';
import { environment } from '../../../env/environment';

interface RespuestaAutenticacion {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
}

interface PerfilBackend {
  id: string;
  email: string;
  activo: boolean;
  roles: string[];
  cedulaProfesor?: string | null;
  nombreProfesor?: string | null;
}

interface SesionPersistida {
  email: string;
  accessToken: string;
  refreshToken: string;
  roles: RolUsuario[];
  displayName: string;
}

const SESSION_KEY = 'iet-bi-portal:sesion:v2';

const ROLES_BACKEND: Record<string, RolUsuario> = {
  ADMIN: 'Administrador',
  PROFESOR_REGULAR: 'Profesor regular',
  GUIA: 'Profesor Guía',
  COORD_MONOGRAFIA: 'Profesor Coordinador de Monografía',
  PROFESOR_CAS: 'Profesor CAS',
  COORD_CAS: 'Profesor Coordinador de CAS',
};

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly initialSession = this.cargarSesion();
  private readonly accessToken = signal(this.initialSession?.accessToken ?? '');
  private readonly refreshToken = signal(this.initialSession?.refreshToken ?? '');
  private cierreSesionEnCurso = false;
  private versionSesion = 0;
  private renovacionEnCurso: Observable<string> | null = null;
  readonly currentRoles = signal<RolUsuario[]>(this.initialSession?.roles ?? []);
  readonly currentRole = computed(() => this.rolPrincipal(this.currentRoles()));
  readonly currentUsername = signal(this.initialSession?.email ?? '');
  readonly currentDisplayName = signal(this.initialSession?.displayName ?? '');
  readonly authenticated = computed(() => Boolean(this.accessToken()) && this.currentRoles().length > 0);

  constructor() {
    // RD-053: el refresh token rota en cada renovación. Las demás pestañas adoptan el par nuevo
    // en cuanto se guarda; si siguieran con el anterior, el backend lo tomaría como reutilizado
    // y revocaría todas las sesiones del usuario.
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (evento) => {
        if (evento.key === SESSION_KEY) this.sincronizarConOtraPestana();
      });
    }
  }

  iniciarSesion(email: string, contrasena: string): Observable<void> {
    const correo = email.trim();
    if (!correo || !contrasena.trim()) return throwError(() => new Error('Ingrese correo y contraseña.'));

    return this.http.post<RespuestaAutenticacion>(`${environment.apiUrl}/auth/login`, { email: correo, contrasena }).pipe(
      tap((tokens) => this.guardarTokens(tokens)),
      switchMap(() => this.http.get<PerfilBackend>(`${environment.apiUrl}/perfil`)),
      tap((perfil) => this.establecerPerfil(perfil)),
      map(() => undefined),
      catchError((error) => {
        this.limpiarSesion();
        return throwError(() => error);
      }),
    );
  }

  cerrarSesion(): void {
    if (this.cierreSesionEnCurso) return;
    this.cierreSesionEnCurso = true;
    const token = this.refreshToken();
    const cierre = token
      ? this.http.post<void>(`${environment.apiUrl}/auth/logout`, { refreshToken: token }).pipe(catchError(() => of(undefined)))
      : of(undefined);
    cierre.pipe(finalize(() => {
      this.limpiarSesion();
      void Promise.resolve(this.router.navigateByUrl('/login')).finally(() => {
        this.cierreSesionEnCurso = false;
      });
    })).subscribe();
  }

  estaCerrandoSesion(): boolean {
    return this.cierreSesionEnCurso;
  }

  expirarSesion(): void {
    this.limpiarSesion();
    void this.router.navigateByUrl('/login');
  }

  hasRole(role: RolUsuario): boolean {
    return this.currentRoles().includes(role);
  }

  accessTokenValue(): string {
    return this.accessToken();
  }

  refreshTokenValue(): string {
    return this.refreshToken();
  }

  renovarAccessToken(): Observable<string> {
    if (this.renovacionEnCurso) return this.renovacionEnCurso;
    if (!this.refreshToken()) return throwError(() => new Error('No existe una sesión renovable.'));
    const accessVencido = this.accessToken();
    this.renovacionEnCurso = this.conCandadoEntrePestanas(() => this.renovar(accessVencido)).pipe(
      finalize(() => { this.renovacionEnCurso = null; }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.renovacionEnCurso;
  }

  private renovar(accessVencido: string): Observable<string> {
    return defer(() => {
      // Otra pestaña pudo renovar mientras se esperaba el candado: se usa su par de tokens.
      this.adoptarTokensGuardados();
      const accessActual = this.accessToken();
      if (accessActual && accessActual !== accessVencido) return of(accessActual);
      const token = this.refreshToken();
      if (!token) return throwError(() => new Error('No existe una sesión renovable.'));
      const version = this.versionSesion;
      return this.http.post<RespuestaAutenticacion>(`${environment.apiUrl}/auth/refresh`, { refreshToken: token }).pipe(
        switchMap((tokens) => {
          if (this.cierreSesionEnCurso || this.versionSesion !== version || this.refreshToken() !== token) {
            return throwError(() => new Error('La sesión cambió durante la renovación.'));
          }
          this.guardarTokens(tokens);
          return of(tokens.accessToken);
        }),
      );
    });
  }

  /** Solo una pestaña renueva a la vez (Web Locks); sin soporte, renueva directamente. */
  private conCandadoEntrePestanas(tarea: () => Observable<string>): Observable<string> {
    const candados = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    if (!candados?.request) return tarea();
    return new Observable<string>((suscriptor) => {
      let interna: Subscription | undefined;
      candados.request('iet-bi-portal:renovacion', () => new Promise<void>((liberar) => {
        if (suscriptor.closed) { liberar(); return; }
        interna = tarea().pipe(finalize(() => liberar())).subscribe(suscriptor);
      })).catch((error: unknown) => suscriptor.error(error));
      return () => interna?.unsubscribe();
    });
  }

  /** Toma el par de tokens de localStorage si es de la misma sesión y otra pestaña ya lo rotó. */
  private adoptarTokensGuardados(): void {
    const guardada = this.cargarSesion();
    if (!guardada || guardada.email !== this.currentUsername()) return;
    if (guardada.refreshToken === this.refreshToken()) return;
    this.versionSesion += 1;
    this.accessToken.set(guardada.accessToken);
    this.refreshToken.set(guardada.refreshToken);
  }

  private sincronizarConOtraPestana(): void {
    if (this.cierreSesionEnCurso) return;
    const guardada = this.cargarSesion();
    if (!guardada) {
      // Se cerró la sesión en otra pestaña.
      if (!this.accessToken()) return;
      this.limpiarSesion();
      void this.router.navigateByUrl('/login');
      return;
    }
    if (guardada.email === this.currentUsername()) {
      this.adoptarTokensGuardados();
      return;
    }
    // Inició sesión otro usuario en otra pestaña: esta pestaña pasa a esa sesión.
    this.versionSesion += 1;
    this.accessToken.set(guardada.accessToken);
    this.refreshToken.set(guardada.refreshToken);
    this.currentRoles.set(guardada.roles);
    this.currentUsername.set(guardada.email);
    this.currentDisplayName.set(guardada.displayName);
    void this.router.navigateByUrl('/');
  }

  limpiarSesion(): void {
    this.versionSesion += 1;
    this.accessToken.set('');
    this.refreshToken.set('');
    this.currentRoles.set([]);
    this.currentUsername.set('');
    this.currentDisplayName.set('');
    try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem('iet-bi-portal:sesion:v1'); } catch { }
  }

  private guardarTokens(tokens: RespuestaAutenticacion): void {
    this.versionSesion += 1;
    this.accessToken.set(tokens.accessToken);
    this.refreshToken.set(tokens.refreshToken);
    // RD-053: al renovar se persiste el par rotado; si no, una recarga o una pestaña nueva
    // presentaría el refresh token anterior. En el login lo persiste establecerPerfil().
    const guardada = this.cargarSesion();
    if (!guardada || guardada.email !== this.currentUsername()) return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...guardada, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken } satisfies SesionPersistida));
    } catch { }
  }

  private establecerPerfil(perfil: PerfilBackend): void {
    const roles = perfil.roles.map((role) => ROLES_BACKEND[role]).filter((role): role is RolUsuario => Boolean(role));
    if (!roles.length) throw new Error('La cuenta no tiene roles habilitados.');
    const displayName = perfil.nombreProfesor?.trim() || perfil.email;
    this.currentRoles.set(roles);
    this.currentUsername.set(perfil.email);
    this.currentDisplayName.set(displayName);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email: perfil.email, accessToken: this.accessToken(), refreshToken: this.refreshToken(), roles, displayName } satisfies SesionPersistida));
    } catch { }
  }

  private rolPrincipal(roles: RolUsuario[]): RolUsuario | null {
    const prioridad: RolUsuario[] = ['Administrador', 'Profesor Coordinador de CAS', 'Profesor Coordinador de Monografía', 'Profesor Guía', 'Profesor CAS', 'Profesor regular'];
    return prioridad.find((role) => roles.includes(role)) ?? null;
  }

  private cargarSesion(): SesionPersistida | null {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as Partial<SesionPersistida> | null;
      return session?.email && session.accessToken && session.refreshToken && session.roles?.length
        ? session as SesionPersistida
        : null;
    } catch {
      return null;
    }
  }
}
