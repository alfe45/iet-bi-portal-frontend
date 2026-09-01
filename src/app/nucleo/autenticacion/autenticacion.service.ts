import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { RolUsuario } from '../modelos/modelos-prototipo';

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private readonly router = inject(Router);
  readonly currentRole = signal<RolUsuario | null>(null);

  iniciarComoRol(rol: RolUsuario): void {
    this.currentRole.set(rol);
    void this.router.navigateByUrl('/dashboard');
  }

  cerrarSesion(): void {
    this.currentRole.set(null);
    void this.router.navigateByUrl('/login');
  }
}
