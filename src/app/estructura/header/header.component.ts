import { Component, computed, inject } from '@angular/core';
import { AutenticacionService } from '../../nucleo/autenticacion/autenticacion.service';

@Component({
  selector: 'app-header',
  template: `
    <header class="topbar">
      <div class="brand">
        <img class="brand__logo" src="/logo-mep.jpg" alt="Logo del Ministerio de Educación Pública" />
        <div class="brand__copy">
          <p class="brand__institution">Instituto de Educación Dr. Clodomiro Picado</p>
          <h1>IET BI Portal</h1>
        </div>
      </div>

      <div class="topbar__actions" aria-label="Información de usuario">
        <div class="current-role">
          <span>Rol</span>
          <strong>{{ roleLabel() }}</strong>
        </div>

        <div class="user-chip">
          <div class="avatar">{{ avatar() }}</div>
          <div>
            <strong>{{ name() }}</strong>
            <span>{{ username() }}</span>
          </div>
        </div>

        <button type="button" class="logout-button" (click)="cerrarSesion()" aria-label="Cerrar la sesión actual">
          <span aria-hidden="true">↪</span>
          Cerrar sesión
        </button>
      </div>
    </header>
  `,
  styles: `
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 1rem 1.25rem;
      background: #ffffff;
      color: #1e3a5f;
      border-radius: 14px;
      border: 1px solid rgba(47, 107, 154, 0.14);
      box-shadow: 0 8px 26px rgba(30, 58, 95, 0.08);
    }

    .brand,
    .topbar__actions,
    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.9rem;
    }

    .brand__logo {
      width: 66px;
      height: 66px;
      object-fit: contain;
      border-radius: 18px;
      background: #fff;
      padding: 0.35rem;
      border: 1px solid rgba(47, 107, 154, 0.12);
    }

    .avatar {
      width: 50px;
      height: 50px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      font-weight: 700;
      background: #eaf3f8;
      color: #1e3a5f;
      border: 1px solid rgba(47, 107, 154, 0.18);
    }

    .brand__institution,
    .current-role span,
    .user-chip span {
      margin: 0;
      font-size: 0.82rem;
      color: #667085;
    }

    .brand__copy {
      display: grid;
      gap: 0.3rem;
    }

    .brand h1,
    .current-role strong,
    .user-chip strong {
      margin: 0;
      font-size: 1rem;
    }

    .brand h1 {
      font-size: 1.2rem;
    }

    .current-role {
      padding: 0.7rem 0.9rem;
      border-radius: 16px;
      background: #f7fafc;
      border: 1px solid #e4edf5;
    }

    .current-role,
    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .logout-button {
      min-height: 44px;
      padding: 0.7rem 0.95rem;
      border: 1px solid #d5e0ea;
      border-radius: 9px;
      background: #fff;
      color: #1e3a5f;
      font-weight: 700;
      cursor: pointer;
    }

    .logout-button:hover { background: #f2f7fa; border-color: #2f6b9a; }

    @media (max-width: 1100px) {
      .topbar,
      .topbar__actions {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `,
})
export class HeaderComponent {
  private readonly auth = inject(AutenticacionService);

  protected readonly roleLabel = computed(() => this.auth.currentRole() ?? 'Sin rol');
  protected readonly name = computed(() => ({ Administrador: 'Administración general', 'Profesor regular': 'Profesor Carlos', 'Profesor Guía': 'Profesora Ana', 'Coordinador de monografía': 'Maya Quirós Paniagua' } as Record<string, string>)[this.auth.currentRole() ?? ''] ?? 'Invitado');
  protected readonly username = computed(() => this.auth.currentRole() ? 'usuario.demostración' : 'sin sesión');
  protected readonly avatar = computed(() => this.name().split(' ').map((part) => part[0]).slice(0, 2).join(''));

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
  }

}
