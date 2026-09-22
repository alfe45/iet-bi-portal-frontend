import { Component, computed, inject, signal } from '@angular/core';
import { GruposProfesorService, GrupoTrabajo } from '../nucleo/datos/grupos-profesor.service';
import { PortalDatosService } from '../nucleo/datos/portal-datos.service';

@Component({
  selector: 'app-vista-seccion-guia',
  imports: [],
  template: `
    <section class="groups-page" aria-labelledby="guide-section-title">
      <header class="surface page-header">
        <div><p class="eyebrow">Periodo activo</p><h2 id="guide-section-title">Mi sección guía</h2><p>Consulta la sección guía y sus estudiantes.</p></div>
        <span class="period-chip">{{ grupos.periodoActivo() }}</span>
      </header>

      <section class="groups-layout">
        <section class="surface group-table">
          <div class="table-head"><strong>Asignatura</strong><strong>Sección</strong><strong>Estudiantes</strong><span></span></div>
          @for (group of guideGroups(); track group.id) {
            <div class="group-row" [class.selected]="selectedId() === group.id">
              <button type="button" class="group-select" (click)="seleccionar(group)"><strong>{{ group.asignatura }}</strong><span>{{ group.seccion }}</span></button>
              <span>{{ group.estudiantes.length }}</span>
              <button type="button" class="primary-button" (click)="seleccionar(group)">Ver estudiantes</button>
            </div>
          } @empty {
            <p class="empty">No hay asignaciones para la sección guía en el periodo actual.</p>
          }
       </section>

        <section class="surface student-panel">
          <div class="panel-heading"><div><p class="eyebrow">Estudiantes de la sección guía</p><h3>{{ selectedGroup()?.asignatura }} · {{ selectedGroup()?.seccion }}</h3></div><span>{{ selectedGroup()?.estudiantes?.length ?? 0 }}</span></div>
          <div class="student-list">
            @for (student of paginatedStudents(); track student.id) {<div><strong>{{ student['nombre'] }}</strong><small>{{ student['cedula'] }} · {{ student['correo'] }}</small></div>}
            @empty {<p class="empty">Selecciona una asignatura para consultar sus estudiantes.</p>}
          </div>
          @if (totalPages() > 1) {<div class="pagination"><button type="button" class="ghost-button" [disabled]="studentPage() === 0" (click)="previousPage()">Anterior</button><span>Página {{ studentPage() + 1 }} de {{ totalPages() }}</span><button type="button" class="ghost-button" [disabled]="studentPage() + 1 >= totalPages()" (click)="nextPage()">Siguiente</button></div>}
        </section>
      </section>
    </section>
  `,
   styles: `
    .groups-page{display:grid;gap:1rem;align-content:start}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.page-header h2,.page-header p:last-child,.panel-heading h3{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.period-chip{padding:.35rem .65rem;border-radius:999px;background:#eefaf8;color:#238d78;font-size:.78rem;font-weight:700}.groups-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:1rem}.table-head,.group-row{display:grid;grid-template-columns:minmax(0,1fr) 100px 125px;gap:1rem;align-items:center}.table-head{padding:.2rem .8rem .65rem;color:#667085;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em}.group-row{padding:.65rem .8rem;border-top:1px solid #e6edf3}.group-row.selected{background:#eaf3f8}.group-row span{color:#667085}.group-select{display:grid;gap:.2rem;padding:0;border:0;background:transparent;text-align:left;cursor:pointer}.group-select strong{color:#1e3a5f}.group-select span{font-size:.82rem}.group-row .primary-button{justify-self:end;min-height:34px;padding:.35rem .7rem;font-size:.78rem}.panel-heading{display:flex;justify-content:space-between;gap:1rem}.panel-heading>span{color:#667085}.student-list{display:grid;gap:.45rem;margin-top:1rem}.student-list>div{padding:.6rem .7rem;border:1px solid #e6edf3;border-radius:7px}.student-list strong,.student-list small{display:block}.student-list small{margin-top:.18rem;color:#667085;font-size:.78rem}.pagination{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:1rem;padding-top:.7rem;border-top:1px solid #e6edf3;color:#667085;font-size:.8rem}.pagination .ghost-button{min-height:32px;padding:.3rem .6rem;font-size:.76rem}.empty{margin:0;padding:1rem;color:#667085}@media(max-width:800px){.groups-layout{grid-template-columns:1fr}}
  `,
})
// Muestra la guía y la información de una sección.
export class SeccionGuiaVistaComponent {
   protected readonly grupos = inject(GruposProfesorService);
  private readonly datos = inject(PortalDatosService);
  protected readonly guideGroups = computed(() => {
    const assignedSections = this.datos.seccionesGuiadasPorProfesor(this.grupos.profesor());
    return this.grupos.grupos().filter((group) => assignedSections.length > 0 ? assignedSections.includes(group.seccion) : group.seccion === '11-1');
  });
  protected readonly selectedId = signal(this.guideGroups()[0]?.id ?? '');
  protected readonly selectedGroup = computed(() => this.guideGroups().find((group) => group.id === this.selectedId()) ?? this.guideGroups()[0]);
  protected readonly studentPage = signal(0);
  protected readonly pageSize = 5;
  protected readonly paginatedStudents = computed(() => { const students = this.selectedGroup()?.estudiantes ?? []; const start = this.studentPage() * this.pageSize; return students.slice(start, start + this.pageSize); });
   protected readonly totalPages = computed(() => Math.ceil((this.selectedGroup()?.estudiantes.length ?? 0) / this.pageSize));
  protected seleccionar(group: GrupoTrabajo): void { this.grupos.seleccionar(group); this.selectedId.set(group.id); this.studentPage.set(0); }
  protected previousPage(): void { this.studentPage.update((page) => Math.max(0, page - 1)); }
  protected nextPage(): void { this.studentPage.update((page) => Math.min(this.totalPages() - 1, page + 1)); }
}
