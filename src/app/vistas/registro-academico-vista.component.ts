import { Component, computed, effect, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, CanDeactivateFn, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';
import { ProfesorRegularContextService, etiquetaEstadoMatricula } from '../nucleo/datos/profesor-regular-context.service';
import { FeedbackService } from '../compartidos/servicios/feedback.service';
import { fechaCostaRica, hoyCostaRica } from '../compartidos/utilidades/fechas';
import type { RegistroVista } from '../nucleo/modelos/datos-vista';

@Component({
  selector: 'app-vista-registro-academico',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="academic-page" aria-labelledby="academic-title">
      <header class="surface page-header"><div><p class="eyebrow">Trabajo del grupo</p><h2 id="academic-title">{{ registrationTitle() }}</h2><p>Registra la información académica de cada estudiante en un solo lugar.</p></div><div class="period consult-tools"><label><small>Curso lectivo</small><select [ngModel]="grupos.anioConsulta()" (ngModelChange)="cambiarAnio($event)" aria-label="Curso lectivo a consultar">@if (!grupos.anioConsulta()) {<option [ngValue]="null" disabled>Elegir…</option>}@for (anio of grupos.aniosDisponibles(); track anio) {<option [ngValue]="anio">{{ anio }}</option>}</select></label><label><small>Semestre</small><select [ngModel]="semestre()" (ngModelChange)="cambiarSemestre($event)" aria-label="Semestre a consultar"><option value="I_SEMESTRE">Primer semestre</option><option value="II_SEMESTRE">Segundo semestre</option></select></label></div></header>
      <section class="surface group-context"><label>Grupo<select [ngModel]="grupos.grupoActual()?.id" (ngModelChange)="cambiarGrupo($event)">@for (group of grupos.grupos(); track group.id) {<option [value]="group.id">{{ grupos.etiqueta(group) }}</option>}</select></label><div class="context-details"><span><small>Escala</small><strong>{{ escala() ?? '-' }}</strong></span><span><small>{{ minimumLabel() }}</small><strong>{{ minimumValue() }}</strong></span><span><small>Estudiantes</small><strong>{{ estudiantesGrupo().length }}</strong></span>@if (estadoNotas(); as estado) {<span><small>Cierre del registro</small><strong [class.closed]="plazoCerrado()">{{ fecha(estado.fechaCierre) }}{{ plazoCerrado() ? ' · plazo cerrado' : '' }}</strong>@if (plazoCerrado() && !estadoNotas()?.confirmadoEn) {<small class="closed">Para registrar o corregir notas, solicite una prórroga al Administrador.</small>}</span><span><small>Sin nota</small><strong>{{ estado.sinNota }} de {{ estado.estudiantes }}</strong></span><span><small>Confirmación al Profesor Guía</small><strong>{{ estado.confirmadoEn ? 'Confirmado el ' + fecha(estado.confirmadoEn) : 'Sin confirmar' }}</strong></span>}</div>@if (!grupos.grupos().length) {<p class="empty" [class.error-text]="grupos.errorGrupos()">{{ grupos.mensajeSinGrupos() }}</p>}</section>
       <section class="record-actions" aria-label="Acciones del registro"><button type="button" class="quick-grade" [disabled]="registroBloqueado() || plazoCerrado() || !estudiantesGrupo().length" (click)="iniciarCalificadoRapido()">Calificado rápido <small>Recorrer estudiantes</small></button><button type="button" class="submit-record" [disabled]="!currentGroup() || (plazoCerrado() && !registroBloqueado())" (click)="revisarEnvio()">{{ registroBloqueado() ? 'Registro confirmado' : 'Confirmar al Profesor Guía' }}</button></section>
      <section class="surface students-section"><div class="section-heading"><div><p class="eyebrow">Estudiantes del grupo</p><h3>{{ grupos.etiqueta(currentGroup()) }}</h3></div><div class="search-block"><label for="student-search">Buscar estudiante</label><input #studentSearch id="student-search" class="student-search" type="search" placeholder="Nombre o identificación" aria-describedby="student-results" [ngModel]="search()" (ngModelChange)="cambiarBusqueda($event)" /><span id="student-results" class="result-count">{{ students().length }} {{ students().length === 1 ? 'resultado' : 'resultados' }}</span></div></div><div class="student-list">
        @for (student of paginatedStudents(); track student.id) {
          <article class="student-card" [class.student-card--open]="expandedId() === student.id">
             <div class="student-summary"><div><strong [innerHTML]="highlight(student['nombre'])"></strong><small [innerHTML]="highlight(student['cedula'])"></small><small class="enrollment">Matrícula {{ estadoMatricula(student) }}</small></div><div class="student-status"><span>{{ summaryValue(student.id) }}</span>@if (aprobacion(student.id); as aprobacion) {<span class="approval" [class.approval--no]="aprobacion === 'No aprueba'">{{ aprobacion }}</span>}<span class="attendance-summary"><span class="attendance-late" title="Ausentismo registrado por lecciones">Tardías: {{ tardias(student.id) }}</span><span class="attendance-unjustified">Injustificadas: {{ injustificadas(student.id) }}</span><span class="attendance-justified">Justificadas: {{ justificadas(student.id) }}</span></span>@if (hasObservation(student.id)) {<span class="observation-status">Observación registrada</span>}</div>@if (student['estado'] === 'RETIRADA') {<span class="retired-status">Retirado · no se califica</span>} @else {<button type="button" class="ghost-button" [disabled]="registroBloqueado() || plazoCerrado()" [attr.aria-label]="(hasRecord(student.id) ? 'Editar registro de ' : 'Registrar registro de ') + student['nombre']" (click)="editar(student.id)">{{ registroBloqueado() ? 'Confirmado' : plazoCerrado() ? 'Plazo cerrado' : hasRecord(student.id) ? 'Editar' : 'Registrar' }}</button>}</div>
          </article>
        } @empty {<p class="empty">{{ hasSearch() ? 'No se encontraron estudiantes con esa búsqueda.' : !currentGroup() ? 'No hay un grupo seleccionado.' : 'Este grupo no tiene estudiantes que se califiquen en el semestre.' }}</p>}
      </div>@if (!hasSearch() && totalPages() > 1) {<div class="pagination"><button type="button" class="ghost-button" [disabled]="studentPage() === 0" (click)="previousPage()">Anterior</button><span>Página {{ studentPage() + 1 }} de {{ totalPages() }}</span><button type="button" class="ghost-button" [disabled]="studentPage() + 1 >= totalPages()" (click)="nextPage()">Siguiente</button></div>}</section>
       @if (expandedId()) {<div class="modal-backdrop" role="presentation" (click)="cancelar()"><section class="record-modal" role="dialog" aria-modal="true" aria-labelledby="record-modal-title" (click)="$event.stopPropagation()"><div class="modal-header"><div><p class="eyebrow">{{ quickMode() ? 'Calificado rápido · ' : '' }}{{ grupos.etiqueta(currentGroup()) }}</p><h3 id="record-modal-title">{{ selectedStudentName() }}</h3><p class="required-legend">* Campos obligatorios</p></div><button type="button" class="modal-close" aria-label="Cerrar edición" (click)="cancelar()">×</button></div><form class="student-editor" (ngSubmit)="guardar()"><p class="editor-context">{{ etiquetaSemestre() }} {{ grupos.anioConsulta() }} · Escala {{ escala() }}</p><div class="editor-grid"><label><span>{{ valueLabel() }}</span><input name="valor" [type]="valueType()" [(ngModel)]="draftValue" [attr.inputmode]="valueType() === 'number' ? 'decimal' : 'text'" required /></label></div><p class="absence-note">Ausentismo del semestre: {{ summaryAttendance(expandedId()!) }}. Se registra por lecciones en <a routerLink="/ausentismo">Ausentismo</a>.</p><label><span>Observación del profesor</span><textarea name="observacion" rows="4" [(ngModel)]="draftObservation"></textarea></label><div class="editor-actions">@if (tieneNota(expandedId())) {<button type="button" class="danger-button delete-grade" (click)="eliminarNota()">Eliminar nota</button>}<button type="button" class="ghost-button" (click)="cancelar()">Cancelar</button>@if (quickMode()) {<button type="button" class="ghost-button" [disabled]="!previousStudent()" (click)="abrir(previousStudent()?.id)">← Estudiante anterior</button><button type="button" class="primary-button" [disabled]="!nextStudent()" (click)="guardarYSiguiente()">Guardar y siguiente →</button>} @else {<button type="submit" class="primary-button">Guardar cambios</button>}</div></form></section></div>}
       @if (submissionOpen()) {<div class="modal-backdrop" role="presentation"><section class="record-modal submission-modal" role="dialog" aria-modal="true" aria-labelledby="submission-title"><div class="modal-header"><div><p class="eyebrow">Confirmación al Profesor Guía</p><h3 id="submission-title">{{ submissionState() === 'confirm' ? '¿Confirmar registro al Profesor Guía?' : submissionState() === 'sent' ? 'Registro confirmado' : 'Registro incompleto' }}</h3></div><button type="button" class="modal-close" aria-label="Cerrar aviso" (click)="submissionOpen.set(false)">×</button></div><p>{{ submissionMessage() }}</p>@if (submissionState() === 'confirm') {<div class="warning-box">La confirmación se realiza una sola vez por semestre. Después de confirmar, usted no podrá modificar, eliminar ni volver a confirmar las notas de esta asignatura. Si necesita corregirlas, solicite al Profesor Guía que reactive la edición.</div><div class="editor-actions"><button type="button" class="ghost-button" (click)="submissionOpen.set(false)">Cancelar</button><button type="button" class="submit-record" (click)="confirmarEnvio()">Confirmar al Profesor Guía</button></div>} @else {<div class="editor-actions"><button type="button" class="ghost-button" (click)="submissionOpen.set(false)">Cerrar</button></div>}</section></div>}
       @if (saveConfirmationOpen()) {<div class="modal-backdrop save-confirmation" role="presentation"><section class="record-modal confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="save-title"><div class="modal-header"><div><p class="eyebrow">Registro guardado</p><h3 id="save-title">Cambios guardados</h3></div></div><p>El registro de {{ savedStudentName() }} se guardó correctamente.</p><div class="editor-actions"><button type="button" class="primary-button" (click)="confirmarGuardado()">Confirmar</button></div></section></div>}
       @if (unsavedChangesOpen()) {<div class="modal-backdrop unsaved-changes-backdrop" role="presentation"><section class="record-modal unsaved-changes-modal" role="dialog" aria-modal="true" aria-labelledby="unsaved-title" (click)="$event.stopPropagation()"><div class="modal-header"><div><p class="eyebrow">Cambios sin guardar</p><h3 id="unsaved-title">¿Qué deseas hacer?</h3></div></div><p>Hay cambios en el registro de bandas que todavía no se han guardado.</p><div class="editor-actions unsaved-actions"><button type="button" class="danger-button" (click)="descartarCambiosYSalir()">Salir sin guardar</button><button type="button" class="ghost-button" (click)="cancelarSalida()">Cancelar</button><button type="button" class="primary-button" [disabled]="savingBeforeExit()" (click)="guardarYSalir()">Guardar y salir</button></div></section></div>}
    </section>
  `,
  styles: `
    .academic-page{gap:.45rem}.academic-page>.page-header{padding:.7rem 1rem!important}.academic-page>.page-header h2{font-size:1.45rem}.academic-page>.page-header p:last-child{margin-top:.15rem;font-size:.82rem}.academic-page>.group-context{padding:.65rem 1rem!important}.academic-page>.students-section{padding:.75rem 1rem!important}.academic-page>.students-section .student-list{margin-top:.55rem;gap:.4rem}.academic-page>.students-section .student-summary{padding:.55rem .7rem}
     .record-actions{display:flex;justify-content:flex-end;gap:.6rem}.quick-grade,.submit-record{min-height:40px;padding:.55rem .9rem;border-radius:5px;color:#fff;font-weight:700;cursor:pointer}.quick-grade{border:1px solid #1769aa;background:#1769aa}.quick-grade:hover{background:#125789}.quick-grade small{margin-left:.35rem;font-weight:400;opacity:.85}.submit-record{border:1px solid #b42318;background:#b42318}.submit-record:hover{background:#8f1d14}.save-confirmation{z-index:1200!important}.save-confirmation .confirmation-modal{width:min(100%,460px)}.consult-tools{display:flex;gap:.6rem;flex-wrap:wrap}.consult-tools label{display:grid;gap:.15rem}.consult-tools select{min-height:32px;padding:.25rem .45rem;border:1px solid #cfd9e3;border-radius:6px}.enrollment{display:block;color:#667085;font-size:.75rem}.approval{padding:.15rem .5rem;border-radius:999px;background:#ecfdf3;color:#067647;font-size:.75rem;font-weight:700}.approval--no{background:#fff1f0;color:#b42318}.closed{color:#b42318}.error-text{color:#b42318}.delete-grade{margin-right:auto}.absence-note{margin:.2rem 0 .8rem;color:#475467;font-size:.85rem}.absence-note a{color:#1769aa;font-weight:700}.retired-status{color:#667085;font-size:.82rem;font-weight:700;white-space:nowrap}.modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:1rem;background:rgba(13,25,39,.52)}.record-modal{width:min(100%,680px);max-height:calc(100vh - 2rem);overflow:auto;border-radius:10px;background:#fff;box-shadow:0 20px 60px rgba(4,26,55,.3)}.modal-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.1rem 1.2rem;border-bottom:1px solid #e6edf3}.modal-header h3{margin:0;color:#1e3a5f}.modal-close{width:32px;height:32px;border:0;border-radius:50%;color:#667085;background:#f2f5f7;font-size:1.25rem;cursor:pointer}.record-modal .student-editor{border:0}.submission-modal>p,.confirmation-modal>p,.unsaved-changes-modal>p{margin:1.2rem;color:#475467;line-height:1.5}.warning-box{margin:0 1.2rem;padding:.8rem;border:1px solid #f5c2c0;border-radius:6px;color:#8f1d14;background:#fff4f3;font-weight:700}.submission-modal .editor-actions,.confirmation-modal .editor-actions,.unsaved-changes-modal .editor-actions{padding:0 1.2rem 1.2rem}.unsaved-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:.55rem}
    .academic-page{display:grid;gap:.7rem;align-content:start}.page-header,.group-context,.section-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem}.page-header h2,.page-header p:last-child,.section-heading h3{margin:0}.page-header p:last-child{margin-top:.3rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.period{display:grid;text-align:right}.period small,.context-details small{color:#667085}.period strong{color:#1b6f60}.group-context{background:#f2f7fa}.group-context label{display:flex;align-items:center;gap:.7rem;font-weight:700}.group-context select{min-width:250px}.context-details{display:flex;gap:1.4rem}.context-details span{display:grid}.context-details strong{color:#1e3a5f}.search-block{display:grid;justify-items:end;gap:.2rem}.search-block label{color:#475467;font-size:.78rem}.student-search{width:400px;max-width:100%}.result-count{color:#667085;font-size:.78rem}.student-list{display:grid;gap:.55rem;margin-top:1rem}.student-card{border:1px solid #dbe5ef;border-radius:9px;background:#fff}.student-card--open{border-color:#2f6b9a;box-shadow:0 4px 12px rgba(27,46,94,.08)}.student-summary{display:grid;grid-template-columns:minmax(180px,1fr) minmax(220px,1.5fr) auto;align-items:center;gap:1rem;padding:.8rem}.student-summary strong,.student-summary small{display:block}.student-summary strong mark,.student-summary small mark{padding:0 .08em;border-radius:2px;background:#fff0a8;color:inherit}.student-summary small{margin-top:.18rem;color:#667085;font-size:.8rem}.student-status{display:flex;flex-wrap:wrap;gap:.35rem .8rem;color:#667085;font-size:.82rem}.student-status span:first-child{color:#1e3a5f;font-weight:700}.attendance-summary{display:inline-flex;flex-wrap:wrap;gap:.5rem}.student-status .attendance-late{color:#d97706;font-weight:700}.student-status .attendance-unjustified{color:#b42318;font-weight:700}.student-status .attendance-justified{color:#1b6f60;font-weight:700}.student-status .observation-status{color:#7c3aed;font-weight:700}.student-summary .ghost-button{min-height:34px;padding:.35rem .7rem;font-size:.78rem}.student-editor{display:grid;gap:.8rem;padding:.9rem 1rem 1rem;border-top:1px solid #e6edf3;background:#fbfdfe}.editor-context{margin:0;color:#667085;font-size:.85rem}.editor-grid{display:grid;grid-template-columns:minmax(180px,260px)}label{display:grid;gap:.3rem;font-weight:700}fieldset{margin:0;padding:.7rem;border:1px solid #dbe5ef;border-radius:7px}legend{padding:0 .3rem;color:#2f6b9a;font-size:.78rem;font-weight:800;text-transform:uppercase}.absence-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem}.pagination{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:1rem;padding-top:.7rem;border-top:1px solid #e6edf3;color:#667085;font-size:.8rem}.pagination .ghost-button{min-height:32px;padding:.3rem .6rem;font-size:.76rem}.editor-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:.5rem}.editor-actions button:disabled{cursor:not-allowed;opacity:.45}.message{margin:0;color:#1b6f60;font-weight:700}.empty{color:#667085}@media(max-width:750px){.page-header,.group-context,.section-heading{align-items:stretch;flex-direction:column}.period{text-align:left}.group-context label{align-items:stretch;flex-direction:column}.group-context select,.student-search{width:100%}.context-details{justify-content:space-between;gap:.5rem}.record-actions{justify-content:stretch;flex-direction:column}.record-actions button{width:100%}.search-block{justify-items:stretch}.student-summary{grid-template-columns:1fr}.student-status{order:3}.student-summary .ghost-button{justify-self:start}.absence-grid{grid-template-columns:1fr}.editor-actions{justify-content:stretch}.editor-actions button{flex:1 1 45%}}
    /* Celular: los datos del grupo saltan de línea en vez de salirse. */
    @media (max-width: 600px) { .context-details { flex-wrap: wrap; } }
  `,
})
// Muestra el registro académico del estudiante.
export class RegistroAcademicoVistaComponent {
  @ViewChild('studentSearch') private studentSearch?: ElementRef<HTMLInputElement>;
  protected readonly grupos = inject(GruposProfesorService);
  private readonly regularContext = inject(ProfesorRegularContextService);
  private readonly feedback = inject(FeedbackService);
  private readonly route = inject(ActivatedRoute);
  protected readonly search = signal('');
  protected readonly expandedId = signal<string | null>(null);
  protected readonly quickMode = signal(false);
  protected readonly studentPage = signal(0);
  protected readonly pageSize = 3;
  protected draftValue = '';
  protected draftTardias = 0;
  protected draftInjustificadas = 0;
  protected draftJustificadas = 0;
  protected draftObservation = '';
  protected readonly submissionOpen = signal(false);
  protected readonly submissionState = signal<'incomplete' | 'confirm' | 'sent'>('confirm');
   protected readonly saveConfirmationOpen = signal(false);
   protected readonly unsavedChangesOpen = signal(false);
   protected readonly savingBeforeExit = signal(false);
  protected readonly savedStudentName = signal('');
   private readonly nextAfterSave = signal<string | null>(null);
   private salidaResolve: ((allowed: boolean) => void) | null = null;
   private salidaPromise: Promise<boolean> | null = null;
   private salidaPendiente: (() => void) | null = null;
  protected readonly currentGroup = computed(() => this.grupos.grupoActual());
  // RD-047: curso lectivo y semestre elegibles; estado completo del registro según la API.
  protected readonly semestre = computed(() => this.regularContext.semestreConsulta());
  private readonly consultaActual = computed(() => { const group = this.currentGroup(); return group ? this.regularContext.consultaDe(group) : null; });
  protected readonly estadoNotas = computed(() => { const consulta = this.consultaActual(); return consulta ? this.regularContext.estadoNotas(consulta) : null; });
  private readonly notasApi = computed(() => { const consulta = this.consultaActual(); return consulta ? this.regularContext.notasDe(consulta) : null; });
  // RN-73: la escala la define el tipo de asignatura que devuelve la API.
  protected readonly escala = computed(() => { const tipo = this.estadoNotas()?.tipoAsignatura; return tipo === 'MEP' ? '1–100' : tipo === 'TRONCAL' ? 'A–E' : tipo ? '1–7' : this.currentGroup()?.escala ?? '1–7'; });
  // Se califican los estudiantes que la API devuelve para el semestre consultado (con o sin nota).
  protected readonly estudiantesGrupo = computed<RegistroVista[]>(() => {
    const seccion = this.currentGroup()?.estudiantes ?? [];
    const notas = this.notasApi();
    if (!notas) return seccion;
    return notas.map((nota) => seccion.find((student) => student.id === nota.cedulaEstudiante) ?? { id: nota.cedulaEstudiante, nombre: nota.nombreEstudiante, cedula: nota.cedulaEstudiante, estado: nota.estadoMatricula });
  });
  protected readonly plazoCerrado = computed(() => { const cierre = this.estadoNotas()?.fechaCierre; return Boolean(cierre && hoyCostaRica() > cierre); });
  protected readonly registrationTitle = computed(() => { const subjects = this.grupos.grupos().map((group) => group.asignatura); const notesOnly = subjects.length > 0 && subjects.every((subject) => ['Estudios Sociales', 'Civica', 'Cívica'].includes(subject)); return notesOnly ? 'Registro de notas' : 'Registro de bandas'; });
  protected readonly students = computed(() => this.estudiantesGrupo().filter((student) => String(student['nombre']).toLowerCase().includes(this.search().toLowerCase()) || String(student['cedula']).includes(this.search())));
  protected readonly paginatedStudents = computed(() => { const students = this.students(); if (this.hasSearch()) return students; const start = this.studentPage() * this.pageSize; return students.slice(start, start + this.pageSize); });
  protected readonly totalPages = computed(() => Math.ceil(this.students().length / this.pageSize));
  // RN-75: un estudiante retirado no se califica, así que no cuenta como pendiente al confirmar.
  private readonly calificables = computed(() => this.estudiantesGrupo().filter((student) => student['estado'] !== 'RETIRADA'));
  protected readonly incompleteCount = computed(() => this.calificables().filter((student) => !this.evaluation(student.id).valor.trim()).length);
  protected readonly missingNames = computed(() => this.calificables().filter((student) => !this.evaluation(student.id).valor.trim()).map((student) => student['nombre']));
    protected readonly submissionMessage = computed(() => this.submissionState() === 'incomplete' ? `Faltan ${this.incompleteCount()} estudiante(s) sin nota registrada: ${this.missingNames().join(', ')}.` : this.submissionState() === 'sent' ? 'Registro confirmado. Solicite al Profesor Guía que reactive la edición de los reportes de bandas de la sección si necesita realizar cambios.' : 'Todos los estudiantes tienen su valor registrado. Revise la advertencia antes de confirmar.');

  constructor() {
    const query = this.route.snapshot.queryParamMap;
    this.grupos.seleccionarParametros(query.get('asignatura'), query.get('seccion'), query.get('periodo'));
    effect(() => {
      const group = this.currentGroup();
       if (!group) return;
      const consulta = this.regularContext.consultaDe(group);
       if (consulta) this.regularContext.cargarAcademico(consulta).subscribe({ error: () => { this.feedback.error(this.regularContext.error() || 'No se pudieron cargar los registros académicos.'); } });
    });
  }

   protected cambiarGrupo(id: string): void { this.confirmarCambiosAntesDe(() => { this.grupos.seleccionar(id); this.expandedId.set(null); this.quickMode.set(false); this.studentPage.set(0); this.search.set(''); }); }
  protected cambiarBusqueda(value: string): void { this.search.set(value); this.studentPage.set(0); }
  protected hasSearch(): boolean { return Boolean(this.search().trim()); }
  protected previousPage(): void { this.studentPage.update((page) => Math.max(0, page - 1)); }
  protected nextPage(): void { this.studentPage.update((page) => Math.min(this.totalPages() - 1, page + 1)); }
  protected toggle(id: string): void { this.expandedId() === id ? this.cancelar() : this.abrir(id); }
    protected abrir(id: string | undefined): void { if (!id || this.registroBloqueado()) return; this.expandedId.set(id); const evaluation = this.evaluation(id); const attendance = this.attendance(id); this.draftValue = evaluation.valor; this.draftObservation = evaluation.observacion; this.draftTardias = attendance.tardias; this.draftInjustificadas = attendance.injustificadas; this.draftJustificadas = attendance.justificadas; }
   protected editar(id: string): void { this.confirmarCambiosAntesDe(() => { this.quickMode.set(false); this.abrir(id); }); }
    protected cancelar(): void { this.confirmarCambiosAntesDe(() => { this.expandedId.set(null); this.quickMode.set(false); }); }
   protected cancelarSalida(): void { this.cerrarAvisoSalida(false); }
   protected descartarCambiosYSalir(): void { this.cerrarAvisoSalida(true); }
   protected guardarYSalir(): void {
     const id = this.expandedId();
     const group = this.currentGroup();
     const consulta = group ? this.regularContext.consultaDe(group) : null;
     if (!id || !group || !consulta || this.savingBeforeExit()) return;
     // DV-010: con el valor vacío no se guarda al salir (eliminar la nota requiere su confirmación).
     if (!this.draftValue.trim()) { this.feedback.error(`Indique la ${this.valueLabel().toLowerCase()} o use «Eliminar nota».`); return; }
     this.savingBeforeExit.set(true);
     this.regularContext.guardarRegistro(consulta, id, this.draftValue, this.draftObservation).subscribe({
       next: () => { this.savingBeforeExit.set(false); this.cerrarAvisoSalida(true); },
       error: (error: unknown) => { this.savingBeforeExit.set(false); this.feedback.error(error instanceof Error ? error.message : this.regularContext.error() || 'No se pudieron guardar los cambios antes de salir.'); },
     });
   }
   public confirmarSalida(): boolean | Promise<boolean> {
     if (!this.tieneCambiosSinGuardar()) return true;
     if (this.salidaPromise) return this.salidaPromise;
     this.salidaPromise = new Promise<boolean>((resolve) => { this.salidaResolve = resolve; this.salidaPendiente = null; this.unsavedChangesOpen.set(true); });
     return this.salidaPromise;
   }
   private confirmarCambiosAntesDe(action: () => void): void {
     if (!this.tieneCambiosSinGuardar()) { action(); return; }
     if (this.unsavedChangesOpen()) return;
     this.salidaPendiente = action;
     this.unsavedChangesOpen.set(true);
   }
  protected guardar(): void { this.persistirRegistro(null); }
  protected guardarYSiguiente(): void { this.persistirRegistro(this.nextStudent()?.id ?? null); }
   protected confirmarGuardado(): void { this.saveConfirmationOpen.set(false); const next = this.nextAfterSave(); this.nextAfterSave.set(null); this.expandedId.set(null); if (next) this.abrir(next); else this.quickMode.set(false); if (this.hasSearch()) queueMicrotask(() => this.studentSearch?.nativeElement.focus()); }
  protected iniciarCalificadoRapido(): void { const first = this.estudiantesGrupo()[0]; if (!first) return; this.search.set(''); this.studentPage.set(0); this.quickMode.set(true); this.abrir(first.id); }
  protected selectedStudentName(): string { const id = this.expandedId(); return this.estudiantesGrupo().find((student) => student.id === id)?.['nombre'] ?? 'Estudiante'; }
   protected registroBloqueado(): boolean { const group = this.currentGroup(); const consulta = group ? this.regularContext.consultaDe(group) : null; return Boolean(consulta && this.regularContext.registroEnviado(consulta)); }
   protected revisarEnvio(): void { const group = this.currentGroup(); if (!group) return; const consulta = this.regularContext.consultaDe(group); const enviado = Boolean(consulta && this.regularContext.registroEnviado(consulta)); this.submissionState.set(enviado ? 'sent' : this.incompleteCount() > 0 ? 'incomplete' : 'confirm'); this.submissionOpen.set(true); }
  protected confirmarEnvio(): void {
    const group = this.currentGroup();
     if (!group || this.registroBloqueado() || this.incompleteCount() > 0) return;
    const consulta = this.regularContext.consultaDe(group);
     if (!consulta) { this.submissionState.set('incomplete'); this.feedback.error('El grupo no tiene los parámetros requeridos por el backend.'); return; }
     this.regularContext.enviarRegistro(consulta).subscribe({ next: () => this.submissionState.set('sent'), error: (error: unknown) => { this.submissionOpen.set(false); this.feedback.error((error as { error?: { mensaje?: string } })?.error?.mensaje ?? 'No se pudo confirmar el registro.'); } }); // RD-051: el error de la API, no 'registro incompleto'
  }
  protected previousStudent(): { id: string } | undefined { const list = this.students(); const index = list.findIndex((student) => student.id === this.expandedId()); return index > 0 ? list[index - 1] : undefined; }
   protected nextStudent(): { id: string } | undefined { const list = this.students(); const index = list.findIndex((student) => student.id === this.expandedId()); return index >= 0 ? list[index + 1] : undefined; }
   protected tieneCambiosSinGuardar(): boolean {
     const id = this.expandedId();
     if (!id) return false;
     const evaluation = this.evaluation(id);
     return this.draftValue.trim() !== evaluation.valor.trim()
       || this.draftObservation.trim() !== evaluation.observacion.trim();
   }
  protected hasRecord(id: string): boolean { const evaluation = this.evaluation(id); const attendance = this.attendance(id); return Boolean(evaluation.valor || evaluation.observacion || attendance.tardias || attendance.justificadas || attendance.injustificadas); }
  protected summaryValue(id: string): string { if (this.estudiantesGrupo().find((student) => student.id === id)?.['estado'] === 'RETIRADA') return 'Retirado'; const value = this.evaluation(id).valor; if (!value) return this.escala() === '1–100' ? 'Sin valor registrado' : 'Sin banda registrada'; return `${this.escala() === '1–100' ? 'Valor' : 'Banda'}: ${value}`; }
  protected summaryAttendance(id: string): string { const item = this.attendance(id); return item.tardias || item.injustificadas || item.justificadas ? `T: ${item.tardias} · AI: ${item.injustificadas} · AJ: ${item.justificadas}` : 'Sin ausentismo registrado'; }
  protected tardias(id: string): number { return this.attendance(id).tardias; }
  protected injustificadas(id: string): number { return this.attendance(id).injustificadas; }
  protected justificadas(id: string): number { return this.attendance(id).justificadas; }
  protected hasObservation(id: string): boolean { return Boolean(this.evaluation(id).observacion.trim()); }
  protected valueLabel(): string { return this.escala() === '1–100' ? 'Valor alcanzado' : 'Banda alcanzada'; }
  protected valueType(): string { return this.escala() === '1–100' ? 'number' : 'text'; }
  // RD-046: nota mínima tomada de la API (SUPERIOR 4, MEDIO 3, MEP 70; TRONCAL sin mínima).
  protected minimumValue(): string { const notas = this.notasApi(); const minima = notas?.find((nota) => nota.notaMinima)?.notaMinima; if (minima) return minima; return this.escala() === 'A–E' ? 'No aplica' : '-'; }
  protected cambiarAnio(anio: number): void { this.confirmarCambiosAntesDe(() => { this.expandedId.set(null); this.quickMode.set(false); this.studentPage.set(0); this.grupos.cambiarAnio(anio); }); }
  protected cambiarSemestre(semestre: string): void { this.confirmarCambiosAntesDe(() => { this.expandedId.set(null); this.quickMode.set(false); this.studentPage.set(0); this.regularContext.cambiarSemestre(semestre); }); }
  protected etiquetaSemestre(): string { return this.semestre() === 'I_SEMESTRE' ? 'Primer semestre' : 'Segundo semestre'; }
  protected fecha(value: string): string { return fechaCostaRica(value); }
  protected estadoMatricula(student: RegistroVista): string { return etiquetaEstadoMatricula(student['estado']).toLowerCase(); }
  protected aprobacion(id: string): string { const nota = this.notasApi()?.find((item) => item.cedulaEstudiante === id); return nota?.aprobada === true ? 'Aprueba' : nota?.aprobada === false ? 'No aprueba' : ''; }
  protected tieneNota(id: string | null): boolean { return Boolean(id && !this.registroBloqueado() && this.notasApi()?.some((item) => item.cedulaEstudiante === id && item.nota !== null)); }
  // RD-047 (CU06): eliminar la nota (y su observación) antes de confirmar.
  protected async eliminarNota(): Promise<void> {
    const id = this.expandedId();
    const consulta = this.consultaActual();
    if (!id || !consulta) return;
    if (!(await this.feedback.confirmar(`Se eliminará la nota y la observación de ${this.selectedStudentName()} en ${this.etiquetaSemestre().toLowerCase()}.`, '¿Eliminar la nota?', 'Eliminar nota'))) return;
    this.regularContext.eliminarEvaluacion(consulta, id).subscribe({
      next: () => { this.draftValue = ''; this.draftObservation = ''; this.expandedId.set(null); this.quickMode.set(false); this.regularContext.recargarAcademico(consulta).subscribe({ error: () => undefined }); this.feedback.exito('La nota se eliminó correctamente.', 'Nota eliminada'); },
      error: (error: unknown) => this.feedback.error((error as { error?: { mensaje?: string } })?.error?.mensaje ?? 'No se pudo eliminar la nota.'),
    });
  }
  protected minimumLabel(): string { return this.escala() === '1–100' ? 'Valor mínimo' : 'Banda mínima'; }
  protected highlight(value: string): string { const term = this.normalize(this.search().trim()); if (!term) return this.escape(value); const characters = Array.from(value); let normalized = ''; const bounds: Array<{ start: number; end: number }> = []; for (const character of characters) { const start = normalized.length; normalized += this.normalize(character); bounds.push({ start, end: normalized.length }); } const matches: Array<[number, number]> = []; let cursor = 0; while (term && (cursor = normalized.indexOf(term, cursor)) >= 0) { const end = cursor + term.length; const startChar = bounds.findIndex((bound) => bound.end > cursor); const endChar = bounds.findIndex((bound) => bound.end >= end); if (startChar >= 0 && endChar >= startChar) matches.push([startChar, endChar + 1]); cursor = end || cursor + 1; } if (!matches.length) return this.escape(value); let output = ''; let position = 0; for (const [start, end] of matches) { output += this.escape(characters.slice(position, start).join('')); output += `<mark>${this.escape(characters.slice(start, end).join(''))}</mark>`; position = end; } return output + this.escape(characters.slice(position).join('')); }
  private normalize(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  private escape(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] ?? character)); }
   private evaluation(id: string) { const group = this.currentGroup(); const consulta = group ? this.regularContext.consultaDe(group) : null; return consulta ? this.regularContext.evaluacionDeGrupo(consulta, id) : { estudianteId: id, valor: '', observacion: '' }; }
   private attendance(id: string) { const group = this.currentGroup(); const consulta = group ? this.regularContext.consultaDe(group) : null; return consulta ? this.regularContext.asistenciaDeGrupo(consulta, id) : { estudianteId: id, tardias: 0, justificadas: 0, injustificadas: 0 }; }
    private persistirRegistro(next: string | null): void {
     const id = this.expandedId();
     const group = this.currentGroup();
      if (!id || !group || this.registroBloqueado()) return;
      const consulta = this.regularContext.consultaDe(group);
       if (!consulta) { this.feedback.error('El grupo no tiene los parámetros requeridos por el backend.'); return; }
      // DV-010 (CU06 FA 2): un valor vacío no borra la nota sin preguntar; si ya tenía nota se pide la misma confirmación de «Eliminar nota».
      if (!this.draftValue.trim()) {
        if (this.tieneNota(id)) void this.eliminarNota();
        else this.feedback.error(`Indique la ${this.valueLabel().toLowerCase()} antes de guardar.`);
        return;
      }
      this.regularContext.guardarRegistro(consulta, id, this.draftValue, this.draftObservation).subscribe({
           next: () => { this.nextAfterSave.set(next); this.savedStudentName.set(this.selectedStudentName()); this.saveConfirmationOpen.set(true); this.regularContext.recargarAcademico(consulta).subscribe({ error: () => undefined }); },
           error: (error: unknown) => this.feedback.error(error instanceof Error ? error.message : (error as { error?: { mensaje?: string } })?.error?.mensaje ?? (this.regularContext.error() || 'No se pudieron guardar los cambios en el backend.')),
        });
    }
   private cerrarAvisoSalida(allowed: boolean): void {
     const resolve = this.salidaResolve;
     const action = this.salidaPendiente;
     this.salidaResolve = null;
     this.salidaPromise = null;
     this.salidaPendiente = null;
     this.unsavedChangesOpen.set(false);
     if (allowed) action?.();
     resolve?.(allowed);
   }
   @HostListener('window:beforeunload', ['$event'])
   protected advertirAntesDeCerrar(event: BeforeUnloadEvent): void {
     if (!this.tieneCambiosSinGuardar()) return;
     event.preventDefault();
     event.returnValue = '';
   }
}

export const registroAcademicoCanDeactivateGuard: CanDeactivateFn<RegistroAcademicoVistaComponent> = (component) => component.confirmarSalida();
