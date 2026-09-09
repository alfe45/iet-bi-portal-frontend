import { Component, computed, inject } from '@angular/core';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { StatGridComponent } from '../compartidos/componentes/cuadricula-estadisticas.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-vista-perfil',
  imports: [StatGridComponent],
  template: `
    <section class="page-grid">
      <section class="surface profile-hero">
        <div class="profile-hero__main">
          <div class="profile-avatar">{{ avatar() }}</div>
          <div>
            <p class="eyebrow">Cuenta</p>
            <h2>{{ user()?.fullName }}</h2>
            <p>{{ user()?.email }}</p>
          </div>
        </div>
        <button type="button" class="ghost-button" (click)="back()">← Volver</button>
      </section>

      <app-stat-grid [cards]="cards()" />

      <section class="surface profile-grid">
        <div><strong>Nombre:</strong> {{ user()?.fullName }}</div>
        <div><strong>Nombre de usuario:</strong> {{ user()?.username }}</div>
         <div><strong>Correo:</strong> {{ user()?.email }}</div>
      </section>
    </section>
  `,
  styles: `
    .eyebrow { margin: 0 0 0.25rem; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.74rem; color: #2f6b9a; font-weight: 700; }
    .profile-hero { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .profile-hero__main { display: flex; align-items: center; gap: 1rem; }
    .profile-avatar { width: 72px; height: 72px; border-radius: 24px; display: grid; place-items: center; background: #1e3a5f; color: #fff; font-size: 1.5rem; font-weight: 800; }
    .profile-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  `,
})
export class PerfilVistaComponent {
  private readonly auth = inject(AutenticacionService);
  private readonly location = inject(Location);

  protected readonly user = computed(() => {
    const role = this.auth.currentRole();
    const names: Record<string, string> = { Administrador: 'Administración general', 'Profesor regular': 'Juan Gabriel Valverde Valverde', 'Profesor Guía': 'Laura Vanessa Quirós Brenes', 'Profesor Coordinador de Monografía': 'Ana Lucía Solano Castro' };
    return { fullName: role ? names[role] : 'Invitado', role, username: this.auth.currentUsername() || '-', email: role ? 'portal@institucion.edu' : '-' };
  });
  protected readonly avatar = computed(() => this.user().role?.split(' ').map((part) => part[0]).slice(0, 2).join('') ?? '--');
  protected readonly cards = computed(() => [
     { label: 'Usuario', value: this.user().username, tone: 'neutral' as const },
    { label: 'Correo', value: this.user().email, tone: 'success' as const },
  ]);

  protected back(): void { this.location.back(); }

}
