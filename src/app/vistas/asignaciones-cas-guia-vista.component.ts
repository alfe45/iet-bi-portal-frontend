import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AsignacionesApiService } from '../nucleo/api/asignaciones-api.service';
import { ProfesoresApiService } from '../nucleo/api/profesores-api.service';
import { SeccionesApiService, SeccionApi } from '../nucleo/api/secciones-api.service';
import { FeedbackService } from '../compartidos/servicios/feedback.service';

interface ProfesorAsignable {
  id: string | number;
  cedula: string;
  nombre: string;
}

interface AssignmentRow {
  id: string;
  cedula?: string;
  profesor: string;
  estudiante?: string;
  responsabilidad?: string;
  seccion: string;
  estado?: string;
  anio?: number;
  nivel?: number;
  numero?: number;
  cantidadEstudiantes?: number;
}

interface AssignmentDraft {
  id?: string;
  cedula?: string;
  profesor?: string;
  seccion?: string;
  responsabilidad?: string;
}

@Component({
  selector: 'app-vista-asignaciones-cas-guia',
  imports: [FormsModule],
  template: `
    <section class="assignment-page" aria-labelledby="assignment-title">
         <header class="surface page-header">
           <div><p class="eyebrow">Administración</p><h2 id="assignment-title">{{ isGuide ? 'Asignación de profesores guía' : 'Asignación de profesores CAS' }}</h2><p>{{ isGuide ? 'Asigne un profesor guía a una sección académica.' : 'Asigne la materia CAS a un profesor por sección.' }}</p></div>
             <button type="button" class="primary-button" [disabled]="isGuide ? !seccionesDisponibles().length : !casLoaded()" (click)="nuevo()">{{ isGuide ? 'Asignar profesor guía' : 'Asignar profesor CAS' }}</button>
         </header>

       <section class="surface assignment-list" [class.assignment-list--cas]="!isGuide">
            @if (isGuide) {
              <div class="table-head guide-table-head"><strong>Profesor</strong><strong>Año</strong><strong>Sección</strong><strong>Tipo</strong><strong></strong></div>
            } @else {
              <div class="table-head"><strong>Sección</strong><strong>Profesor</strong><strong>Estudiantes</strong><strong>Estado</strong><strong></strong></div>
            }
          @for (item of assignments(); track item.id) {
            @if (isGuide) {
              <div class="assignment-row guide-assignment-row">
                <div><strong>{{ item.profesor }}</strong><small>{{ item.cedula }}</small></div>
                <span>{{ item.anio }}</span>
                <span>{{ item.seccion }}</span>
                <span>Profesor Guía</span>
                 <div class="row-actions">@if (item.cedula) {<button type="button" class="ghost-button" (click)="editar(item)">Editar</button><button type="button" class="danger-button" (click)="eliminar(item)">Eliminar</button>} @else {<button type="button" class="primary-button" (click)="nuevoParaSeccion(item)">Asignar</button>}</div>
              </div>
            } @else {
              <div class="assignment-row">
                <div><strong>{{ item.seccion }}</strong><small>Asignatura CAS</small></div>
                <span>{{ item.profesor }}</span>
                <span>{{ (item.cantidadEstudiantes ?? 0) + ' estudiantes' }}</span>
                <span>{{ item.estado || 'Activo' }}</span>
                 <div class="row-actions">@if (item.cedula) {<button type="button" class="ghost-button" (click)="editar(item)">Editar</button><button type="button" class="danger-button" (click)="eliminar(item)">Eliminar</button>} @else {<button type="button" class="primary-button" (click)="nuevoParaSeccion(item)">Asignar</button>}</div>
              </div>
            }
        } @empty { <p class="empty">No hay asignaciones registradas.</p> }
      </section>

      @if (editorOpen()) {
        <div class="modal-backdrop" role="presentation">
          <form class="editor-modal" (ngSubmit)="guardar()" novalidate>
             <div class="modal-heading"><div><p class="eyebrow">{{ isGuide ? 'Asignación de guía' : 'Coordinación CAS' }}</p><h3>{{ editingId() ? 'Editar asignación' : 'Nueva asignación' }}</h3><p class="required-legend">* Campos obligatorios</p></div><button type="button" class="close-button" (click)="cerrar()">×</button></div>
             <div class="form-grid">
                 <label>Profesor<select name="profesor" [(ngModel)]="draft.cedula" (ngModelChange)="seleccionarProfesor($event)" required><option value="">Seleccione un profesor</option>@for (teacher of teachers(); track teacher.id) {<option [value]="teacher.cedula">{{ teacher.nombre }}</option>}</select></label>
                @if (isGuide) { <label>Responsabilidad<select name="responsabilidad" [(ngModel)]="draft.responsabilidad" (ngModelChange)="cambioResponsabilidad($event)" required><option value="Profesor Guía">Profesor Guía</option></select></label> }
                 <label>Sección<select name="seccion" [(ngModel)]="draft.seccion" [disabled]="!!editingId()" required><option value="">Seleccione una sección</option>@for (section of seccionesDisponibles(); track section.idSeccion) {<option [value]="sectionKey(section)">{{ section.anio }} · {{ section.nombre }}</option>}</select></label>
            </div>
            <div class="modal-actions"><button type="button" class="ghost-button" (click)="cerrar()">Cancelar</button><button type="submit" class="primary-button">Guardar asignación</button></div>
          </form>
        </div>
      }
    </section>
  `,
   styles: `
     .assignment-list--cas .table-head,.assignment-list--cas .assignment-row{grid-template-columns:1.25fr 1.35fr 1fr 100px 180px}.assignment-list:not(.assignment-list--cas) .table-head,.assignment-list:not(.assignment-list--cas) .assignment-row{grid-template-columns:1.35fr 1fr 1fr 1fr 180px}
    .assignment-page{display:grid;gap:1rem;align-content:start}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.page-header h2,.page-header p:last-child{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.assignment-list{padding:1rem 1.2rem}.table-head,.assignment-row{display:grid;grid-template-columns:1.35fr 1.2fr 1.2fr 180px;gap:1rem;align-items:center}.table-head{padding:.2rem 0 .65rem;color:#667085;font-size:.75rem;text-transform:uppercase}.assignment-row{padding:.75rem 0;border-top:1px solid #e6edf3}.assignment-row strong,.assignment-row small{display:block}.assignment-row small{margin-top:.15rem;color:#667085}.assignment-row span{color:#475467}.row-actions{display:flex;justify-content:flex-end;gap:.45rem}.danger-button{border:0;border-radius:5px;padding:.5rem .7rem;background:#fff0f1;color:#b42318;font:inherit;font-size:.76rem;font-weight:700;cursor:pointer}.empty{padding:1rem 0;color:#667085}.modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;align-items:center;justify-content:center;padding:1rem;background:rgba(13,25,39,.52)}.editor-modal{width:min(100%,620px);padding:1.2rem;border-radius:10px;background:#fff;box-shadow:0 20px 60px rgba(4,26,55,.3)}.modal-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem}.modal-heading h3{margin:0;color:#1e3a5f}.close-button{width:32px;height:32px;border:0;border-radius:50%;background:#f2f5f7;color:#667085;font-size:1.25rem;cursor:pointer}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.form-grid label{display:grid;gap:.4rem;font-weight:700}.form-grid select{width:100%;box-sizing:border-box;border:1px solid #cfdbe5;border-radius:5px;padding:.55rem;background:#fff;font:inherit;color:#25364a}.modal-actions{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1rem}@media(max-width:700px){.page-header{align-items:flex-start;flex-direction:column}.table-head{display:none}.assignment-row{grid-template-columns:1fr;gap:.35rem}.row-actions{justify-content:stretch}.row-actions button{flex:1}.form-grid{grid-template-columns:1fr}}
  `,
})
export class AsignacionesCasGuiaVistaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly asignacionesApi = inject(AsignacionesApiService);
  private readonly profesoresApi = inject(ProfesoresApiService);
  private readonly seccionesApi = inject(SeccionesApiService);
  private readonly feedback = inject(FeedbackService);
  protected readonly isGuide = this.route.snapshot.data['assignmentMode'] === 'guide';
  protected readonly assignments = computed<AssignmentRow[]>(() => this.isGuide ? this.apiGuideAssignments() : this.apiCasAssignments());
  private readonly apiTeachers = signal<ProfesorAsignable[]>([]);
  private readonly apiSections = signal<SeccionApi[]>([]);
  private readonly apiGuideAssignments = signal<AssignmentRow[]>([]);
  private readonly apiCasAssignments = signal<AssignmentRow[]>([]);
   protected readonly casLoaded = signal(false);
  protected readonly teachers = computed<ProfesorAsignable[]>(() => this.apiTeachers());
  protected readonly sections = computed(() => this.apiSections());
  protected readonly seccionesDisponibles = computed(() => {
    if (this.editingId()) return this.sections();
    if (this.isGuide) return this.sections().filter((section) => !section.cedulaGuia);
    const occupied = new Set(this.apiCasAssignments().filter((item) => item.cedula).map((item) => `${item.anio}-${item.nivel}-${item.numero}`));
    return this.sections().filter((section) => !occupied.has(this.sectionKey(section)));
  });
  protected readonly puedeCrear = computed(() => this.seccionesDisponibles().length > 0 && (this.isGuide || this.casLoaded()));
  protected readonly editorOpen = signal(false);
  protected readonly editingId = signal('');
  protected draft: AssignmentDraft = {};

  constructor() {
    this.profesoresApi.listar().subscribe({ next: (items) => this.apiTeachers.set(items.filter((item) => item.activo).map((item) => ({ id: item.idProfesor, cedula: item.cedula, nombre: [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' ') }))), error: () => this.feedback.error('No se pudieron cargar los profesores disponibles.') });
    this.seccionesApi.listarPaginado({ pagina: 1, tamanoPagina: 100 }).subscribe({ next: (response) => {
      this.apiSections.set(response.elementos);
      if (this.isGuide) this.apiGuideAssignments.set(this.mapGuideAssignments(response.elementos));
      else this.cargarAsignacionesCas(response.elementos);
    }, error: () => this.feedback.error('No se pudieron cargar las secciones.') });
  }

   protected nuevo(): void {
     if (!this.isGuide && !this.casLoaded()) { this.feedback.error('Las asignaciones CAS todavía se están cargando.', 'Espere un momento'); return; }
     this.editingId.set('');
     const section = this.seccionesDisponibles()[0];
     if (!section) { this.feedback.error(this.isGuide ? 'Todas las secciones ya tienen profesor guía asignado.' : 'Todas las secciones ya tienen profesor CAS asignado. Use «Editar» en una fila para cambiarlo.', 'No hay secciones disponibles'); return; }
    const assignedGuideCedulas = new Set(this.sections().filter((item) => item.cedulaGuia).map((item) => item.cedulaGuia));
    const teacher = this.isGuide ? this.teachers().find((item) => !assignedGuideCedulas.has(item.cedula)) ?? this.teachers()[0] : this.teachers()[0];
    this.draft = { cedula: teacher?.cedula ?? '', profesor: teacher?.nombre ?? '', responsabilidad: 'Profesor Guía', seccion: section ? this.sectionKey(section) : '' };
    this.editorOpen.set(true);
  }

  protected nuevoParaSeccion(item: AssignmentRow): void {
    this.nuevo();
    this.draft.seccion = `${item.anio}-${item.nivel}-${item.numero}`;
  }

  protected editar(item: AssignmentRow): void {
    this.editingId.set(item.id);
    this.draft = { id: item.id, cedula: item.cedula, profesor: item.profesor, responsabilidad: 'Profesor Guía', seccion: `${item.anio}-${item.nivel}-${item.numero}` };
    this.editorOpen.set(true);
  }

  protected seleccionarProfesor(cedula: string): void { this.draft.cedula = cedula; this.draft.profesor = this.teachers().find((teacher) => teacher.cedula === cedula)?.nombre ?? ''; }

  protected cambioResponsabilidad(responsabilidad: string): void { if (responsabilidad === 'Profesor Guía' && !this.draft.seccion) this.draft.seccion = this.sections()[0] ? this.sectionKey(this.sections()[0]) : ''; }

  protected guardar(): void {
    if (!this.draft.cedula || !this.draft.seccion) return;
    const [anio, nivel, numero] = String(this.draft.seccion).split('-').map(Number);
    if (this.isGuide) {
      this.seccionesApi.asignarGuia(anio, nivel, numero, this.draft.cedula).subscribe({ next: () => { this.feedback.exito('El profesor guía fue asignado.'); this.cargarGuias(); this.cerrar(); }, error: (error) => this.feedback.error(error.error?.mensaje ?? 'No se pudo asignar el profesor guía.') });
      return;
    }
    const current = this.editingId() ? this.apiCasAssignments().find((item) => item.id === this.editingId()) : undefined;
    const operation = current
      ? this.asignacionesApi.cambiarProfesor(current.anio!, current.nivel!, current.numero!, 'CAS', current.cedula!, this.draft.cedula)
      : this.asignacionesApi.registrar({ anio, nivel, numero, codigoAsignatura: 'CAS', cedulaProfesor: this.draft.cedula });
    operation.subscribe({ next: () => { this.feedback.exito(current ? 'El profesor CAS fue actualizado.' : 'El profesor CAS fue asignado.'); this.cargarAsignacionesCas(this.apiSections()); this.cerrar(); }, error: (error) => this.feedback.error(error.error?.mensaje ?? 'No se pudo guardar la asignación CAS.') });
  }

  private cargarGuias(): void { this.seccionesApi.listarPaginado({ pagina: 1, tamanoPagina: 100 }).subscribe({ next: (response) => { this.apiSections.set(response.elementos); this.apiGuideAssignments.set(this.mapGuideAssignments(response.elementos)); }, error: () => this.feedback.error('No se pudieron actualizar las asignaciones de profesores guía.') }); }

  protected async eliminar(item: AssignmentRow): Promise<void> {
    if (!await this.feedback.confirmar(`¿Eliminar la asignación de ${item.profesor}?`, 'Eliminar asignación', 'Eliminar')) return;
    if (this.isGuide) {
      this.seccionesApi.quitarGuia(item.anio!, item.nivel!, item.numero!).subscribe({ next: () => { this.feedback.exito('La asignación de guía fue eliminada.'); this.cargarGuias(); }, error: (error) => this.feedback.error(error.error?.mensaje ?? 'No se pudo eliminar la asignación de guía.') });
      return;
    }
    this.asignacionesApi.borrar(item.anio!, item.nivel!, item.numero!, 'CAS', item.cedula!).subscribe({ next: () => { this.feedback.exito('La asignación CAS fue eliminada.'); this.cargarAsignacionesCas(this.apiSections()); }, error: (error) => this.feedback.error(error.error?.mensaje ?? 'No se pudo eliminar la asignación CAS.') });
  }

  protected sectionKey(section: SeccionApi): string { return `${section.anio}-${section.nivel}-${section.numero}`; }

   private mapGuideAssignments(sections: SeccionApi[]): AssignmentRow[] {
      return sections.map((item) => ({ id: this.sectionKey(item), anio: item.anio, nivel: item.nivel, numero: item.numero, cedula: item.cedulaGuia ?? undefined, profesor: item.nombreGuia ?? 'Sin asignar', seccion: item.nombre, responsabilidad: 'Profesor Guía', estado: item.cedulaGuia ? 'Activo' : 'Pendiente' }))
        .sort((a, b) => Number(Boolean(a.cedula)) - Number(Boolean(b.cedula)) || String(a.seccion).localeCompare(String(b.seccion), 'es'));
   }

  private cargarAsignacionesCas(sections: SeccionApi[]): void {
    this.casLoaded.set(false);
    this.asignacionesApi.listar({ codigoAsignatura: 'CAS', pagina: 1, tamanoPagina: 100 }).subscribe({ next: (response) => {
      const assigned = response.elementos.map((item) => ({ id: `${item.anio}-${item.nivel}-${item.numero}-${item.cedulaProfesor}`, anio: item.anio, nivel: item.nivel, numero: item.numero, cedula: item.cedulaProfesor, profesor: item.nombreProfesor, seccion: item.seccion, cantidadEstudiantes: sections.find((section) => section.anio === item.anio && section.nivel === item.nivel && section.numero === item.numero)?.cantidadEstudiantes ?? 0, estado: 'Activo' }));
      const rows = sections.map((section) => assigned.find((item) => item.anio === section.anio && item.nivel === section.nivel && item.numero === section.numero) ?? ({ id: this.sectionKey(section), anio: section.anio, nivel: section.nivel, numero: section.numero, profesor: 'Sin asignar', seccion: section.nombre, cantidadEstudiantes: section.cantidadEstudiantes, estado: 'Pendiente' }));
      this.apiCasAssignments.set(rows);
      this.casLoaded.set(true);
    }, error: (error) => { this.casLoaded.set(true); this.feedback.error(error.error?.mensaje ?? 'No se pudieron cargar las asignaciones CAS.'); } });
  }

  protected cerrar(): void { this.editorOpen.set(false); }
}
