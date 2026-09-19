import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonografiaLocal, PortalDatosService } from '../nucleo/datos/portal-datos.service';

@Component({
  selector: 'app-vista-asignaciones-monografia',
  imports: [FormsModule],
  template: `
    <section class="assignment-page" aria-labelledby="assignment-title">
      <header class="surface page-header"><div><p class="eyebrow">Administración</p><h2 id="assignment-title">Asignaciones de monografía</h2><p>Enlace cada estudiante con su proyecto y Profesor Coordinador de Monografía.</p></div><button type="button" class="primary-button" (click)="nuevo()">Asignar monografía</button></header>
      <section class="surface assignment-list"><div class="table-head"><strong>Estudiante</strong><strong>Proyecto</strong><strong>Área</strong><strong>Profesor Coordinador</strong><strong></strong></div>
        @for (item of monographs(); track item.id) {<div class="assignment-row"><div><strong>{{ item.estudiante }}</strong><small>{{ item.estado }}</small></div><span>{{ item.titulo }}</span><span>{{ item.area }}</span><span>{{ item.coordinador }}</span><button type="button" class="ghost-button" (click)="editar(item)">Editar</button></div>}
        @empty {<p class="empty">No hay asignaciones de monografía.</p>}
      </section>
      @if (editorOpen()) {<div class="modal-backdrop" role="presentation"><form class="editor-modal" (ngSubmit)="guardar()"><div class="modal-heading"><div><p class="eyebrow">Asignación de monografía</p><h3>{{ editingId() ? 'Editar asignación' : 'Nueva asignación' }}</h3></div><button type="button" class="close-button" (click)="cerrar()">×</button></div><div class="form-grid"><label>Estudiante<select name="estudiante" [(ngModel)]="draft.estudiante" required>@for (student of students(); track student.id) {<option [value]="student['nombre']">{{ student['nombre'] }}</option>}</select></label><label>Profesor Coordinador de Monografía<select name="coordinador" [(ngModel)]="draft.coordinador" required>@for (teacher of teachers(); track teacher.id) {<option [value]="teacher['nombre']">{{ teacher['nombre'] }}</option>}</select></label><label>Proyecto<input name="titulo" [(ngModel)]="draft.titulo" required /></label><label>Área<input name="area" [(ngModel)]="draft.area" required /></label></div><div class="modal-actions"><button type="button" class="ghost-button" (click)="cerrar()">Cancelar</button><button type="submit" class="primary-button">Guardar asignación</button></div></form></div>}
    </section>
  `,
  styles: `
    .assignment-page{display:grid;gap:1rem;align-content:start}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.page-header h2,.page-header p:last-child{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.assignment-list{padding:1rem 1.2rem}.table-head,.assignment-row{display:grid;grid-template-columns:1.35fr 1.4fr 1fr 1.45fr 90px;gap:1rem;align-items:center}.table-head{padding:.2rem 0 .65rem;color:#667085;font-size:.75rem;text-transform:uppercase}.assignment-row{padding:.75rem 0;border-top:1px solid #e6edf3}.assignment-row strong,.assignment-row small{display:block}.assignment-row small{margin-top:.15rem;color:#667085}.assignment-row span{color:#475467}.empty{padding:1rem 0;color:#667085}.modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:1rem;background:rgba(13,25,39,.52)}.editor-modal{width:min(100%,720px);padding:1.2rem;border-radius:10px;background:#fff;box-shadow:0 20px 60px rgba(4,26,55,.3)}.modal-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem}.modal-heading h3{margin:0;color:#1e3a5f}.close-button{width:32px;height:32px;border:0;border-radius:50%;background:#f2f5f7;color:#667085;font-size:1.25rem;cursor:pointer}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.form-grid label{display:grid;gap:.4rem;font-weight:700}.modal-actions{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1rem}@media(max-width:700px){.page-header{align-items:flex-start;flex-direction:column}.table-head{display:none}.assignment-row{grid-template-columns:1fr;gap:.35rem}.assignment-row button{width:100%}.form-grid{grid-template-columns:1fr}}
  `,
})
// Administra las asignaciones de monografías.
export class AsignacionesMonografiaVistaComponent {
  private readonly datos = inject(PortalDatosService);
  protected readonly monographs = computed(() => this.datos.monografias());
  protected readonly students = computed(() => this.datos.estudiantes());
  protected readonly teachers = computed(() => this.datos.listar('profesores'));
  protected readonly editorOpen = signal(false);
  protected readonly editingId = signal('');
  protected draft: Partial<MonografiaLocal> = {};

  protected nuevo(): void { this.editingId.set(''); this.draft = { id: `M-${Date.now()}`, estudiante: this.students()[0]?.['nombre'] ?? '', titulo: '', area: '', coordinador: this.teachers()[0]?.['nombre'] ?? '', estado: 'En desarrollo', fechaInicio: new Date().toISOString().slice(0, 10), descripcion: '', seguimientos: [] }; this.editorOpen.set(true); }
  protected editar(item: MonografiaLocal): void { this.editingId.set(item.id); this.draft = { ...item }; this.editorOpen.set(true); }
  protected guardar(): void { const current = this.draft; if (!current.id || !current.estudiante || !current.titulo || !current.area || !current.coordinador) return; this.datos.guardarMonografia({ id: current.id, estudiante: current.estudiante, titulo: current.titulo, area: current.area, coordinador: current.coordinador, estado: current.estado ?? 'En desarrollo', fechaInicio: current.fechaInicio ?? new Date().toISOString().slice(0, 10), descripcion: current.descripcion ?? '', observacionReporte: current.observacionReporte, fechaInforme: current.fechaInforme, informeEnviado: current.informeEnviado, fechaEnvioInforme: current.fechaEnvioInforme, mensajeEnvioInforme: current.mensajeEnvioInforme, seguimientos: current.seguimientos ?? [] }); this.cerrar(); }
  protected cerrar(): void { this.editorOpen.set(false); }
}
