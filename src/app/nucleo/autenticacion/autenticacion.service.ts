import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { RolUsuario } from '../modelos/modelos-prototipo';

@Injectable({ providedIn: 'root' })
// Gestiona la sesión local y la información básica del usuario autenticado.
export class AutenticacionService {
  private readonly router = inject(Router);
  private readonly sessionKey = 'iet-bi-portal:sesion:v1';
  private readonly initialSession = this.cargarSesion();
  readonly currentRole = signal<RolUsuario | null>(this.initialSession?.rol ?? null);
  readonly currentUsername = signal(this.initialSession?.usuario ?? '');
  readonly authenticated = computed(() => this.currentRole() !== null);

  iniciarSesion(usuario: string, contrasena: string, rol: RolUsuario): boolean {
    if (!usuario.trim() || !contrasena.trim()) return false;
    this.currentRole.set(rol);
    this.currentUsername.set(usuario.trim());
    try { localStorage.setItem(this.sessionKey, JSON.stringify({ usuario: usuario.trim(), rol })); } catch { }
    void this.router.navigateByUrl('/dashboard');
    return true;
  }

  cerrarSesion(): void {
    this.currentRole.set(null);
    this.currentUsername.set('');
    try { localStorage.removeItem(this.sessionKey); } catch { }
    void this.router.navigateByUrl('/login');
  }

  private cargarSesion(): { usuario: string; rol: RolUsuario } | null {
    try {
      const sesion = JSON.parse(localStorage.getItem(this.sessionKey) ?? 'null') as { usuario?: string; rol?: RolUsuario } | null;
      return sesion?.usuario && sesion.rol ? { usuario: sesion.usuario, rol: sesion.rol } : null;
    } catch {
      return null;
    }
  }
}
