import { Component, computed, ElementRef, HostListener, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { BreadcrumbsComponent } from '../compartidos/componentes/breadcrumbs.component';
import { FeedbackComponent } from '../compartidos/componentes/feedback.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CursosLectivosApiService, PeriodoActualApi } from '../nucleo/api/cursos-lectivos-api.service';

@Component({
  selector: 'app-shell',
   imports: [RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent, BreadcrumbsComponent, FeedbackComponent],
  template: `
    <div class="app-shell">
      <app-feedback />
      <a class="skip-link" href="#main-content">Saltar al contenido principal</a>
      <app-header (menuToggle)="sidebarOpen.set(!sidebarOpen())" />
      <div class="app-shell__body">
        <app-sidebar [isOpen]="sidebarOpen()" (close)="sidebarOpen.set(false)" />
        <section class="workspace">
          <header class="workspace__bar">
            <div><span class="workspace__label">IET BI Portal</span><app-breadcrumbs [items]="breadcrumbs()" /></div>
             <span class="workspace__period"><i></i> {{ periodoLabel() }}</span>
          </header>
          <main id="main-content" class="workspace__content" tabindex="-1"><router-outlet /></main>
          <app-footer />
        </section>
      </div>
      @if (sidebarOpen()) { <button type="button" class="shell-overlay" aria-label="Cerrar menú" (click)="sidebarOpen.set(false)"></button> }
    </div>
  `,
  styles: `
    :host { display: block; width: 100%; height: 100vh; height: 100dvh; margin: 0; padding: 0; overflow: hidden; }
    .app-shell { --header-height: 60px; --sidebar-width: 245px; display: grid; grid-template-rows: var(--header-height) minmax(0, 1fr); height: 100%; background: #f6f7fb; }
    .app-shell__body { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 0; }
    .workspace { min-width: 0; min-height: 0; display: grid; grid-template-rows: 58px minmax(0, 1fr) 34px; }
    .workspace__bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .55rem 1.5rem; background: #fff; border-bottom: 1px solid #e5e8ec; }
    .workspace__label { display: block; margin-bottom: .15rem; color: #8996a4; font-size: .67rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
    .workspace__period { display: inline-flex; align-items: center; gap: .5rem; padding: .45rem .7rem; border-radius: 4px; background: #eefaf8; color: #238d78; font-size: .75rem; font-weight: 600; white-space: nowrap; }
    .workspace__period i { width: 7px; height: 7px; border-radius: 50%; background: #2ed8b6; box-shadow: 0 0 0 4px rgba(46,216,182,.15); }
     .workspace__content { min-width: 0; min-height: 0; overflow-x: hidden; overflow-y: auto; padding: 16px 20px; scrollbar-color: #b9cfe4 #f3f5f7; scrollbar-width: auto; }
     .workspace__content::-webkit-scrollbar { width: 10px; }
     .workspace__content::-webkit-scrollbar-track { background: #f3f5f7; }
     .workspace__content::-webkit-scrollbar-thumb { border: 2px solid #f3f5f7; border-radius: 999px; background: #b9cfe4; }
     .workspace__content::-webkit-scrollbar-thumb:hover { background: #4099ff; }
     .workspace__content > router-outlet + * { display: block; min-height: 100%; overflow: visible; }
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
       app-footer { display: none; }
       .workspace__period { max-width: 46vw; overflow: hidden; text-overflow: ellipsis; font-size: .65rem; }
       .workspace__content { padding: 10px; }
    }
  `,
})
// Organiza la estructura general de la aplicación autenticada.
export class EstructuraPrincipalComponent {
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly cursosLectivosApi = inject(CursosLectivosApiService);
  private readonly currentUrl = toSignal(this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), map((event) => event.urlAfterRedirects), startWith(this.router.url)), { initialValue: this.router.url });
  protected readonly sidebarOpen = signal(false);
  private readonly periodoActual = signal<PeriodoActualApi | null>(null);
  protected readonly periodoLabel = computed(() => {
    const periodo = this.periodoActual();
    if (!periodo) return 'Sin periodo activo';
    const semestre = periodo.semestreActual === 'I_SEMESTRE' ? 'Primer semestre' : periodo.semestreActual === 'II_SEMESTRE' ? 'Segundo semestre' : 'Receso académico';
    return `${semestre} ${periodo.anio}`;
  });
  protected readonly breadcrumbs = computed(() => {
    const parts = this.currentUrl().split('?')[0].split('/').filter(Boolean);
    if (!parts.length || parts[0] === 'dashboard') return ['Inicio'];
     const labels: Record<string, string> = { usuarios: 'Usuarios', profesores: 'Profesores', estudiantes: 'Estudiantes', periodos: 'Cursos lectivos', secciones: 'Secciones', grupos: 'Mis grupos', 'registro-academico': 'Registro de bandas', compartir: 'Compartir', matriculas: 'Matrículas', asignaturas: 'Asignaturas', asignaciones: 'Asignación académica', monografias: 'Monografías', grupo: 'Grupo', reportes: 'Reportes', evaluaciones: 'Evaluaciones', ausentismo: 'Ausentismo', 'seccion-guia': 'Mi sección guía', perfil: 'Perfil' };
     if (parts[0] === 'estudiantes' && parts[2] === 'historial') return ['Inicio', 'Estudiantes', 'Historial académico'];
    if (parts[0] === 'reportes' && parts[1]) {
     const reportLabels: Record<string, string> = { asignatura: 'Reporte de asignatura', monografia: 'Reporte de monografía' };
      return ['Inicio', 'Reportes', reportLabels[parts[1]] ?? 'Detalle'];
    }
    return ['Inicio', labels[parts[0]] ?? 'Gestión', ...(parts[1] ? ['Detalle'] : [])];
  });

  constructor() {
    this.cursosLectivosApi.obtenerActual().subscribe({ next: (periodo) => this.periodoActual.set(periodo), error: () => this.periodoActual.set(null) });
  }

  @HostListener('window:keydown', ['$event'])
  protected navegarConFlechas(event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) return;
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName)) return;
    const scroll = (this.elementRef.nativeElement as HTMLElement).querySelector('.workspace__content') as HTMLElement | null;
    if (!scroll || scroll.scrollHeight <= scroll.clientHeight) return;
    const distance = Math.max(80, scroll.clientHeight * .82);
    if (event.key === 'ArrowDown') scroll.scrollBy({ top: 80, behavior: 'smooth' });
    if (event.key === 'ArrowUp') scroll.scrollBy({ top: -80, behavior: 'smooth' });
    if (event.key === 'PageDown') scroll.scrollBy({ top: distance, behavior: 'smooth' });
    if (event.key === 'PageUp') scroll.scrollBy({ top: -distance, behavior: 'smooth' });
    if (event.key === 'Home') scroll.scrollTo({ top: 0, behavior: 'smooth' });
    if (event.key === 'End') scroll.scrollTo({ top: scroll.scrollHeight, behavior: 'smooth' });
    event.preventDefault();
  }
}
