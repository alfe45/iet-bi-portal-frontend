import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PrototypeDataService } from '../../core/data/prototype-data.service';
import { StatGridComponent } from '../../shared/components/ui-kit.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [StatGridComponent, RouterLink],
  template: `
    <section class="page-grid" aria-labelledby="dashboard-title">
      <section class="surface hero-panel" [class.hero-panel--teacher]="!isAdmin()">
        <div>
          <p class="eyebrow">{{ isAdmin() ? 'Configuración institucional' : 'Periodo activo · Segundo semestre 2026' }}</p>
          <h2 id="dashboard-title">{{ dashboard().heroTitle }}</h2>
          <p>{{ dashboard().heroText }}</p>
        </div>
      </section>

      @if (isAdmin()) {
        <app-stat-grid [cards]="dashboard().cards" />
      } @else {
        <section class="work-grid" aria-label="Acciones principales">
          <a class="work-card work-card--primary" routerLink="/evaluaciones">
            <span class="work-card__number">01</span>
            <div><strong>Registrar evaluaciones</strong><p>Seleccione una asignatura y califique a sus estudiantes.</p></div>
            <span aria-hidden="true">→</span>
          </a>
          <a class="work-card" routerLink="/ausentismo">
            <span class="work-card__number">02</span>
            <div><strong>Registrar ausentismo</strong><p>Actualice tardías y ausencias del periodo vigente.</p></div>
            <span aria-hidden="true">→</span>
          </a>
          <a class="work-card" routerLink="/estudiantes">
            <span class="work-card__number">03</span>
            <div><strong>Consultar estudiantes</strong><p>Revise únicamente los grupos asociados a su carga académica.</p></div>
            <span aria-hidden="true">→</span>
          </a>
          <a class="work-card" [routerLink]="isGuide() ? '/reportes/individual' : isMonographGuide() ? '/monografias/reportes' : '/reportes'">
            <span class="work-card__number">04</span>
            <div><strong>{{ isGuide() ? 'Reportes de la sección guía' : isMonographGuide() ? 'Reportes de monografía' : 'Reporte de mi asignatura' }}</strong><p>Prepare la información académica correspondiente.</p></div>
            <span aria-hidden="true">→</span>
          </a>
        </section>

        @if (isGuide()) {
          <section class="surface guide-callout">
            <div><p class="eyebrow">Responsabilidad adicional</p><h3>Sección guía 11-1</h3><p>Consulte el expediente integral y los reportes consolidados de su sección.</p></div>
            <a class="primary-button" routerLink="/seccion-guia">Abrir mi sección guía</a>
          </section>
        }
      }
    </section>
  `,
  styles: `
    .hero-panel { display: grid; gap: 1rem; border-left: 5px solid #2f6b9a; }
    .hero-panel--teacher { padding: clamp(1.5rem, 4vw, 2.6rem); background: linear-gradient(120deg, #1e3a5f, #285d85); color: #fff; border: 0; }
    .hero-panel--teacher p, .hero-panel--teacher .eyebrow { color: #dcebf5; }
    .hero-panel h2, .hero-panel p, .eyebrow { margin: 0; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.74rem; color: #2f6b9a; font-weight: 700; }
    .work-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .work-card { min-height: 150px; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1rem; padding: 1.35rem; background: #fff; border: 1px solid #dbe5ef; border-radius: 12px; color: #1e3a5f; text-decoration: none; transition: transform .18s ease, border-color .18s ease; }
    .work-card:hover { transform: translateY(-2px); border-color: #2f6b9a; }
    .work-card--primary { background: #eaf3f8; }
    .work-card__number { color: #2f6b9a; font-size: .8rem; font-weight: 800; }
    .work-card strong { display: block; font-size: 1.08rem; }
    .work-card p { margin: .4rem 0 0; color: #667085; }
    .guide-callout { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .guide-callout h3, .guide-callout p { margin: 0; }
    @media (max-width: 760px) { .work-grid { grid-template-columns: 1fr; } .guide-callout { align-items: flex-start; flex-direction: column; } }
  `,
})
export class DashboardPageComponent {
  private readonly auth = inject(AuthService);
  private readonly data = inject(PrototypeDataService);

  protected readonly dashboard = computed(() => this.data.getDashboard(this.auth.currentRole() ?? 'Administrador'));
  protected readonly isAdmin = computed(() => this.auth.currentRole() === 'Administrador');
  protected readonly isGuide = computed(() => this.auth.currentRole() === 'Profesor Guía');
  protected readonly isMonographGuide = computed(() => this.auth.currentRole() === 'Profesor Guía de Monografía');
}
