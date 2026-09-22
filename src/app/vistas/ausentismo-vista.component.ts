import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';
import { PortalDatosService } from '../nucleo/datos/portal-datos.service';

@Component({
  selector: 'app-vista-ausentismo',
  imports: [FormsModule],
  template: `
    <section class="work-page" aria-labelledby="attendance-title">
      <header class="surface page-header"><div><p class="eyebrow">Registro académico</p><h2 id="attendance-title">Ausentismo</h2><p>Registra las tardías y ausencias de un estudiante.</p></div><div class="context-summary"><small>Periodo activo</small><strong>{{ grupos.periodoActivo() }}</strong></div></header>
      <section class="surface group-bar"><label>Grupo<select [ngModel]="grupos.grupoActual()?.id" (ngModelChange)="cambiarGrupo($event)">@for (group of grupos.grupos(); track group.id) {<option [value]="group.id">{{ grupos.etiqueta(group) }}</option>}</select></label><span><strong>{{ grupos.grupoActual()?.estudiantes?.length ?? 0 }}</strong> estudiantes</span></section>
      <section class="surface student-work"><div class="section-heading"><div><h3>Estudiantes</h3><p>{{ grupos.etiqueta(grupos.grupoActual()) }}</p></div><input class="student-search" type="search" placeholder="Buscar estudiante" aria-label="Buscar estudiante" [ngModel]="search()" (ngModelChange)="search.set($event)" /></div><div class="student-list">@for (student of students(); track student.id) {<button type="button" class="student-row" [class.selected]="student.id === selectedId" [attr.aria-selected]="student.id === selectedId" (click)="seleccionar(student.id)"><span><strong>{{ student['nombre'] }}</strong><small>{{ student['cedula'] }}</small></span><span>T: {{ student.attendance.tardias }} · AJ: {{ student.attendance.justificadas }} · AI: {{ student.attendance.injustificadas }}</span><b>Editar</b></button>} @empty {<p class="empty">No hay estudiantes que coincidan con la búsqueda.</p>}</div></section>
      <form class="surface editor" (ngSubmit)="guardar()"><div><p class="eyebrow">Estudiante seleccionado</p><h3>{{ selectedName() }}</h3><p class="editor-context">{{ grupos.etiqueta(grupos.grupoActual()) }}</p></div><div class="counter-grid"><label><span>Tardías</span><input name="tardias" type="number" min="0" step="1" [(ngModel)]="tardias" required /></label><label><span>Ausencias justificadas</span><input name="justificadas" type="number" min="0" step="1" [(ngModel)]="justificadas" required /></label><label><span>Ausencias injustificadas</span><input name="injustificadas" type="number" min="0" step="1" [(ngModel)]="injustificadas" required /></label></div>@if(message){<p class="message" role="status">{{ message }}</p>}<div class="actions"><button type="button" class="ghost-button" (click)="recargar()">Cancelar</button><button type="submit" class="primary-button" [attr.aria-label]="'Guardar ausentismo de ' + selectedName()">Guardar ausentismo</button></div></form>
    </section>
  `,
  styles: `
    .work-page{display:grid;gap:.7rem;align-content:start}.page-header,.group-bar,.section-heading{display:flex;justify-content:space-between;align-items:center;gap:1rem}.page-header h2,.page-header p:last-child,.section-heading h3,.section-heading p,.editor h3,.editor-context{margin:0}.page-header p:last-child,.section-heading p{margin-top:.3rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.context-summary{display:grid;text-align:right}.context-summary small{color:#667085}.context-summary strong{color:#238d78}.group-bar{background:#f2f7fa}.group-bar label{display:flex;align-items:center;gap:.7rem;font-weight:700}.group-bar select{min-width:220px}.group-bar>span{color:#667085;font-size:.85rem}.student-search{max-width:280px}.student-list{display:grid;gap:.4rem;margin-top:.8rem}.student-row{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:1rem;padding:.65rem .75rem;border:1px solid #dbe5ef;border-radius:8px;background:#fff;text-align:left;cursor:pointer}.student-row:hover,.student-row.selected{border-color:#2f6b9a;background:#eaf3f8}.student-row strong,.student-row small{display:block}.student-row small{margin-top:.2rem;color:#667085;font-size:.8rem}.student-row span:nth-child(2){color:#667085;font-size:.82rem}.student-row b{color:#2f6b9a;font-size:.8rem}.empty{color:#667085}.editor{border-left:5px solid #2f6b9a}.editor-context{margin-top:.25rem;color:#667085;font-size:.85rem}.counter-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin-top:.8rem}label{display:grid;gap:.3rem;font-weight:700}.actions{display:flex;justify-content:flex-end;gap:.7rem;margin-top:.7rem}.message{color:#238d78;font-weight:700}@media(max-width:700px){.page-header,.group-bar,.section-heading{align-items:stretch;flex-direction:column}.context-summary{text-align:left}.group-bar label{align-items:stretch;flex-direction:column}.group-bar select,.student-search{max-width:none;width:100%}.student-row{grid-template-columns:1fr}.counter-grid{grid-template-columns:1fr}}
  `,
})
// Registra y consulta las ausencias de estudiantes.
export class AusentismoVistaComponent {
  protected readonly grupos = inject(GruposProfesorService);
  private readonly datos = inject(PortalDatosService);
  private readonly route = inject(ActivatedRoute);
  protected readonly search = signal('');
  protected selectedId = '';
  protected tardias = 0;
  protected justificadas = 0;
  protected injustificadas = 0;
  protected message = '';
  protected readonly students = computed(() => (this.grupos.grupoActual()?.estudiantes ?? []).map((student) => ({ id: student.id, nombre: student['nombre'], cedula: student['cedula'], attendance: this.datos.asistencia(student.id) })).filter((student) => student.nombre.toLowerCase().includes(this.search().toLowerCase()) || student.cedula.includes(this.search())));
  protected readonly selectedName = computed(() => this.grupos.grupoActual()?.estudiantes.find((student) => student.id === this.selectedId)?.['nombre'] ?? 'Seleccione un estudiante');
  constructor() { const query = this.route.snapshot.queryParamMap; this.grupos.seleccionarParametros(query.get('asignatura'), query.get('seccion'), query.get('periodo')); this.selectedId = this.grupos.grupoActual()?.estudiantes[0]?.id ?? ''; this.recargar(); }
  protected cambiarGrupo(id: string): void { this.grupos.seleccionar(id); this.selectedId = this.grupos.grupoActual()?.estudiantes[0]?.id ?? ''; this.search.set(''); this.recargar(); }
  protected seleccionar(id: string): void { this.selectedId = id; this.message = ''; this.recargar(); }
  protected recargar(): void { const item = this.datos.asistencia(this.selectedId); this.tardias = item.tardias; this.justificadas = item.justificadas; this.injustificadas = item.injustificadas; }
  protected guardar(): void { if (!this.selectedId) return; this.datos.guardarAsistencia({ estudianteId: this.selectedId, tardias: this.tardias, justificadas: this.justificadas, injustificadas: this.injustificadas }); this.message = 'Ausentismo guardado correctamente.'; }
}
