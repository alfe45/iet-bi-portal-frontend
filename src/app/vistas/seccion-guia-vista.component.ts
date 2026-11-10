import { Component, effect, inject, signal, untracked, computed } from '@angular/core';
import { EstudianteGuiaApi, ProfesorGuiaApiService } from '../nucleo/api/profesor-guia-api.service';
import { GuiaConsultaService } from '../nucleo/datos/guia-consulta.service';
import { etiquetaEstadoMatricula } from '../nucleo/datos/profesor-regular-context.service';
import { GuiaCriteriosComponent } from '../compartidos/componentes/guia-criterios.component';
import { fechaCostaRica } from '../compartidos/utilidades/fechas';

@Component({
  selector: 'app-vista-seccion-guia',
  imports: [GuiaCriteriosComponent],
  template: `
    <section class="groups-page" aria-labelledby="guide-section-title">
      <header class="surface page-header">
        <div><p class="eyebrow">Profesor Guía</p><h2 id="guide-section-title">Mi sección guía</h2><p>Consulta la sección guía y sus estudiantes.</p></div>
        <span class="period-chip">{{ guia.anio() ? 'Curso lectivo ' + guia.anio() : guia.etiqueta() }}</span>
      </header>
      <app-guia-criterios [conSemestre]="false" />

      @if (guia.seccionActual(); as seccion) {
       <section class="groups-layout">
        <section class="surface group-table">
          <div class="table-head"><strong>Sección</strong><strong>Estudiantes</strong></div>
          @for (section of guia.secciones(); track guia.clave(section)) {
            <div class="group-row" [class.selected]="guia.clave(seccion) === guia.clave(section)">
              <button type="button" class="group-select" (click)="guia.seleccionarSeccion(guia.clave(section))"><strong>{{ section.nombre }}</strong><span>{{ section.nombreGuia || 'Profesor Guía' }}</span></button>
              <span>{{ section.cantidadEstudiantes }}</span>
            </div>
          }
        </section>

        <section class="surface student-panel">
          <div class="panel-heading"><div><p class="eyebrow">Estudiantes de la sección guía</p><h3>{{ seccion.nombre }} · {{ seccion.anio }}</h3></div><span>{{ estudiantes().length }}</span></div>
          <div class="student-list">
            @if (cargandoEstudiantes()) {<p class="empty">Cargando estudiantes...</p>}
            @else if (errorEstudiantes()) {<p class="empty error-text" role="alert">{{ errorEstudiantes() }}</p>}
            @else {@for (student of paginatedStudents(); track student.cedulaEstudiante) {<div><strong>{{ student.nombreEstudiante }}</strong><small>{{ student.cedulaEstudiante }} · Matrícula {{ estado(student) }}</small></div>} @empty {<p class="empty">La sección no tiene estudiantes matriculados.</p>}}
          </div>
          @if (totalPages() > 1) {<div class="pagination"><button type="button" class="ghost-button" [disabled]="studentPage() === 0" (click)="previousPage()">Anterior</button><span>Página {{ studentPage() + 1 }} de {{ totalPages() }}</span><button type="button" class="ghost-button" [disabled]="studentPage() + 1 >= totalPages()" (click)="nextPage()">Siguiente</button></div>}
        </section>
      </section>
      }
    </section>
  `,
  styles: `
    :host .table-head,:host .group-row{grid-template-columns:minmax(0,1fr) 100px}
    .groups-page{display:grid;gap:1rem;align-content:start}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.page-header h2,.page-header p:last-child,.panel-heading h3{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.period-chip{padding:.35rem .65rem;border-radius:999px;background:#eefaf8;color:#1b6f60;font-size:.78rem;font-weight:700}.groups-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:1rem}.table-head,.group-row{display:grid;grid-template-columns:minmax(0,1fr) 100px 125px;gap:1rem;align-items:center}.table-head{padding:.2rem .8rem .65rem;color:#667085;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em}.group-row{padding:.65rem .8rem;border-top:1px solid #e6edf3}.group-row.selected{background:#eaf3f8}.group-row span{color:#525c6b}.group-select{display:grid;gap:.2rem;padding:0;border:0;background:transparent;text-align:left;cursor:pointer}.group-select strong{color:#1e3a5f}.group-select span{font-size:.82rem}.group-row .primary-button{justify-self:end;min-height:34px;padding:.35rem .7rem;font-size:.78rem}.panel-heading{display:flex;justify-content:space-between;gap:1rem}.panel-heading>span{color:#667085}.student-list{display:grid;gap:.45rem;margin-top:1rem}.student-list>div{padding:.6rem .7rem;border:1px solid #e6edf3;border-radius:7px}.student-list strong,.student-list small{display:block}.student-list small{margin-top:.18rem;color:#667085;font-size:.78rem}.pagination{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:1rem;padding-top:.7rem;border-top:1px solid #e6edf3;color:#667085;font-size:.8rem}.pagination .ghost-button{min-height:32px;padding:.3rem .6rem;font-size:.76rem}.error-text{color:#b42318!important}.empty,.error{margin:0;padding:1rem;color:#667085}@media(max-width:800px){.page-header{align-items:flex-start;flex-direction:column}.groups-layout{grid-template-columns:1fr}}
  `,
})
// Guía CU01 y CU02: la sección guía del curso lectivo elegido y sus estudiantes con el estado de la matrícula.
export class SeccionGuiaVistaComponent {
  protected readonly guia = inject(GuiaConsultaService);
  private readonly api = inject(ProfesorGuiaApiService);
  protected readonly estudiantes = signal<EstudianteGuiaApi[]>([]);
  protected readonly cargandoEstudiantes = signal(false);
  protected readonly errorEstudiantes = signal('');
  protected readonly studentPage = signal(0);
  protected readonly pageSize = 5;
  protected readonly paginatedStudents = computed(() => { const start = this.studentPage() * this.pageSize; return this.estudiantes().slice(start, start + this.pageSize); });
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.estudiantes().length / this.pageSize)));
  private carga = 0;

  constructor() {
    this.guia.iniciar();
    effect(() => {
      const seccion = this.guia.seccionActual();
      untracked(() => {
        const carga = ++this.carga;
        this.estudiantes.set([]);
        this.errorEstudiantes.set('');
        this.studentPage.set(0);
        if (!seccion) return;
        this.cargandoEstudiantes.set(true);
        this.api.listarEstudiantes(seccion).subscribe({
          next: (estudiantes) => { if (carga === this.carga) { this.estudiantes.set(estudiantes); this.cargandoEstudiantes.set(false); } },
          error: (error: { error?: { mensaje?: string } }) => { if (carga === this.carga) { this.errorEstudiantes.set(error?.error?.mensaje ?? 'No se pudieron cargar los estudiantes de la sección guía.'); this.cargandoEstudiantes.set(false); } },
        });
      });
    });
  }

  protected estado(student: EstudianteGuiaApi): string {
    const texto = etiquetaEstadoMatricula(student.estado).toLowerCase();
    return student.estado === 'RETIRADA' && student.fechaRetiro ? `${texto} el ${fechaCostaRica(student.fechaRetiro)}` : texto;
  }
  protected previousPage(): void { this.studentPage.update((page) => Math.max(0, page - 1)); }
  protected nextPage(): void { this.studentPage.update((page) => Math.min(this.totalPages() - 1, page + 1)); }
}
