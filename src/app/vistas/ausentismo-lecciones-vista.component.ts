import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';
import { ProfesorRegularContextService, etiquetaEstadoMatricula, etiquetaSemestre } from '../nucleo/datos/profesor-regular-context.service';
import {
  ProfesorRegularApiService,
  ProfesorRegularAusenciaApi,
  ProfesorRegularAusentismoApi,
  ProfesorRegularConsultaAusentismo,
  ProfesorRegularLeccionApi,
  ProfesorRegularLeccionDetalleApi,
} from '../nucleo/api/profesor-regular-api.service';
import { FeedbackService } from '../compartidos/servicios/feedback.service';
import { fechaCostaRica, horaCostaRica, hoyCostaRica } from '../compartidos/utilidades/fechas';

type Marca = 'P' | 'A' | 'T';

/**
 * Profesor Regular CU09 a CU11 (RD-049): el ausentismo se registra por lecciones. Cada lección tiene fecha, hora
 * (de Costa Rica, RD-050), tema opcional, ausentes y llegadas tardías; se consulta, corrige, justifica y elimina.
 * El resumen por estudiante compara sus ausencias con las lecciones registradas (RN-70).
 */
@Component({
  selector: 'app-vista-ausentismo-lecciones',
  imports: [FormsModule],
  template: `
    <section class="absence-page" aria-labelledby="absence-title">
      <header class="surface page-header">
        <div><p class="eyebrow">Registro académico</p><h2 id="absence-title">Ausentismo</h2><p>Registra las lecciones con sus ausentes y llegadas tardías, y consulta el resumen de cada estudiante.</p></div>
        <div class="filters">
          <label><small>Curso lectivo</small><select [ngModel]="grupos.anioConsulta()" (ngModelChange)="grupos.cambiarAnio($event)" aria-label="Curso lectivo a consultar">@if (!grupos.anioConsulta()) {<option [ngValue]="null" disabled>Elegir…</option>}@for (anio of grupos.aniosDisponibles(); track anio) {<option [ngValue]="anio">{{ anio }}</option>}</select></label>
          <label><small>Semestre</small><select [ngModel]="semestre()" (ngModelChange)="semestreElegido.set($event)" aria-label="Semestre a consultar"><option value="">Todo el curso lectivo</option><option value="I_SEMESTRE">Primer semestre</option><option value="II_SEMESTRE">Segundo semestre</option></select></label>
          <label><small>Grupo</small><select [ngModel]="grupos.grupoActual()?.id" (ngModelChange)="grupos.seleccionar($event)" aria-label="Grupo">@for (group of grupos.grupos(); track group.id) {<option [value]="group.id">{{ grupos.etiqueta(group) }}</option>}</select></label>
        </div>
      </header>
      @if (!grupos.grupos().length) {<p class="surface empty" [class.error-text]="grupos.errorGrupos()">{{ grupos.mensajeSinGrupos() }}</p>}
      @else {
        @if (error()) {<p class="surface empty error-text" role="alert">{{ error() }}</p>}
        <section class="surface block" aria-labelledby="summary-title">
          <div class="block-head"><div><p class="eyebrow">{{ grupos.etiqueta(grupos.grupoActual()) }}</p><h3 id="summary-title">Resumen por estudiante</h3></div></div>
          <div class="table-wrap"><table>
            <thead><tr><th>Estudiante</th><th>Matrícula</th><th>Lecciones</th><th>Ausencias</th><th>Justificadas</th><th>Injustificadas</th><th>Tardías</th><th>Ausentismo</th></tr></thead>
            <tbody>
              @for (fila of resumen(); track fila.cedulaEstudiante) {<tr><td><strong>{{ fila.nombreEstudiante }}</strong><small>{{ fila.cedulaEstudiante }}</small></td><td>{{ estadoMatricula(fila.estadoMatricula) }}</td><td>{{ fila.lecciones }}</td><td>{{ fila.ausencias }}</td><td>{{ fila.justificadas }}</td><td>{{ fila.injustificadas }}</td><td>{{ fila.tardias }}</td><td>{{ fila.porcentajeAusentismo === null ? 'Sin lecciones' : fila.porcentajeAusentismo + ' %' }}</td></tr>}
              @empty {<tr><td colspan="8" class="empty-cell">{{ cargando() ? 'Cargando…' : 'No hay estudiantes en este grupo.' }}</td></tr>}
            </tbody>
          </table></div>
        </section>
        <section class="surface block" aria-labelledby="lessons-title">
          <div class="block-head"><div><p class="eyebrow">{{ etiquetaSemestreActual() }}</p><h3 id="lessons-title">Lecciones</h3></div><button type="button" class="primary-button" [disabled]="!grupos.grupoActual()" (click)="nueva()">Registrar lección</button></div>
          <div class="table-wrap"><table>
            <thead><tr><th>Fecha</th><th>Hora</th><th>Tema</th><th>Semestre</th><th>Ausentes</th><th>Justificadas</th><th>Tardías</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (leccion of lecciones(); track leccion.idLeccion) {<tr><td>{{ fecha(leccion.fecha) }}</td><td>{{ hora(leccion.hora) }}</td><td>{{ leccion.tema || '—' }}</td><td>{{ semestreTexto(leccion.semestre) }}</td><td>{{ leccion.ausentes }}</td><td>{{ leccion.justificadas }}</td><td>{{ leccion.tardias }}</td><td class="actions"><button type="button" class="ghost-button" (click)="ver(leccion)">Ver</button><button type="button" class="ghost-button" (click)="editar(leccion)">Editar</button><button type="button" class="danger-button" (click)="eliminar(leccion)">Eliminar</button></td></tr>}
              @empty {<tr><td colspan="8" class="empty-cell">{{ cargando() ? 'Cargando…' : 'No hay lecciones registradas en el periodo consultado.' }}</td></tr>}
            </tbody>
          </table></div>
          @if (totalPaginas() > 1) {<div class="pagination"><button type="button" class="ghost-button" [disabled]="pagina() === 1" (click)="cambiarPagina(pagina() - 1)">Anterior</button><span>Página {{ pagina() }} de {{ totalPaginas() }} · {{ total() }} lecciones</span><button type="button" class="ghost-button" [disabled]="pagina() >= totalPaginas()" (click)="cambiarPagina(pagina() + 1)">Siguiente</button></div>}
        </section>
      }

      @if (editorAbierto()) {
        <div class="lesson-backdrop" role="presentation">
          <form class="lesson-modal surface" role="dialog" aria-modal="true" aria-labelledby="lesson-editor-title" (ngSubmit)="guardar()" novalidate>
            <div class="modal-head"><div><p class="eyebrow">{{ grupos.etiqueta(grupos.grupoActual()) }}</p><h3 id="lesson-editor-title">{{ editandoId() ? 'Modificar lección' : 'Registrar lección' }}</h3><p class="required-legend">* Campos obligatorios</p></div><button type="button" class="ghost-button" (click)="cerrarEditor()">Cancelar</button></div>
            <div class="form-grid">
              <label><span>Fecha *</span><input name="fecha" type="date" [max]="hoy" [(ngModel)]="draftFecha" required /></label>
              <label><span>Hora *</span><input name="hora" type="time" [(ngModel)]="draftHora" required /></label>
              <label class="wide"><span>Tema</span><input name="tema" maxlength="255" [(ngModel)]="draftTema" placeholder="Opcional" /></label>
            </div>
            @if (intentoGuardar && (!draftFecha || !draftHora)) {<p class="error-text">Indique la fecha y la hora de la lección.</p>}
            <fieldset><legend>Asistencia</legend>
              <p class="hint">Marque solo a quienes faltaron o llegaron tarde; los demás quedan presentes.</p>
              @for (student of estudiantesEditor(); track student.id) {
                <div class="attendance-row"><span><strong>{{ student['nombre'] }}</strong><small>{{ student['cedula'] }} · Matrícula {{ estadoMatricula(student['estado']).toLowerCase() }}</small></span>
                  <span class="marks" role="radiogroup" [attr.aria-label]="'Asistencia de ' + student['nombre']">
                    @for (opcion of opciones; track opcion.valor) {<label class="mark"><input type="radio" [name]="'m-' + student.id" [value]="opcion.valor" [ngModel]="marca(student.id)" (ngModelChange)="marcar(student.id, $event)" />{{ opcion.texto }}</label>}
                  </span></div>
              } @empty {<p class="hint">El grupo no tiene estudiantes matriculados.</p>}
            </fieldset>
            <div class="modal-actions"><span class="count">{{ conteo('A') }} ausentes · {{ conteo('T') }} tardíos</span><button type="button" class="ghost-button" (click)="cerrarEditor()">Cancelar</button><button type="submit" class="primary-button" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar lección' }}</button></div>
          </form>
        </div>
      }

      @if (detalle(); as d) {
        <div class="lesson-backdrop" role="presentation" (click)="detalle.set(null)">
          <section class="lesson-modal surface" role="dialog" aria-modal="true" aria-labelledby="lesson-detail-title" (click)="$event.stopPropagation()">
            <div class="modal-head"><div><p class="eyebrow">{{ d.leccion.asignatura }} · {{ d.leccion.seccion }} · {{ semestreTexto(d.leccion.semestre) }}</p><h3 id="lesson-detail-title">Lección del {{ fecha(d.leccion.fecha) }} a las {{ hora(d.leccion.hora) }}</h3><p>{{ d.leccion.tema || 'Sin tema' }}</p></div><button type="button" class="ghost-button" (click)="detalle.set(null)">Cerrar</button></div>
            <div class="table-wrap"><table>
              <thead><tr><th>Estudiante</th><th>Registro</th><th>Justificación</th><th>Acciones</th></tr></thead>
              <tbody>
                @for (a of d.ausentes; track a.cedulaEstudiante) {<tr><td><strong>{{ a.nombreEstudiante }}</strong><small>{{ a.cedulaEstudiante }}</small></td><td>{{ a.tardia ? 'Llegada tardía' : a.justificada ? 'Ausencia justificada' : 'Ausencia injustificada' }}</td><td>{{ a.tardia ? 'No aplica' : a.justificacion || '—' }}</td><td class="actions">@if (!a.tardia) {<button type="button" class="ghost-button" (click)="justificar(d, a)">{{ a.justificada ? 'Cambiar motivo' : 'Justificar' }}</button>@if (a.justificada) {<button type="button" class="ghost-button" (click)="anularJustificacion(d, a)">Anular justificación</button>}}</td></tr>}
                @empty {<tr><td colspan="4" class="empty-cell">Asistieron todos a tiempo.</td></tr>}
              </tbody>
            </table></div>
            <div class="modal-actions"><button type="button" class="danger-button" (click)="eliminar(d.leccion)">Eliminar lección</button><button type="button" class="primary-button" (click)="editar(d.leccion)">Modificar lección</button></div>
          </section>
        </div>
      }
    </section>
  `,
  styles: `
    .absence-page{display:grid;gap:.8rem;align-content:start}.page-header{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;border-left:5px solid #2f6b9a}.page-header h2,.page-header p,.block-head h3,.modal-head h3,.modal-head p{margin:0}.page-header p:last-child{margin-top:.3rem;color:#667085}
    .eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
    .filters{display:flex;gap:.6rem;flex-wrap:wrap;align-items:flex-end}.filters label{display:grid;gap:.15rem;color:#667085;font-size:.75rem;font-weight:700}.filters select{min-height:34px;padding:.3rem .5rem;border:1px solid #cfd9e3;border-radius:6px}
    .block{padding:1rem 1.15rem}.block-head{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:.6rem}
    .table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:.88rem}th{text-align:left;color:#667085;font-size:.74rem;text-transform:uppercase;letter-spacing:.05em;padding:.45rem .5rem;border-bottom:1px solid #e6edf3}td{padding:.5rem;border-bottom:1px solid #eef2f6;vertical-align:top}td small{display:block;color:#667085;font-size:.75rem}.empty-cell{text-align:center;color:#667085;padding:1.4rem}
    .actions{display:flex;gap:.35rem;flex-wrap:wrap}.actions button{min-height:30px;padding:.25rem .6rem;font-size:.78rem}
    .pagination{display:flex;justify-content:flex-end;align-items:center;gap:.6rem;margin-top:.6rem;color:#667085;font-size:.85rem}
    .empty{padding:1rem 1.15rem;color:#667085}.error-text{color:#b42318!important}
    .lesson-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:1rem;background:rgba(13,25,39,.52)}.lesson-modal{width:min(100%,760px);max-height:calc(100vh - 2rem);overflow:auto;padding:1.1rem 1.25rem}.modal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:.8rem}.modal-head p:not(.eyebrow){color:#667085;margin-top:.25rem}.required-legend{font-size:.78rem}
    .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}.form-grid label{display:grid;gap:.2rem;font-size:.82rem;font-weight:700;color:#344054}.form-grid .wide{grid-column:1/-1}.form-grid input{min-height:36px;padding:.35rem .5rem;border:1px solid #cfd9e3;border-radius:6px}
    fieldset{margin:.8rem 0 0;border:1px solid #e6edf3;border-radius:8px;padding:.6rem .8rem}legend{font-weight:700;color:#1e3a5f;padding:0 .3rem}.hint{margin:.1rem 0 .5rem;color:#667085;font-size:.8rem}
    .attendance-row{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.4rem 0;border-bottom:1px solid #f0f3f6}.attendance-row small{display:block;color:#667085;font-size:.75rem}.marks{display:flex;gap:.6rem}.mark{display:flex;align-items:center;gap:.25rem;font-size:.82rem}
    .modal-actions{display:flex;justify-content:flex-end;align-items:center;gap:.55rem;margin-top:.9rem;flex-wrap:wrap}.count{margin-right:auto;color:#667085;font-size:.82rem}
    @media (max-width:640px){.form-grid{grid-template-columns:1fr}.attendance-row{flex-direction:column;align-items:flex-start}}
  `,
})
export class AusentismoLeccionesVistaComponent {
  protected readonly grupos = inject(GruposProfesorService);
  private readonly contexto = inject(ProfesorRegularContextService);
  private readonly api = inject(ProfesorRegularApiService);
  private readonly feedback = inject(FeedbackService);

  protected readonly hoy = hoyCostaRica();
  protected readonly opciones: { valor: Marca; texto: string }[] = [{ valor: 'P', texto: 'Presente' }, { valor: 'A', texto: 'Ausente' }, { valor: 'T', texto: 'Tardío' }];
  // CU11: el semestre es opcional ('' = todo el curso lectivo); por defecto, el del periodo en curso.
  protected readonly semestreElegido = signal<string | null>(null);
  protected readonly semestre = computed(() => this.semestreElegido() ?? this.contexto.semestreConsulta());
  protected readonly resumen = signal<ProfesorRegularAusentismoApi[]>([]);
  protected readonly lecciones = signal<ProfesorRegularLeccionApi[]>([]);
  protected readonly pagina = signal(1);
  protected readonly total = signal(0);
  private readonly tamanoPagina = 10;
  protected readonly totalPaginas = computed(() => Math.ceil(this.total() / this.tamanoPagina));
  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly detalle = signal<ProfesorRegularLeccionDetalleApi | null>(null);
  protected readonly editorAbierto = signal(false);
  protected readonly editandoId = signal<number | string | null>(null);
  protected readonly guardando = signal(false);
  private readonly marcas = signal<Record<string, Marca>>({});
  protected draftFecha = '';
  protected draftHora = '';
  protected draftTema = '';
  protected intentoGuardar = false;
  private carga = 0;

  private readonly consulta = computed<ProfesorRegularConsultaAusentismo | null>(() => {
    const group = this.grupos.grupoActual();
    if (!group?.anio || group.nivel === undefined || group.numero === undefined || !group.codigoAsignatura) return null;
    return { anio: group.anio, nivel: group.nivel, numero: group.numero, codigoAsignatura: group.codigoAsignatura, semestre: this.semestre() || undefined };
  });
  protected readonly estudiantesEditor = computed(() => this.grupos.grupoActual()?.estudiantes ?? []);

  constructor() {
    effect(() => {
      const consulta = this.consulta();
      untracked(() => { this.pagina.set(1); this.cargar(consulta); });
    });
  }

  protected etiquetaSemestreActual(): string { return this.semestre() ? etiquetaSemestre(this.semestre()) : 'Todo el curso lectivo'; }
  protected semestreTexto(value: string): string { return etiquetaSemestre(value); }
  protected estadoMatricula(value: unknown): string { return etiquetaEstadoMatricula(value); }
  protected fecha(value: string): string { return fechaCostaRica(value); }
  protected hora(value: string): string { return String(value ?? '').slice(0, 5); }
  protected marca(cedula: string): Marca { return this.marcas()[cedula] ?? 'P'; }
  protected marcar(cedula: string, valor: Marca): void { this.marcas.update((actual) => ({ ...actual, [cedula]: valor })); }
  protected conteo(valor: Marca): number { return Object.values(this.marcas()).filter((item) => item === valor).length; }

  protected cambiarPagina(pagina: number): void { this.pagina.set(pagina); this.cargarLecciones(this.consulta()); }

  private cargar(consulta: ProfesorRegularConsultaAusentismo | null): void {
    this.resumen.set([]);
    this.lecciones.set([]);
    this.total.set(0);
    this.error.set('');
    if (!consulta) return;
    const carga = ++this.carga;
    this.cargando.set(true);
    forkJoin({ resumen: this.api.obtenerAusentismo(consulta), lecciones: this.api.listarLecciones(consulta, this.pagina(), this.tamanoPagina) }).subscribe({
      next: ({ resumen, lecciones }) => { if (carga !== this.carga) return; this.resumen.set(resumen); this.lecciones.set(lecciones.elementos); this.total.set(lecciones.total); this.cargando.set(false); },
      error: (error: unknown) => { if (carga !== this.carga) return; this.cargando.set(false); this.error.set(this.mensaje(error, 'No se pudo consultar el ausentismo del grupo.')); },
    });
  }

  private cargarLecciones(consulta: ProfesorRegularConsultaAusentismo | null): void {
    if (!consulta) return;
    this.api.listarLecciones(consulta, this.pagina(), this.tamanoPagina).subscribe({
      next: (response) => { this.lecciones.set(response.elementos); this.total.set(response.total); },
      error: (error: unknown) => this.feedback.error(this.mensaje(error, 'No se pudieron consultar las lecciones.')),
    });
  }

  private recargar(): void { this.cargar(this.consulta()); }

  // CU09: nueva lección con la fecha y la hora actuales de Costa Rica (RD-050).
  protected nueva(): void {
    this.editandoId.set(null);
    this.draftFecha = this.hoy;
    this.draftHora = horaCostaRica();
    this.draftTema = '';
    this.marcas.set({});
    this.intentoGuardar = false;
    this.editorAbierto.set(true);
  }

  // CU10: carga la lección vigente (GET) para corregirla.
  protected editar(leccion: ProfesorRegularLeccionApi): void {
    this.api.obtenerLeccion(leccion.idLeccion).subscribe({
      next: (d) => {
        this.detalle.set(null);
        this.editandoId.set(d.leccion.idLeccion);
        this.draftFecha = d.leccion.fecha;
        this.draftHora = this.hora(d.leccion.hora);
        this.draftTema = d.leccion.tema ?? '';
        this.marcas.set(Object.fromEntries(d.ausentes.map((a) => [a.cedulaEstudiante, (a.tardia ? 'T' : 'A') as Marca])));
        this.intentoGuardar = false;
        this.editorAbierto.set(true);
      },
      error: (error: unknown) => this.errorLeccion(error, 'No se pudo consultar la lección.'),
    });
  }

  protected cerrarEditor(): void { this.editorAbierto.set(false); this.guardando.set(false); }

  protected guardar(): void {
    this.intentoGuardar = true;
    const consulta = this.consulta();
    if (!consulta || !this.draftFecha || !this.draftHora || this.guardando()) return;
    const ausentes = Object.entries(this.marcas()).filter(([, valor]) => valor === 'A').map(([cedula]) => cedula);
    const tardias = Object.entries(this.marcas()).filter(([, valor]) => valor === 'T').map(([cedula]) => cedula);
    // DV-011 (CU09 FA 5, CU10 FA 3): se informa qué estudiante marcado no estaba matriculado en la fecha de la lección.
    const fueraDeFecha = this.estudiantesEditor().find((estudiante) => {
      if (!ausentes.includes(String(estudiante['cedula'])) && !tardias.includes(String(estudiante['cedula']))) return false;
      const matricula = String(estudiante['fechaMatricula'] ?? '');
      const retiro = String(estudiante['fechaRetiro'] ?? '');
      return (matricula !== '' && matricula > this.draftFecha) || (retiro !== '' && retiro < this.draftFecha);
    });
    if (fueraDeFecha) { this.feedback.error(`${fueraDeFecha['nombre']} no estaba matriculado en la sección el ${this.fecha(this.draftFecha)}. Quítelo de la lista o corrija la fecha.`); return; }
    const datos = { fecha: this.draftFecha, hora: `${this.draftHora.slice(0, 5)}:00`, tema: this.draftTema.trim(), ausentes, tardias };
    const id = this.editandoId();
    this.guardando.set(true);
    const peticion: Observable<unknown> = id === null
      ? this.api.registrarLeccion({ anio: consulta.anio, nivel: consulta.nivel, numero: consulta.numero, codigoAsignatura: consulta.codigoAsignatura, ...datos })
      : this.api.actualizarLeccion(id, datos);
    peticion.subscribe({
      next: () => { this.cerrarEditor(); this.feedback.exito(id === null ? 'La lección se registró correctamente.' : 'La lección se modificó correctamente.', id === null ? 'Lección registrada' : 'Lección modificada'); this.recargar(); },
      error: (error: unknown) => { this.guardando.set(false); this.errorLeccion(error, 'No se pudo guardar la lección.'); },
    });
  }

  // CU11: detalle de la lección con sus ausentes, tardíos y justificaciones.
  protected ver(leccion: ProfesorRegularLeccionApi): void {
    this.api.obtenerLeccion(leccion.idLeccion).subscribe({ next: (d) => this.detalle.set(d), error: (error: unknown) => this.errorLeccion(error, 'No se pudo consultar la lección.') });
  }

  // CU10 FA6: eliminar la lección con sus ausencias.
  protected async eliminar(leccion: ProfesorRegularLeccionApi): Promise<void> {
    if (!(await this.feedback.confirmar(`Se eliminará la lección del ${this.fecha(leccion.fecha)} a las ${this.hora(leccion.hora)} con sus ausencias y llegadas tardías.`, '¿Eliminar la lección?', 'Eliminar lección'))) return;
    this.api.eliminarLeccion(leccion.idLeccion).subscribe({
      next: () => { this.detalle.set(null); this.feedback.exito('La lección se eliminó correctamente.', 'Lección eliminada'); this.recargar(); },
      error: (error: unknown) => this.errorLeccion(error, 'No se pudo eliminar la lección.'),
    });
  }

  // CU10 FA4: justificar una ausencia con el motivo que escribe el profesor.
  protected async justificar(d: ProfesorRegularLeccionDetalleApi, ausencia: ProfesorRegularAusenciaApi): Promise<void> {
    const motivo = await this.feedback.solicitarTexto(`Motivo de la justificación de ${ausencia.nombreEstudiante} (entre 3 y 255 caracteres).`, ausencia.justificacion ?? '', 'Motivo');
    if (motivo === null) return;
    if (motivo.trim().length < 3 || motivo.trim().length > 255) { this.feedback.error('La justificación debe tener entre 3 y 255 caracteres.'); return; }
    this.api.justificarAusencia(d.leccion.idLeccion, ausencia.cedulaEstudiante, motivo.trim()).subscribe({
      next: () => { this.feedback.exito('La ausencia quedó justificada.', 'Justificación registrada'); this.refrescarDetalle(d); },
      error: (error: unknown) => this.errorLeccion(error, 'No se pudo registrar la justificación.'),
    });
  }

  // CU10 FA5: anular la justificación (la ausencia vuelve a ser injustificada).
  protected async anularJustificacion(d: ProfesorRegularLeccionDetalleApi, ausencia: ProfesorRegularAusenciaApi): Promise<void> {
    if (!(await this.feedback.confirmar(`La ausencia de ${ausencia.nombreEstudiante} volverá a ser injustificada.`, '¿Anular la justificación?', 'Anular'))) return;
    this.api.quitarJustificacion(d.leccion.idLeccion, ausencia.cedulaEstudiante).subscribe({
      next: () => { this.feedback.exito('Se anuló la justificación.', 'Justificación anulada'); this.refrescarDetalle(d); },
      error: (error: unknown) => this.errorLeccion(error, 'No se pudo anular la justificación.'),
    });
  }

  private refrescarDetalle(d: ProfesorRegularLeccionDetalleApi): void {
    this.api.obtenerLeccion(d.leccion.idLeccion).subscribe({ next: (actual) => this.detalle.set(actual), error: () => this.detalle.set(null) });
    this.recargar();
  }

  // Muestra el mensaje de la API; si la lección ya no existe (NF010), cierra y actualiza el listado.
  private errorLeccion(error: unknown, respaldo: string): void {
    this.feedback.error(this.mensaje(error, respaldo));
    if ((error as { status?: number })?.status === 404) { this.detalle.set(null); this.cerrarEditor(); this.recargar(); }
  }

  private mensaje(error: unknown, respaldo: string): string { return (error as { error?: { mensaje?: string } })?.error?.mensaje ?? respaldo; }
}
