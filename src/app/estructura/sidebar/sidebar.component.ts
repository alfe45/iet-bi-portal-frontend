import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AutenticacionService } from '../../nucleo/autenticacion/autenticacion.service';
import { GruposProfesorService } from '../../nucleo/datos/grupos-profesor.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside id="main-navigation" class="pc-sidebar" [class.pc-sidebar--open]="isOpen()" aria-label="Navegación principal">
      <div class="sidebar__header">
        <div><span>Portal académico</span><strong>Navegación</strong></div>
        <button type="button" class="sidebar__close" aria-label="Cerrar menú principal" (click)="close.emit()">×</button>
      </div>

      <nav class="sidebar__nav">
        @for (section of menu(); track section.title) {
          <div class="sidebar__group">
            <p class="sidebar__group-title">{{ section.title }}</p>

            @for (item of section.items; track item.label) {
              @if (item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="is-active"
                  [routerLinkActiveOptions]="{ exact: true }"
                  #activeLink="routerLinkActive"
                  [attr.aria-current]="activeLink.isActive ? 'page' : null"
                  class="sidebar__link"
                  (click)="close.emit()"
                >
                  <span class="sidebar__icon" aria-hidden="true">{{ item.label.charAt(0) }}</span><span>{{ item.label }}</span>
                </a>
              } @else {
                <button type="button" class="sidebar__link sidebar__link--button">
                  {{ item.label }}
                </button>
              }
            }
          </div>
        }
        <button type="button" class="sidebar__link sidebar__logout" (click)="cerrarSesion()"><span class="sidebar__icon" aria-hidden="true">×</span><span>Cerrar sesión</span></button>
      </nav>
    </aside>
  `,
  styles: `
    :host { display: block; min-height: 0; }
    .pc-sidebar { height: 100%; display: grid; grid-template-rows: auto minmax(0,1fr); overflow: hidden; background: #fff; color: #39465f; box-shadow: 2px 0 2.94px .06px rgba(4,26,55,.16); z-index: 1025; }

    .sidebar__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      min-height: 54px;
      padding: .75rem 1.15rem;
      border-bottom: 1px solid #f0f2f5;
    }

    .sidebar__header span,.sidebar__header strong { display:block; }.sidebar__header span { color:#8996a4; font-size:.66rem; text-transform:uppercase; letter-spacing:.1em; }.sidebar__header strong { color:#29344a; font-size:.85rem; }

    .sidebar__close {
      display: none;
      border: 0;
      background: transparent;
      color: #5b6b79;
      cursor: pointer;
      font-size: 1.35rem;
    }

    .sidebar__nav {
       min-height: 0;
       overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: .8rem;
      padding: .8rem 0;
      overscroll-behavior: contain;
    }

    .sidebar__group {
      display: grid;
      gap: .15rem;
    }

    .sidebar__group-title {
      margin: .45rem 1.25rem .2rem;
      color: #8996a4;
     font-size: .74rem;
      font-weight: 600;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .sidebar__link {
      width: 100%;
      display: flex;
      align-items: center;
      gap: .7rem;
      padding: .62rem 1.1rem;
      border-radius: 0;
      color: #39465f;
      text-decoration: none;
       font-size: .9rem;
      font-weight: 500;
      transition: .15s ease;
      border: 0;
      border-left: 4px solid transparent;
      text-align: left;
    }

    .sidebar__link--button {
      background: transparent;
      cursor: pointer;
    }

    .sidebar__link:hover,
    .sidebar__link.is-active {
      color: #4099ff;
      background: rgba(64,153,255,.09);
      border-left-color: #4099ff;
    }

    .sidebar__icon { flex:0 0 auto; width:24px; height:24px; display:grid; place-items:center; border-radius:4px; color:#5b6b79; background:#f3f5f7; font-size:.7rem; font-weight:600; }
    .is-active .sidebar__icon { color:#fff; background:linear-gradient(45deg,#4099ff,#73b4ff); }
    .sidebar__logout { margin-top:auto; color:#ff5370; background:#fff; }

    @media (max-width: 1024px) {
      :host { position: absolute; }
      .pc-sidebar {
        position: fixed;
        top: 60px;
        bottom: 0;
        left: 0;
        width: 245px;
        height: auto;
        transform: translateX(-102%);
        transition: transform .2s ease;
      }

      .pc-sidebar--open {
        transform: translateX(0);
      }

      .sidebar__close {
        display: inline-flex;
      }
    }
  `,
})
// Construye la navegación lateral según el rol del usuario.
export class SidebarComponent {
  private readonly auth = inject(AutenticacionService);
  private readonly grupos = inject(GruposProfesorService);

  isOpen = input(false);
  close = output<void>();

  protected readonly menu = computed(() => {
     const common = [{ title: 'Principal', items: [{ label: 'Tablero', path: '/dashboard' }] }];
     const teacherWork = { title: 'Mi trabajo', items: [{ label: 'Mis grupos', path: '/grupos' }] };
     const academicLabel = this.registrationLabel();
     const academicRecord = { title: academicLabel, items: [{ label: academicLabel, path: '/registro-academico' }] };
     const communication = { title: 'Comunicación', items: [{ label: 'Compartir archivo', path: '/compartir' }] };
     const account = { title: 'Cuenta', items: [{ label: 'Perfil', path: '/perfil' }] };
    const role = this.auth.currentRole();
    const menus: Record<string, typeof common> = {
       Administrador: [...common, { title: 'Administración', items: [{ label: 'Usuarios', path: '/usuarios' }, { label: 'Profesores', path: '/profesores' }, { label: 'Estudiantes', path: '/estudiantes' }, { label: 'Periodos académicos', path: '/periodos' }, { label: 'Secciones', path: '/secciones' }, { label: 'Matrículas', path: '/matriculas' }, { label: 'Escalas', path: '/escalas' }, { label: 'Asignaturas', path: '/asignaturas' }, { label: 'Asignaciones académicas', path: '/asignaciones' }, { label: 'Asignaciones de monografía', path: '/asignaciones-monografia' }] }],
       'Profesor regular': [...common, teacherWork, academicRecord, communication, account],
           'Profesor Guía': [...common, teacherWork, academicRecord, communication, { title: 'Sección guía', items: [{ label: 'Mi sección guía', path: '/seccion-guia' }, { label: 'Verificar reportes de monografía', path: '/verificacion-monografias' }, { label: 'Reportes de Bandas', path: '/reportes/bandas' }] }, account],
        'Profesor Coordinador de Monografía': [...common, teacherWork, academicRecord, communication, { title: 'Monografías', items: [{ label: 'Mis estudiantes de monografía', path: '/monografias' }] }, account],
    };
    return role ? menus[role] ?? [] : [];
  });

  private registrationLabel(): string {
    const subjects = this.grupos.grupos().map((group) => group.asignatura);
    return subjects.length > 0 && subjects.every((subject) => ['Estudios Sociales', 'Civica', 'Cívica'].includes(subject)) ? 'Registro de notas' : 'Registro de bandas';
  }

  protected cerrarSesion(): void { this.auth.cerrarSesion(); }

}
