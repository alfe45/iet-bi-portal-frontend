import { Component, computed, inject, signal } from '@angular/core';
import { switchMap } from 'rxjs';
import { EstudianteGuiaApi, PeriodoGuiaApi, ProfesorGuiaApiService, SeccionGuiaApi } from '../nucleo/api/profesor-guia-api.service';

@Component({
  selector: 'app-vista-seccion-guia',
  imports: [],
  template: `
    <section class="groups-page" aria-labelledby="guide-section-title">
      <header class="surface page-header">
        <div><p class="eyebrow">Periodo activo</p><h2 id="guide-section-title">Mi sección guía</h2><p>Consulta la sección guía y sus estudiantes.</p></div>
        <span class="period-chip">{{ periodoEtiqueta() }}</span>
      </header>

      @if (error()) { <p class="surface error" role="alert">{{ error() }}</p> }
      <section class="groups-layout">
        <section class="surface group-table">
          <div class="table-head"><strong>Sección</strong><strong>Estudiantes</strong></div>
          @if (cargandoSecciones()) { <p class="empty">Cargando sección guía...</p> }
          @else {
            @for (section of secciones(); track clave(section)) {
              <div class="group-row" [class.selected]="clave(seccionActual()) === clave(section)">
                <button type="button" class="group-select" (click)="seleccionar(section)"><strong>{{ section.nombre }}</strong><span>{{ section.nombreGuia || 'Profesor Guía' }}</span></button>
                <span>{{ section.cantidadEstudiantes }}</span>
              </div>
            } @empty { <p class="empty">No hay una sección guía asignada en el periodo actual.</p> }
          }
        </section>

        <section class="surface student-panel">
          <div class="panel-heading"><div><p class="eyebrow">Estudiantes de la sección guía</p><h3>{{ seccionActual()?.nombre || 'Sin sección seleccionada' }}</h3></div><span>{{ estudiantes().length }}</span></div>
          <div class="student-list">
            @if (cargandoEstudiantes()) {<p class="empty">Cargando estudiantes...</p>}
            @else {@for (student of paginatedStudents(); track student.cedulaEstudiante) {<div><strong>{{ student.nombreEstudiante }}</strong><small>{{ student.cedulaEstudiante }} · {{ student.estado }}</small></div>} @empty {<p class="empty">No hay estudiantes matriculados en la sección seleccionada.</p>}}
          </div>
          @if (totalPages() > 1) {<div class="pagination"><button type="button" class="ghost-button" [disabled]="studentPage() === 0" (click)="previousPage()">Anterior</button><span>Página {{ studentPage() + 1 }} de {{ totalPages() }}</span><button type="button" class="ghost-button" [disabled]="studentPage() + 1 >= totalPages()" (click)="nextPage()">Siguiente</button></div>}
        </section>
      </section>
    </section>
  `,
  styles: `
    :host .table-head,:host .group-row{grid-template-columns:minmax(0,1fr) 100px}
    .groups-page{display:grid;gap:1rem;align-content:start}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.page-header h2,.page-header p:last-child,.panel-heading h3{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.period-chip{padding:.35rem .65rem;border-radius:999px;background:#eefaf8;color:#1b6f60;font-size:.78rem;font-weight:700}.groups-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:1rem}.table-head,.group-row{display:grid;grid-template-columns:minmax(0,1fr) 100px 125px;gap:1rem;align-items:center}.table-head{padding:.2rem .8rem .65rem;color:#667085;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em}.group-row{padding:.65rem .8rem;border-top:1px solid #e6edf3}.group-row.selected{background:#eaf3f8}.group-row span{color:#525c6b}.group-select{display:grid;gap:.2rem;padding:0;border:0;background:transparent;text-align:left;cursor:pointer}.group-select strong{color:#1e3a5f}.group-select span{font-size:.82rem}.group-row .primary-button{justify-self:end;min-height:34px;padding:.35rem .7rem;font-size:.78rem}.panel-heading{display:flex;justify-content:space-between;gap:1rem}.panel-heading>span{color:#667085}.student-list{display:grid;gap:.45rem;margin-top:1rem}.student-list>div{padding:.6rem .7rem;border:1px solid #e6edf3;border-radius:7px}.student-list strong,.student-list small{display:block}.student-list small{margin-top:.18rem;color:#667085;font-size:.78rem}.pagination{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:1rem;padding-top:.7rem;border-top:1px solid #e6edf3;color:#667085;font-size:.8rem}.pagination .ghost-button{min-height:32px;padding:.3rem .6rem;font-size:.76rem}.empty,.error{margin:0;padding:1rem;color:#667085}@media(max-width:800px){.page-header{align-items:flex-start;flex-direction:column}.groups-layout{grid-template-columns:1fr}}
  `,
})
// Consulta la sección asignada al Profesor Guía sin mezclarla con sus grupos regulares.
export class SeccionGuiaVistaComponent {
  private readonly api = inject(ProfesorGuiaApiService);
  private readonly periodo = signal<PeriodoGuiaApi | null>(null);
  protected readonly secciones = signal<SeccionGuiaApi[]>([]);
  protected readonly estudiantes = signal<EstudianteGuiaApi[]>([]);
  private readonly seleccion = signal('');
  protected readonly cargandoSecciones = signal(true);
  protected readonly cargandoEstudiantes = signal(false);
  protected readonly error = signal('');
  protected readonly studentPage = signal(0);
  protected readonly pageSize = 5;
  protected readonly seccionActual = computed(() => this.secciones().find((section) => this.clave(section) === this.seleccion()) ?? this.secciones()[0]);
  protected readonly periodoEtiqueta = computed(() => this.etiquetaPeriodo(this.periodo()));
  protected readonly paginatedStudents = computed(() => { const start = this.studentPage() * this.pageSize; return this.estudiantes().slice(start, start + this.pageSize); });
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.estudiantes().length / this.pageSize)));

  constructor() {
    this.api.obtenerPeriodoActual().pipe(
      switchMap((periodo) => { this.periodo.set(periodo); return this.api.listarSecciones(periodo.anio); }),
    ).subscribe({
      next: (secciones) => {
        this.secciones.set(secciones);
        this.cargandoSecciones.set(false);
        if (secciones[0]) this.seleccionar(secciones[0]);
      },
      error: () => { this.error.set('No se pudo cargar la sección guía del profesor.'); this.cargandoSecciones.set(false); },
    });
  }

  protected seleccionar(section: SeccionGuiaApi): void {
    const key = this.clave(section);
    this.seleccion.set(key);
    this.estudiantes.set([]);
    this.studentPage.set(0);
    this.cargandoEstudiantes.set(true);
    this.api.listarEstudiantes(section).subscribe({
      next: (estudiantes) => { if (this.seleccion() === key) { this.estudiantes.set(estudiantes); this.cargandoEstudiantes.set(false); } },
      error: () => { if (this.seleccion() === key) { this.error.set('No se pudieron cargar los estudiantes de la sección guía.'); this.cargandoEstudiantes.set(false); } },
    });
  }

  protected clave(section: SeccionGuiaApi | undefined): string { return section ? `${section.anio}-${section.nivel}-${section.numero}` : ''; }
  protected previousPage(): void { this.studentPage.update((page) => Math.max(0, page - 1)); }
  protected nextPage(): void { this.studentPage.update((page) => Math.min(this.totalPages() - 1, page + 1)); }

  private etiquetaPeriodo(periodo: PeriodoGuiaApi | null): string {
    if (!periodo) return 'Periodo actual';
    const semestre = periodo.semestreActual === 'I_SEMESTRE' ? 'Primer semestre' : periodo.semestreActual === 'II_SEMESTRE' ? 'Segundo semestre' : 'Receso académico';
    return `${semestre} ${periodo.anio}`;
  }
}
