import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
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
  readonly currentRoles = signal<RolUsuario[]>(this.initialSession?.roles ?? []);
  readonly currentRole = computed(() => this.rolPrincipal(this.currentRoles()));
  readonly currentUsername = signal(this.initialSession?.email ?? '');
  readonly currentDisplayName = signal(this.initialSession?.displayName ?? '');
  readonly authenticated = computed(() => Boolean(this.accessToken()) && this.currentRoles().length > 0);

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
    const token = this.refreshToken();
    const cierre = token
      ? this.http.post<void>(`${environment.apiUrl}/auth/logout`, { refreshToken: token }).pipe(catchError(() => of(undefined)))
      : of(undefined);
    cierre.pipe(finalize(() => { this.limpiarSesion(); void this.router.navigateByUrl('/login'); })).subscribe();
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
    const token = this.refreshToken();
    if (!token) return throwError(() => new Error('No existe una sesión renovable.'));
    return this.http.post<RespuestaAutenticacion>(`${environment.apiUrl}/auth/refresh`, { refreshToken: token }).pipe(
      tap((tokens) => this.guardarTokens(tokens)),
      map((tokens) => tokens.accessToken),
    );
  }

  limpiarSesion(): void {
    this.accessToken.set('');
    this.refreshToken.set('');
    this.currentRoles.set([]);
    this.currentUsername.set('');
    this.currentDisplayName.set('');
    try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem('iet-bi-portal:sesion:v1'); } catch { }
  }

  private guardarTokens(tokens: RespuestaAutenticacion): void {
    this.accessToken.set(tokens.accessToken);
    this.refreshToken.set(tokens.refreshToken);
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
