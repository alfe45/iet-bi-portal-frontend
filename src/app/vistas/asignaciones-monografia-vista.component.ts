import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonografiaLocal } from '../nucleo/datos/portal-datos.service';
import { EstudiantesApiService } from '../nucleo/api/estudiantes-api.service';
import { ProfesoresApiService } from '../nucleo/api/profesores-api.service';
import { AsignaturasApiService } from '../nucleo/api/asignaturas-api.service';
import { MonografiasApiService } from '../nucleo/api/monografias-api.service';
import { FeedbackService } from '../compartidos/servicios/feedback.service';

@Component({
  selector: 'app-vista-asignaciones-monografia',
  imports: [FormsModule],
  template: `
    <section class="assignment-page" aria-labelledby="assignment-title">
       <header class="surface page-header"><div><p class="eyebrow">Administración</p><h2 id="assignment-title">Asignación de coordinación de monografía</h2><p>Enlace cada estudiante con su asignatura y Profesor Coordinador de Monografía.</p></div><button type="button" class="primary-button" (click)="nuevo()">Asignar coordinación</button></header>
        <section class="surface assignment-list"><div class="table-head"><strong>Estudiante</strong><strong>Asignatura</strong><strong>Profesor Coordinador</strong><strong></strong></div>
         @for (item of monographs(); track item.id) {<div class="assignment-row"><div><strong>{{ item.estudiante }}</strong><small>{{ item.estado }}</small></div><span>{{ item.area }}</span><span>{{ item.coordinador }}</span><div class="row-actions"><button type="button" class="ghost-button" (click)="editar(item)">Editar</button><button type="button" class="danger-button" (click)="eliminar(item)">Eliminar</button></div></div>}
        @empty {<p class="empty">No hay asignaciones de monografía.</p>}
      </section>
        @if (editorOpen()) {<div class="modal-backdrop" role="presentation"><form class="editor-modal" (ngSubmit)="guardar()"><div class="modal-heading"><div><p class="eyebrow">Asignación de coordinación de monografía</p><h3>{{ editingId() ? 'Editar asignación' : 'Nueva asignación' }}</h3></div><button type="button" class="close-button" (click)="cerrar()">×</button></div><div class="form-grid"><label>Estudiante<select name="estudiante" [(ngModel)]="draft.estudiante" [disabled]="!!editingId()" required>@for (student of students(); track student['id']) {<option [value]="student['nombre']">{{ student['nombre'] }}</option>}</select></label><label>Profesor Coordinador de Monografía<select name="coordinador" [(ngModel)]="draft.coordinador" required>@for (teacher of teachers(); track teacher['id']) {<option [value]="teacher['nombre']">{{ teacher['nombre'] }}</option>}</select></label><label>Año de inicio<input type="number" name="anioInicio" [(ngModel)]="draft.fechaInicio" [readonly]="!!editingId()" min="2000" max="2100" required /></label><label>Asignatura<select name="area" [(ngModel)]="draft.area" required>@for (subject of subjects(); track subject['id']) {<option [value]="subject['nombre']">{{ subject['nombre'] }}</option>}</select></label></div><div class="modal-actions"><button type="button" class="ghost-button" (click)="cerrar()">Cancelar</button><button type="submit" class="primary-button">Guardar asignación</button></div></form></div>}
    </section>
  `,
  styles: `
     .assignment-page{display:grid;gap:1rem;align-content:start}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.page-header h2,.page-header p:last-child{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.assignment-list{padding:1rem 1.2rem}.table-head,.assignment-row{display:grid;grid-template-columns:1.35fr 1.4fr 1.45fr 170px;gap:1rem;align-items:center}.table-head{padding:.2rem 0 .65rem;color:#667085;font-size:.75rem;text-transform:uppercase}.assignment-row{padding:.75rem 0;border-top:1px solid #e6edf3}.assignment-row strong,.assignment-row small{display:block}.assignment-row small{margin-top:.15rem;color:#667085}.assignment-row span{color:#475467}.row-actions{display:flex;justify-content:flex-end;gap:.45rem}.danger-button{border:0;border-radius:5px;padding:.5rem .7rem;background:#fff0f1;color:#b42318;font:inherit;font-size:.76rem;font-weight:700;cursor:pointer}.empty{padding:1rem 0;color:#667085}.modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:1rem;background:rgba(13,25,39,.52)}.editor-modal{width:min(100%,720px);padding:1.2rem;border-radius:10px;background:#fff;box-shadow:0 20px 60px rgba(4,26,55,.3)}.modal-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem}.modal-heading h3{margin:0;color:#1e3a5f}.close-button{width:32px;height:32px;border:0;border-radius:50%;background:#f2f5f7;color:#667085;font-size:1.25rem;cursor:pointer}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.form-grid label{display:grid;gap:.4rem;font-weight:700}.modal-actions{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1rem}@media(max-width:700px){.page-header{align-items:flex-start;flex-direction:column}.table-head{display:none}.assignment-row{grid-template-columns:1fr;gap:.35rem}.assignment-row button{width:100%}.form-grid{grid-template-columns:1fr}}
  `,
})
// Administra las asignaciones de monografías.
export class AsignacionesMonografiaVistaComponent {
  private readonly estudiantesApi = inject(EstudiantesApiService);
  private readonly profesoresApi = inject(ProfesoresApiService);
  private readonly asignaturasApi = inject(AsignaturasApiService);
  private readonly monografiasApi = inject(MonografiasApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly monographRows = signal<MonografiaLocal[]>([]);
  private readonly studentRows = signal<Array<Record<string, unknown>>>([]);
  private readonly teacherRows = signal<Array<Record<string, unknown>>>([]);
  private readonly subjectRows = signal<Array<Record<string, unknown>>>([]);
  protected readonly monographs = computed(() => this.monographRows());
  protected readonly students = computed(() => this.studentRows());
  protected readonly teachers = computed(() => this.teacherRows());
  protected readonly subjects = computed(() => this.subjectRows());
  protected readonly editorOpen = signal(false);
  protected readonly editingId = signal('');
  protected draft: Partial<MonografiaLocal> = {};

  constructor() {
    this.estudiantesApi.listar().subscribe({ next: (items) => this.studentRows.set(items.map((item) => ({ id: item.cedula, cedula: item.cedula, nombre: [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' ') }))), error: () => this.feedback.error('No se pudieron cargar los estudiantes.') });
    this.profesoresApi.listar().subscribe({ next: (items) => this.teacherRows.set(items.map((item) => ({ id: item.cedula, cedula: item.cedula, nombre: [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' ') }))), error: () => this.feedback.error('No se pudieron cargar los profesores.') });
    this.asignaturasApi.listar().subscribe({ next: (response) => this.subjectRows.set(response.elementos.filter((item) => item.tipo === 'SUPERIOR' || item.tipo === 'MEDIO').map((item) => ({ id: item.codigo, codigo: item.codigo, nombre: item.nombre }))), error: () => this.feedback.error('No se pudieron cargar las asignaturas.') });
    this.cargarMonografias();
  }

  private cargarMonografias(): void {
    this.monografiasApi.listar().subscribe({ next: (response) => this.monographRows.set(response.elementos.map((item) => ({
      id: item.cedulaEstudiante,
      estudiante: item.nombreEstudiante,
       titulo: '',
      area: item.asignatura,
      coordinador: item.nombreCoordinador,
      estado: item.estado,
       fechaInicio: String(item.anioInicio),
      descripcion: '',
      seguimientos: [],
    }))), error: () => this.feedback.error('No se pudieron cargar las monografías.') });
  }

   protected nuevo(): void { this.editingId.set(''); this.draft = { id: `M-${Date.now()}`, estudiante: String(this.students()[0]?.['nombre'] ?? ''), area: '', coordinador: String(this.teachers()[0]?.['nombre'] ?? ''), estado: 'INVESTIGACION', fechaInicio: String(new Date().getFullYear()), descripcion: '', seguimientos: [] }; this.editorOpen.set(true); }
  protected editar(item: MonografiaLocal): void { this.editingId.set(item.id); this.draft = { ...item }; this.editorOpen.set(true); }
   protected guardar(): void {
     const current = this.draft;
     const student = this.students().find((item) => item['nombre'] === current.estudiante);
     const teacher = this.teachers().find((item) => item['nombre'] === current.coordinador);
     const subject = this.subjects().find((item) => item['nombre'] === current.area);
     if (!student || !teacher || !subject) { this.feedback.error('Seleccione un estudiante, coordinador y asignatura válidos.'); return; }
      const anio = Number(current.fechaInicio);
      if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) { this.feedback.error('Indique un año de inicio válido.'); return; }
      const request = { anio, cedulaEstudiante: String(student['cedula']), cedulaCoordinador: String(teacher['cedula']), codigoAsignatura: String(subject['codigo']) };
     const operation = this.editingId() ? this.monografiasApi.actualizar(request.cedulaEstudiante, request.cedulaCoordinador, request.codigoAsignatura) : this.monografiasApi.registrar(request);
     operation.subscribe({ next: () => { this.feedback.exito(this.editingId() ? 'La coordinación de monografía fue actualizada.' : 'La coordinación de monografía fue registrada.'); this.cargarMonografias(); this.cerrar(); }, error: (error) => this.feedback.error(error.error?.mensaje ?? 'No se pudo guardar la coordinación de monografía.') });
   }
   protected eliminar(item: MonografiaLocal): void {
     if (!confirm(`¿Eliminar la coordinación de ${item.estudiante}?`)) return;
     this.monografiasApi.borrar(String(item.id)).subscribe({ next: () => { this.feedback.exito('La coordinación de monografía fue eliminada.'); this.cargarMonografias(); }, error: (error) => this.feedback.error(error.error?.mensaje ?? 'No se pudo eliminar la coordinación de monografía.') });
   }
  protected cerrar(): void { this.editorOpen.set(false); }
}
