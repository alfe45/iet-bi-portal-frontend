import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { fechaCostaRica } from '../compartidos/utilidades/fechas';
import { environment } from '../../env/environment';
import { claseInsigniaRol } from '../compartidos/utilidades/roles';

/** Respuesta de GET /api/perfil (UsuarioAdmin del backend). */
interface MiPerfilApi {
  email: string;
  activo: boolean;
  ultimoLogin: string | null;
  creadoEn: string;
  roles: string[];
  cedulaProfesor: string | null;
  nombreProfesor: string | null;
}

@Component({
  selector: 'app-vista-perfil',
  template: `
    <section class="page-grid">
      <section class="surface profile-hero">
        <div class="profile-hero__main">
          <div class="profile-avatar" aria-hidden="true">{{ avatar() }}</div>
          <div>
            <p class="eyebrow">Cuenta</p>
            <h2>{{ nombre() || 'Mi cuenta' }}</h2>
          </div>
        </div>
        <button type="button" class="ghost-button" (click)="back()">← Volver</button>
      </section>

      <section class="surface profile-data" aria-label="Datos de la cuenta">
        <dl>
          @if (nombre()) { <div><dt>Nombre</dt><dd>{{ nombre() }}</dd></div> }
          <div><dt>Correo electrónico</dt><dd>{{ correo() }}</dd></div>
          @if (perfil()?.cedulaProfesor) { <div><dt>Cédula</dt><dd>{{ perfil()?.cedulaProfesor }}</dd></div> }
          <div><dt>Roles</dt><dd class="roles">@for (rol of roles(); track rol) { <span [class]="claseRol(rol)">{{ rol }}</span> }</dd></div>
          @if (perfil(); as datos) {
            <div><dt>Estado de la cuenta</dt><dd>{{ datos.activo ? 'Activa' : 'Inactiva' }}</dd></div>
            <div><dt>Último inicio de sesión</dt><dd>{{ datos.ultimoLogin ? fecha(datos.ultimoLogin) : 'Sin registro' }}</dd></div>
            <div><dt>Cuenta creada</dt><dd>{{ fecha(datos.creadoEn) }}</dd></div>
          }
        </dl>
        @if (error()) { <p class="error-text" role="alert">{{ error() }}</p> }
      </section>
    </section>
  `,
  styles: `
    .eyebrow { margin: 0 0 0.25rem; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.74rem; color: #2f6b9a; font-weight: 700; }
    .profile-hero { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .profile-hero h2 { margin: 0; }
    .profile-hero__main { display: flex; align-items: center; gap: 1rem; }
    .profile-avatar { width: 72px; height: 72px; border-radius: 24px; display: grid; place-items: center; background: #1e3a5f; color: #fff; font-size: 1.5rem; font-weight: 800; }
    .profile-data dl { display: grid; gap: 0; margin: 0; }
    .profile-data dl > div { display: grid; grid-template-columns: minmax(150px, 220px) 1fr; gap: 1rem; padding: 0.75rem 0.25rem; border-bottom: 1px solid #e6edf3; }
    .profile-data dl > div:last-child { border-bottom: 0; }
    .profile-data dt { color: #667085; font-size: 0.82rem; font-weight: 700; }
    .profile-data dd { margin: 0; color: #1e3a5f; overflow-wrap: anywhere; }
    .roles { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .error-text { margin: 0.5rem 0 0; color: #b42318; }
    @media (max-width: 600px) { .profile-data dl > div { grid-template-columns: 1fr; gap: 0.2rem; } }
  `,
})
// Mi perfil: cada dato de la cuenta una sola vez (nombre, correo, cédula, roles, estado y fechas).
export class PerfilVistaComponent {
  private readonly auth = inject(AutenticacionService);
  private readonly http = inject(HttpClient);
  private readonly location = inject(Location);

  protected readonly perfil = signal<MiPerfilApi | null>(null);
  protected readonly error = signal('');

  // El nombre es el del perfil de profesor; el primer administrador no tiene perfil y se identifica solo por su correo.
  protected readonly nombre = computed(() => {
    const nombre = this.perfil()?.nombreProfesor?.trim() || this.auth.currentDisplayName();
    return nombre && nombre !== this.correo() ? nombre : '';
  });
  protected readonly correo = computed(() => this.perfil()?.email || this.auth.currentUsername() || '-');
  protected readonly roles = computed(() => this.auth.currentRoles());
  protected readonly avatar = computed(() => {
    const nombre = this.perfil()?.nombreProfesor?.trim();
    if (nombre) return nombre.split(/\s+/).map((parte) => parte[0]).slice(0, 2).join('').toUpperCase();
    return (this.correo()[0] ?? '-').toUpperCase();
  });

  constructor() {
    this.http.get<MiPerfilApi>(`${environment.apiUrl}/perfil`).subscribe({
      next: (perfil) => this.perfil.set(perfil),
      error: () => this.error.set('No se pudieron consultar todos los datos de la cuenta. Intente de nuevo más tarde.'),
    });
  }

  protected fecha(valor: string): string { return fechaCostaRica(valor); }
  protected back(): void { this.location.back(); }
  protected claseRol(rol: string): string { return claseInsigniaRol(rol); }
}
