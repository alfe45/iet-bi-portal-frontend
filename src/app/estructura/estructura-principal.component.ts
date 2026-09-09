import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { BreadcrumbsComponent } from '../compartidos/componentes/breadcrumbs.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent, BreadcrumbsComponent],
  template: `
    <div class="app-shell">
      <a class="skip-link" href="#main-content">Saltar al contenido principal</a>
      <app-header (menuToggle)="sidebarOpen.set(!sidebarOpen())" />
      <div class="app-shell__body">
        <app-sidebar [isOpen]="sidebarOpen()" (close)="sidebarOpen.set(false)" />
        <section class="workspace">
          <header class="workspace__bar">
            <div><span class="workspace__label">IET BI Portal</span><app-breadcrumbs [items]="breadcrumbs()" /></div>
            <span class="workspace__period"><i></i> Segundo semestre 2026</span>
          </header>
          <main id="main-content" class="workspace__content" tabindex="-1"><router-outlet /></main>
          <app-footer />
        </section>
      </div>
      @if (sidebarOpen()) { <button type="button" class="shell-overlay" aria-label="Cerrar menú" (click)="sidebarOpen.set(false)"></button> }
    </div>
  `,
  styles: `
    :host { display: block; height: 100vh; height: 100dvh; overflow: hidden; }
    .app-shell { --header-height: 60px; --sidebar-width: 245px; display: grid; grid-template-rows: var(--header-height) minmax(0, 1fr); height: 100%; background: #f6f7fb; }
    .app-shell__body { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 0; }
    .workspace { min-width: 0; min-height: 0; display: grid; grid-template-rows: 58px minmax(0, 1fr) 34px; }
    .workspace__bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .55rem 1.5rem; background: #fff; border-bottom: 1px solid #e5e8ec; }
    .workspace__label { display: block; margin-bottom: .15rem; color: #8996a4; font-size: .67rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
    .workspace__period { display: inline-flex; align-items: center; gap: .5rem; padding: .45rem .7rem; border-radius: 4px; background: #eefaf8; color: #238d78; font-size: .75rem; font-weight: 600; white-space: nowrap; }
    .workspace__period i { width: 7px; height: 7px; border-radius: 50%; background: #2ed8b6; box-shadow: 0 0 0 4px rgba(46,216,182,.15); }
     .workspace__content { min-width: 0; min-height: 0; overflow-x: hidden; overflow-y: auto; padding: 16px 20px; }
     .workspace__content > router-outlet + * { display: block; height: 100%; min-height: 0; overflow: hidden; }
    .shell-overlay { display: none; }
    @media (max-width: 1024px) {
      .app-shell__body { grid-template-columns: 1fr; }
      .workspace { grid-column: 1; }
      .shell-overlay { display: block; position: fixed; inset: 60px 0 0; z-index: 1020; border: 0; background: rgba(13, 25, 39, .28); backdrop-filter: blur(2px); }
       .workspace__content { padding: 12px 16px; }
    }
    @media (max-width: 575.98px) {
      .workspace { grid-template-rows: 52px minmax(0, 1fr); }
      .workspace__bar { padding: .45rem .9rem; }
      .workspace__period, app-footer { display: none; }
       .workspace__content { padding: 10px; }
    }
  `,
})
export class EstructuraPrincipalComponent {
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), map((event) => event.urlAfterRedirects), startWith(this.router.url)), { initialValue: this.router.url });
  protected readonly sidebarOpen = signal(false);
  protected readonly breadcrumbs = computed(() => {
    const parts = this.currentUrl().split('?')[0].split('/').filter(Boolean);
    if (!parts.length || parts[0] === 'dashboard') return ['Inicio'];
     const labels: Record<string, string> = { usuarios: 'Usuarios', profesores: 'Profesores', estudiantes: 'Estudiantes', periodos: 'Periodos académicos', secciones: 'Secciones', grupos: 'Mis grupos', 'registro-academico': 'Registro de bandas', compartir: 'Compartir', matriculas: 'Matrículas', escalas: 'Tipos de escala', asignaturas: 'Asignaturas', asignaciones: 'Asignaciones académicas', monografias: 'Monografías', grupo: 'Grupo', reportes: 'Reportes', evaluaciones: 'Evaluaciones', ausentismo: 'Ausentismo', 'seccion-guia': 'Mi sección guía', perfil: 'Perfil' };
    if (parts[0] === 'reportes' && parts[1]) {
     const reportLabels: Record<string, string> = { asignatura: 'Reporte de asignatura', monografia: 'Reporte de monografía' };
      return ['Inicio', 'Reportes', reportLabels[parts[1]] ?? 'Detalle'];
    }
    return ['Inicio', labels[parts[0]] ?? 'Gestión', ...(parts[1] ? ['Detalle'] : [])];
  });
}
