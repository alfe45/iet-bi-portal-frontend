import { Component, computed, inject } from '@angular/core';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { PortalDatosService, RegistroPortal } from '../nucleo/datos/portal-datos.service';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-vista-tablero',
  imports: [RouterLink],
  template: `
    <section class="dashboard" aria-labelledby="dashboard-title">
      @if (isAdmin()) {
        <section class="surface admin-hero"><p class="eyebrow">Configuración institucional</p><h2 id="dashboard-title">Control institucional</h2><p>Administra la información académica y la configuración del portal.</p></section>
        <section class="quick-grid" aria-label="Accesos rápidos">
          @for (item of quickLinks(); track item.path) { <a class="quick-card" [routerLink]="item.path"><span class="quick-card__icon" aria-hidden="true">{{ item.icon }}</span><span class="quick-card__copy"><strong>{{ item.label }}</strong><small>{{ item.description }}</small></span><span class="quick-card__arrow" aria-hidden="true">→</span></a> }
        </section>
      } @else {
        <section class="surface teacher-summary">
          <div><p class="eyebrow">Profesor regular</p><h2 id="dashboard-title">{{ teacherName() }}</h2><p class="period-label">Periodo activo: <strong>{{ period() }}</strong></p></div>
          <div class="summary-counts" aria-label="Resumen de asignaciones"><span><strong>{{ subjectCount() }}</strong> asignaturas</span><span><strong>{{ sectionCount() }}</strong> secciones</span><span><strong>{{ studentCount() }}</strong> estudiantes</span></div>
        </section>

        <section class="dashboard-section" aria-labelledby="actions-title"><div class="section-heading"><div><p class="eyebrow">Acciones frecuentes</p><h3 id="actions-title">¿Qué quieres hacer?</h3></div></div><div class="quick-grid">
          @for (item of quickLinks(); track item.path) { <a class="quick-card" [routerLink]="item.path"><span class="quick-card__icon" aria-hidden="true">{{ item.icon }}</span><span class="quick-card__copy"><strong>{{ item.label }}</strong><small>{{ item.description }}</small></span><span class="quick-card__arrow" aria-hidden="true">→</span></a> }
        </div></section>

        <section class="surface assignments" aria-labelledby="assignments-title"><div class="section-heading"><div><p class="eyebrow">Periodo activo</p><h3 id="assignments-title">Mis grupos actuales</h3></div><span class="period-chip">{{ period() }}</span></div><div class="assignment-list">
          @for (assignment of assignments(); track assignment.id) { <div class="assignment-row"><div><strong>{{ assignment['asignatura'] }}</strong><span>{{ assignment['seccion'] }} · {{ studentsFor(assignment['seccion']) }} estudiantes</span></div><a class="ghost-button" [routerLink]="['/grupo']" [queryParams]="groupParams(assignment)">Abrir grupo</a></div> } @empty { <p class="empty-state">No hay asignaciones activas para este periodo.</p> }
        </div></section>
      }
      <section class="surface account-summary" aria-labelledby="account-title"><div><p class="eyebrow">Cuenta</p><h3 id="account-title">{{ teacherName() }}</h3><p>{{ username() }} · {{ email() }}</p></div><span class="account-avatar" aria-hidden="true">{{ initials() }}</span></section>
    </section>
  `,
  styles: `
     .dashboard { display: grid; gap: 1rem; align-content: start; }
     h2,h3,p { margin: 0; }.eyebrow { margin: 0 0 .25rem; text-transform: uppercase; letter-spacing: .12em; font-size: .74rem; color: #2f6b9a; font-weight: 700; }
     .admin-hero { border-left: 5px solid #2f6b9a; }.admin-hero p:last-child { margin-top: .35rem; color: #667085; }
     .teacher-summary { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; padding: 1.1rem 1.3rem; border-left: 5px solid #2f6b9a; }
     .teacher-summary h2 { color: #1e3a5f; font-size: clamp(1.15rem, 2vw, 1.45rem); }.period-label { margin-top: .45rem; color: #667085; }.period-label strong { color: #2f6b9a; }
     .summary-counts { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .45rem 1rem; color: #667085; font-size: .86rem; }.summary-counts span + span { border-left: 1px solid #dbe5ef; padding-left: 1rem; }.summary-counts strong { color: #1e3a5f; font-size: 1.15rem; }
     .dashboard-section { display: grid; gap: .6rem; }.section-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }.section-heading h3 { color: #29344a; }.period-chip { padding: .35rem .65rem; border-radius: 999px; background: #eefaf8; color: #238d78; font-size: .78rem; font-weight: 700; }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.74rem; color: #2f6b9a; font-weight: 700; }
      .quick-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .7rem; }
     .quick-card { min-height: 82px; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: .7rem; padding: .85rem; background: #fff; border: 1px solid #dbe5ef; border-radius: 9px; color: #1e3a5f; text-decoration: none; transition: border-color .18s ease, box-shadow .18s ease; }
     .quick-card:hover { border-color: #4099ff; box-shadow: 0 5px 14px rgba(27,46,94,.1); }
     .quick-card__icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 8px; color: #fff; background: #2f6b9a; font-size: .8rem; font-weight: 800; }
     .quick-card__copy { min-width: 0; }.quick-card strong,.quick-card small { display:block; }.quick-card strong { font-size: 1rem; }.quick-card small { margin-top: .35rem; color: #667085; font-size: .82rem; line-height: 1.35; }
     .quick-card__arrow { color: #4099ff; font-size: 1.35rem; font-weight: 700; }
     .assignments { padding: 1rem 1.15rem; }.assignment-list { display: grid; border-top: 1px solid #e6edf3; }.assignment-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: .75rem 0; border-bottom: 1px solid #e6edf3; }.assignment-row strong,.assignment-row span { display: block; }.assignment-row span { margin-top: .18rem; color: #667085; font-size: .85rem; }.assignment-row .ghost-button { min-height: 34px; padding: .35rem .7rem; font-size: .78rem; }.empty-state { padding: 1rem 0; color: #667085; }
     .account-summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .8rem 1.15rem; }.account-summary h3 { color: #1e3a5f; font-size: 1rem; }.account-summary p:last-child { margin-top: .2rem; color: #667085; font-size: .82rem; }.account-avatar { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; background: #eaf3f8; color: #2f6b9a; font-weight: 800; }
      @media (max-width: 1000px) { .quick-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 700px) { .teacher-summary { align-items: flex-start; flex-direction: column; }.summary-counts { justify-content: flex-start; }.summary-counts span + span { padding-left: .65rem; }.quick-grid { grid-template-columns: 1fr; }.assignment-row { align-items: flex-start; flex-direction: column; }.assignment-row .ghost-button { align-self: stretch; } }
  `,
})
// Presenta el resumen principal del portal.
export class TableroVistaComponent {
   private readonly auth = inject(AutenticacionService);
   private readonly datos = inject(PortalDatosService);
   private readonly grupos = inject(GruposProfesorService);
  protected readonly quickLinks = computed(() => {
    if (this.isAdmin()) return [
      { path: '/usuarios', label: 'Usuarios', description: 'Cuentas y permisos', icon: 'U', featured: true },
      { path: '/profesores', label: 'Profesores', description: 'Personal docente', icon: 'P', featured: false },
      { path: '/estudiantes', label: 'Estudiantes', description: 'Comunidad estudiantil', icon: 'E', featured: false },
      { path: '/periodos', label: 'Cursos lectivos', description: 'Ciclos lectivos', icon: 'T', featured: false },
      { path: '/secciones', label: 'Secciones', description: 'Grupos y profesores guía', icon: 'S', featured: false },
      { path: '/matriculas', label: 'Matrículas', description: 'Inscripciones por periodo', icon: 'M', featured: false },
      { path: '/escalas', label: 'Tipos de escala', description: 'Criterios de evaluación', icon: 'E', featured: false },
      { path: '/asignaturas', label: 'Asignaturas', description: 'Catálogo académico', icon: 'A', featured: false },
      { path: '/asignaciones', label: 'Asignación académica', description: 'Carga docente', icon: 'C', featured: false },
    ];
    return [
      { path: '/registro-academico', label: this.registrationLabel(), description: 'Registrar el trabajo de tus estudiantes.', icon: 'RB', featured: true },
      { path: '/grupos', label: 'Mis grupos', description: 'Abrir una asignatura y sección.', icon: 'GR', featured: false },
      { path: '/estudiantes', label: 'Mis estudiantes', description: 'Consultar estudiantes por grupo.', icon: 'ES', featured: false },
    ];
  });
   protected readonly teacherName = computed(() => {
    const username = this.auth.currentUsername();
    const knownTeacher = this.datos.listar('profesores').find((teacher) => teacher['nombre'] === username)?.['nombre'];
    if (knownTeacher) return knownTeacher;
     if (this.auth.hasRole('Administrador')) return 'Administración general';
     if (this.auth.currentDisplayName()) return this.auth.currentDisplayName();
    return this.datos.listar('asignaciones').find((assignment) => assignment['periodo'] === this.period())?.['profesor'] ?? 'Profesor regular';
  });
  protected readonly username = computed(() => this.auth.currentUsername() || 'usuario.demostracion');
  protected readonly email = computed(() => 'portal@institucion.edu');
  protected readonly initials = computed(() => this.teacherName().split(' ').map((part) => part[0]).slice(0, 2).join(''));
  protected readonly period = computed(() => this.datos.listar('periodos').find((item) => item['estado'] === 'Activo')?.['nombre'] ?? 'Sin periodo activo');
  protected readonly assignments = computed(() => this.datos.listar('asignaciones').filter((item) => item['profesor'] === this.auth.currentUsername() && item['periodo'] === this.period() && item['estado'] === 'Activa'));
  protected readonly sectionCount = computed(() => new Set(this.assignments().map((item) => item['seccion'])).size);
  protected readonly subjectCount = computed(() => new Set(this.assignments().map((item) => item['asignatura'])).size);
  protected readonly studentCount = computed(() => new Set(this.assignments().flatMap((item) => this.datos.estudiantes().filter((student) => student['seccion'] === item['seccion']).map((student) => student.id))).size);
   protected readonly isAdmin = computed(() => this.auth.hasRole('Administrador'));
   protected readonly isGuide = computed(() => this.auth.hasRole('Profesor Guía'));
    protected readonly isMonographCoordinator = computed(() => this.auth.hasRole('Profesor Coordinador de Monografía'));
   private registrationLabel(): string { const subjects = this.grupos.grupos().map((group) => group.asignatura); return subjects.length > 0 && subjects.every((subject) => ['Estudios Sociales', 'Civica', 'Cívica'].includes(subject)) ? 'Registro de notas' : 'Registro de bandas'; }
   protected readonly reportPath = computed(() => this.isGuide() ? '/reportes/bandas' : this.isMonographCoordinator() ? '/monografias' : '/reportes/asignatura');
   protected studentsFor(section: string): number { return this.datos.estudiantes().filter((student) => student['seccion'] === section).length; }
   protected groupParams(assignment: RegistroPortal): Record<string, string> { return { asignatura: assignment['asignatura'], seccion: assignment['seccion'], periodo: assignment['periodo'] }; }
}
