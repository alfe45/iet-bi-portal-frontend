import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AsignacionCasLocal, AsignacionResponsabilidadLocal, PortalDatosService, ResponsabilidadProfesor } from '../nucleo/datos/portal-datos.service';
import { ProfesoresApiService } from '../nucleo/api/profesores-api.service';
import { SeccionesApiService } from '../nucleo/api/secciones-api.service';

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
}

@Component({
  selector: 'app-vista-asignaciones-cas-guia',
  imports: [FormsModule],
  template: `
    <section class="assignment-page" aria-labelledby="assignment-title">
       <header class="surface page-header">
         <div><p class="eyebrow">Administración</p><h2 id="assignment-title">{{ isGuide ? 'Asignación de profesores guía' : 'Coordinación CAS' }}</h2><p>{{ isGuide ? 'Asigne un profesor guía a una sección académica.' : 'Administre la relación entre estudiante, profesor CAS y sección.' }}</p></div>
         <button type="button" class="primary-button" (click)="nuevo()">{{ isGuide ? 'Asignar profesor guía' : 'Registrar coordinación CAS' }}</button>
      </header>

      <section class="surface assignment-list">
         <div class="table-head"><strong>{{ isGuide ? 'Profesor' : 'Estudiante' }}</strong><strong>{{ isGuide ? 'Sección' : 'Profesor' }}</strong><strong>{{ isGuide ? 'Tipo' : 'Sección' }}</strong><strong>Estado</strong><strong></strong></div>
        @for (item of assignments(); track item.id) {
          <div class="assignment-row">
             <div><strong>{{ isGuide ? item.profesor : item.estudiante }}</strong><small>{{ isGuide ? item.cedula : 'Estudiante CAS' }}</small></div>
             <span>{{ isGuide ? item.seccion : item.profesor }}</span>
             <span>{{ isGuide ? 'Profesor Guía' : (item.seccion || 'Sin sección') }}</span>
             <span>{{ item.estado || 'Activo' }}</span>
             <div class="row-actions">@if (isGuide) { <button type="button" class="ghost-button" (click)="editar(item)">Editar</button> }<button type="button" class="danger-button" (click)="eliminar(item)">Eliminar</button></div>
          </div>
        } @empty { <p class="empty">No hay asignaciones registradas.</p> }
      </section>

      @if (editorOpen()) {
        <div class="modal-backdrop" role="presentation">
          <form class="editor-modal" (ngSubmit)="guardar()" novalidate>
             <div class="modal-heading"><div><p class="eyebrow">{{ isGuide ? 'Asignación de guía' : 'Coordinación CAS' }}</p><h3>{{ editingId() ? 'Editar asignación' : 'Nueva asignación' }}</h3></div><button type="button" class="close-button" (click)="cerrar()">×</button></div>
            <div class="form-grid">
               @if (!isGuide) { <label>Estudiante<select name="estudiante" [(ngModel)]="draft.estudiante" required><option value="">Seleccione un estudiante</option>@for (student of students(); track student.id) {<option [value]="student['nombre']">{{ student['nombre'] }}</option>}</select></label> }
               <label>Profesor<select name="profesor" [(ngModel)]="draft.cedula" (ngModelChange)="seleccionarProfesor($event)" [disabled]="!!editingId()" required><option value="">Seleccione un profesor</option>@for (teacher of teachers(); track teacher.id) {<option [value]="teacher.cedula">{{ teacher.nombre }}</option>}</select></label>
               @if (isGuide) { <label>Responsabilidad<select name="responsabilidad" [(ngModel)]="draft.responsabilidad" (ngModelChange)="cambioResponsabilidad($event)" required><option value="Profesor Guía">Profesor Guía</option></select></label> }
               @if (!isGuide) { <label>Sección CAS<select name="seccion" [(ngModel)]="draft.seccion" [disabled]="!!editingId()" required><option value="">Seleccione una sección</option>@for (section of sections(); track section) {<option [value]="section">{{ section }}</option>}</select></label> }
               @if (isGuide) { <label>Sección<select name="seccion" [(ngModel)]="draft.seccion" [disabled]="!!editingId()" required><option value="">Seleccione una sección</option>@for (section of sections(); track section) {<option [value]="section">{{ section }}</option>}</select></label> }
               <label>Estado<select name="estado" [(ngModel)]="draft.estado" required><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option></select></label>
            </div>
            <div class="modal-actions"><button type="button" class="ghost-button" (click)="cerrar()">Cancelar</button><button type="submit" class="primary-button">Guardar asignación</button></div>
          </form>
        </div>
      }
    </section>
  `,
  styles: `
    .assignment-page{display:grid;gap:1rem;align-content:start}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.page-header h2,.page-header p:last-child{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.assignment-list{padding:1rem 1.2rem}.table-head,.assignment-row{display:grid;grid-template-columns:1.35fr 1.2fr 1.2fr 180px;gap:1rem;align-items:center}.table-head{padding:.2rem 0 .65rem;color:#667085;font-size:.75rem;text-transform:uppercase}.assignment-row{padding:.75rem 0;border-top:1px solid #e6edf3}.assignment-row strong,.assignment-row small{display:block}.assignment-row small{margin-top:.15rem;color:#667085}.assignment-row span{color:#475467}.row-actions{display:flex;justify-content:flex-end;gap:.45rem}.danger-button{border:0;border-radius:5px;padding:.5rem .7rem;background:#fff0f1;color:#b42318;font:inherit;font-size:.76rem;font-weight:700;cursor:pointer}.empty{padding:1rem 0;color:#667085}.modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:1rem;background:rgba(13,25,39,.52)}.editor-modal{width:min(100%,620px);padding:1.2rem;border-radius:10px;background:#fff;box-shadow:0 20px 60px rgba(4,26,55,.3)}.modal-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem}.modal-heading h3{margin:0;color:#1e3a5f}.close-button{width:32px;height:32px;border:0;border-radius:50%;background:#f2f5f7;color:#667085;font-size:1.25rem;cursor:pointer}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.form-grid label{display:grid;gap:.4rem;font-weight:700}.form-grid select{width:100%;box-sizing:border-box;border:1px solid #cfdbe5;border-radius:5px;padding:.55rem;background:#fff;font:inherit;color:#25364a}.modal-actions{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1rem}@media(max-width:700px){.page-header{align-items:flex-start;flex-direction:column}.table-head{display:none}.assignment-row{grid-template-columns:1fr;gap:.35rem}.row-actions{justify-content:stretch}.row-actions button{flex:1}.form-grid{grid-template-columns:1fr}}
  `,
})
export class AsignacionesCasGuiaVistaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly datos = inject(PortalDatosService);
  private readonly profesoresApi = inject(ProfesoresApiService);
  private readonly seccionesApi = inject(SeccionesApiService);
  protected readonly isGuide = this.route.snapshot.data['assignmentMode'] === 'guide';
   protected readonly assignments = computed<AssignmentRow[]>(() => this.isGuide
     ? this.datos.asignacionesResponsabilidad().filter((item) => item.responsabilidad === 'Profesor Guía').map((item) => ({ id: item.id, cedula: item.cedula, profesor: item.profesor, seccion: item.seccion ?? '', responsabilidad: item.responsabilidad, estado: item.estado }))
     : this.datos.asignacionesCas().map((item) => ({ id: item.id, profesor: item.profesor, estudiante: item.estudiante, seccion: item.seccion, estado: item.estado })));
  private readonly apiTeachers = signal<ProfesorAsignable[]>([]);
  private readonly apiSections = signal<string[]>([]);
   protected readonly teachers = computed<ProfesorAsignable[]>(() => this.apiTeachers().length > 0 ? this.apiTeachers() : this.datos.listar('profesores').filter((item) => item['estado'] !== 'Inactivo').map((item) => ({ id: item.id, cedula: item['cedula'], nombre: item['nombreCompleto'] ?? item['nombre'] })));
   protected readonly sections = computed(() => this.apiSections().length > 0 ? this.apiSections() : [...new Set(this.datos.listar('secciones').map((item) => item['nombre']).filter(Boolean))]);
   protected readonly students = computed(() => this.datos.estudiantes());
  protected readonly editorOpen = signal(false);
  protected readonly editingId = signal('');
   protected draft: Partial<AsignacionResponsabilidadLocal & AsignacionCasLocal> = {};

  constructor() {
    this.profesoresApi.listar().subscribe({ next: (items) => this.apiTeachers.set(items.filter((item) => item.activo).map((item) => ({ id: item.idProfesor, cedula: item.cedula, nombre: [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' ') }))) });
    this.seccionesApi.listar().subscribe({ next: (items) => this.apiSections.set([...new Set(items.map((item) => item.seccion))]) });
  }

  protected nuevo(): void {
    this.editingId.set('');
    const teacher = this.teachers()[0];
     this.draft = this.isGuide
       ? { id: `RESP-${Date.now()}`, cedula: teacher?.cedula ?? '', profesor: teacher?.nombre ?? '', responsabilidad: 'Profesor Guía', seccion: this.sections()[0] ?? '', estado: 'Activo' }
       : { id: `CAS-ASSIGN-${Date.now()}`, estudiante: this.students()[0]?.['nombre'] ?? '', profesor: teacher?.nombre ?? '', seccion: this.sections()[0] ?? '', estado: 'Activo' };
    this.editorOpen.set(true);
  }

   protected editar(item: AssignmentRow): void { this.editingId.set(item.id); this.draft = this.isGuide ? { ...this.datos.asignacionesResponsabilidad().find((source) => source.id === item.id) } : {}; this.editorOpen.set(true); }

  protected seleccionarProfesor(cedula: string): void { this.draft.cedula = cedula; this.draft.profesor = this.teachers().find((teacher) => teacher.cedula === cedula)?.nombre ?? ''; }

  protected cambioResponsabilidad(responsabilidad: string): void { if (responsabilidad === 'Profesor Coordinador de CAS') this.draft.seccion = undefined; else if (!this.draft.seccion) this.draft.seccion = this.sections()[0] ?? ''; }

  protected guardar(): void {
     if (this.isGuide) {
       if (!this.draft.id || !this.draft.cedula || !this.draft.profesor || !this.draft.seccion) return;
       this.datos.guardarAsignacionResponsabilidad({ id: this.draft.id, cedula: this.draft.cedula, profesor: this.draft.profesor, responsabilidad: 'Profesor Guía', seccion: this.draft.seccion, estado: this.draft.estado ?? 'Activo' });
     } else {
       if (!this.draft.id || !this.draft.estudiante || !this.draft.profesor || !this.draft.seccion) return;
       this.datos.guardarAsignacionCas({ id: this.draft.id, estudiante: this.draft.estudiante, profesor: this.draft.profesor, seccion: this.draft.seccion, estado: this.draft.estado ?? 'Activo' });
     }
     this.cerrar();
   }

   protected eliminar(item: AssignmentRow): void { if (confirm(`¿Eliminar la asignación de ${item.estudiante ?? item.profesor}?`)) this.isGuide ? this.datos.eliminarAsignacionResponsabilidad(item.id) : this.datos.eliminarAsignacionCas(item.id); }
  protected cerrar(): void { this.editorOpen.set(false); }
}
