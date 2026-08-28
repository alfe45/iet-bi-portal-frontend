import { Location } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { StatGridComponent } from '../../shared/components/ui-kit.component';

@Component({
  selector: 'app-profile-page',
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
        <button type="button" class="ghost-button" (click)="goBack()">← Volver</button>
      </section>

      <app-stat-grid [cards]="cards()" />

      <section class="surface profile-grid">
        <div><strong>Nombre:</strong> {{ user()?.fullName }}</div>
        <div><strong>Nombre de usuario:</strong> {{ user()?.username }}</div>
        <div><strong>Rol:</strong> {{ user()?.role }}</div>
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
export class ProfilePageComponent {
  private readonly auth = inject(AuthService);
  private readonly location = inject(Location);

  protected readonly user = this.auth.currentUser;
  protected readonly avatar = computed(() => this.user()?.avatar ?? '--');
  protected readonly cards = computed(() => [
    { label: 'Rol actual', value: this.user()?.role ?? '-', tone: 'primary' as const },
    { label: 'Usuario', value: this.user()?.username ?? '-', tone: 'neutral' as const },
    { label: 'Correo', value: this.user()?.email ?? '-', tone: 'success' as const },
  ]);

  protected goBack() {
    this.location.back();
  }
}
