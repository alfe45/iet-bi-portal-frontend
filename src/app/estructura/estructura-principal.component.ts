import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { BreadcrumbsComponent } from '../compartidos/componentes/breadcrumbs.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent, BreadcrumbsComponent],
  template: `
    <div class="shell">
      <a class="skip-link" href="#main-content">Saltar al contenido principal</a>
      <app-header />

      <div class="shell__toolbar">
        <button type="button" class="ghost-button shell__menu-button" aria-controls="main-navigation" [attr.aria-expanded]="sidebarOpen()" (click)="sidebarOpen.set(true)">Abrir menú</button>
        <app-breadcrumbs [items]="breadcrumbs()" />
      </div>

      <div class="shell__body">
        <app-sidebar [isOpen]="sidebarOpen()" (close)="sidebarOpen.set(false)" />

        <main id="main-content" class="shell__main" tabindex="-1">
          <router-outlet />
          <app-footer />
        </main>
      </div>
    </div>
  `,
  styles: `
    .shell {
      min-height: 100vh;
      padding: 1rem;
      background:
        radial-gradient(circle at top left, rgba(47, 107, 154, 0.08), transparent 28%),
        linear-gradient(180deg, #f5f7fa, #eef4f8 100%);
    }

    .shell__toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0.25rem 0;
    }

    .shell__body {
      display: grid;
      grid-template-columns: 310px minmax(0, 1fr);
      gap: 1.25rem;
      margin-top: 1rem;
      align-items: start;
    }

    .shell__main {
      min-width: 0;
      display: grid;
      gap: 1rem;
    }

    .shell__menu-button {
      display: none;
    }

    @media (max-width: 980px) {
      .shell__toolbar {
        align-items: flex-start;
        flex-direction: column;
      }

      .shell__body {
        grid-template-columns: 1fr;
      }

      .shell__menu-button {
        display: inline-flex;
      }
    }
  `,
})
export class EstructuraPrincipalComponent {
  private readonly auth = inject(AutenticacionService);
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly sidebarOpen = signal(false);
  protected readonly breadcrumbs = computed(() => {
    const parts = this.currentUrl().split('?')[0].split('/').filter(Boolean);
    if (!parts.length || parts[0] === 'dashboard') return ['Inicio'];
    const labels: Record<string, string> = { usuarios: 'Usuarios', profesores: 'Profesores', estudiantes: 'Estudiantes', periodos: 'Periodos académicos', secciones: 'Secciones', matriculas: 'Matrículas', escalas: 'Tipos de escala', asignaturas: 'Asignaturas', asignaciones: 'Asignaciones académicas', monografias: 'Monografías', reportes: 'Reportes', evaluaciones: 'Evaluaciones', ausentismo: 'Ausentismo', 'seccion-guia': 'Mi sección guía', perfil: 'Perfil' };
    if (parts[0] === 'reportes' && parts[1]) return ['Inicio', 'Reportes', parts[1] === 'individual' ? 'Reporte individual' : parts[1] === 'consolidado' ? 'Reporte consolidado de notas' : 'Reporte general de sección'];
    return ['Inicio', labels[parts[0]] ?? 'Gestión', ...(parts[1] ? ['Detalle'] : [])];
  });
}
