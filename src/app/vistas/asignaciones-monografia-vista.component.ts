import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { EstudiantesApiService } from '../nucleo/api/estudiantes-api.service';
import { ProfesoresApiService } from '../nucleo/api/profesores-api.service';
import { AsignaturasApiService } from '../nucleo/api/asignaturas-api.service';
import { MonografiaApi, MonografiasApiService } from '../nucleo/api/monografias-api.service';
import { CursosLectivosApiService } from '../nucleo/api/cursos-lectivos-api.service';
import { FeedbackService } from '../compartidos/servicios/feedback.service';
import { fechaCostaRica } from '../compartidos/utilidades/fechas';

interface Opcion { cedula: string; nombre: string; activo?: boolean; roles?: string[] }
interface AsignaturaOpcion { codigo: string; nombre: string }

/** Fila de monografía: se identifica por la cédula del estudiante (RD-039: antes por nombre y la edición siempre fallaba). */
interface MonografiaRow {
  cedulaEstudiante: string;
  estudiante: string;
  anioInicio: number;
  seccionActual: string;
  cedulaCoordinador: string;
  coordinador: string;
  codigoAsignatura: string;
  asignatura: string;
  estado: string;
  seguimientos: number;
  ultimoSeguimiento: string;
}

interface Borrador { cedulaEstudiante: string; cedulaCoordinador: string; codigoAsignatura: string; anioInicio: string }

const ESTADOS: Record<string, string> = { CAPACITACION: 'Capacitación', INVESTIGACION: 'Investigación', TERMINADA: 'Terminada' };

@Component({
  selector: 'app-vista-asignaciones-monografia',
  imports: [FormsModule],
  template: `
    <section class="assignment-page" aria-labelledby="assignment-title">
      <header class="surface page-header"><div><p class="eyebrow">Administración</p><h2 id="assignment-title">Asignación de coordinación de monografía</h2><p>Enlace cada estudiante con su asignatura y Profesor Coordinador de Monografía.</p></div><button type="button" class="primary-button" (click)="nuevo()">Asignar coordinación</button></header>
      <section class="surface assignment-list">
        <div class="filters">
          <label>Año de inicio<select [(ngModel)]="filtroAnio" aria-label="Filtrar monografías por año de inicio"><option value="">Todos</option>@for (anio of anios(); track anio) {<option [value]="anio">{{ anio }}</option>}</select></label>
          <label>Coordinador<select [(ngModel)]="filtroCoordinador" aria-label="Filtrar monografías por coordinador"><option value="">Todos</option>@for (teacher of teachers(); track teacher.cedula) {<option [value]="teacher.cedula">{{ teacher.nombre }}</option>}</select></label>
          <label>Asignatura<select [(ngModel)]="filtroAsignatura" aria-label="Filtrar monografías por asignatura"><option value="">Todas</option>@for (subject of subjects(); track subject.codigo) {<option [value]="subject.codigo">{{ subject.nombre }}</option>}</select></label>
          <label>Estado<select [(ngModel)]="filtroEstado" aria-label="Filtrar monografías por estado"><option value="">Todos</option><option value="CAPACITACION">Capacitación</option><option value="INVESTIGACION">Investigación</option><option value="TERMINADA">Terminada</option></select></label>
          <div class="filter-actions"><button type="button" class="primary-button" (click)="filtrar()">Filtrar</button>@if (hayFiltros()) {<button type="button" class="ghost-button" (click)="limpiarFiltros()">Limpiar filtros</button>}</div>
        </div>
        <div class="table-head"><strong>Estudiante</strong><strong>Asignatura</strong><strong>Profesor Coordinador</strong><strong>Seguimientos</strong><strong></strong></div>
        @for (item of monographs(); track item.cedulaEstudiante) {
          <div class="assignment-row"><div><strong>{{ item.estudiante }}</strong><small>{{ item.cedulaEstudiante }} · {{ item.seccionActual }} · {{ etiquetaEstado(item.estado) }}</small></div><span>{{ item.asignatura }}</span><span>{{ item.coordinador }}</span><span>{{ item.seguimientos }}{{ item.ultimoSeguimiento ? ' (último ' + item.ultimoSeguimiento + ')' : '' }}</span><div class="row-actions"><button type="button" class="ghost-button" (click)="ver(item)">Ver</button><button type="button" class="ghost-button" (click)="editar(item)">Editar</button><button type="button" class="danger-button" (click)="eliminar(item)">Eliminar</button></div></div>
        } @empty {<p class="empty">{{ errorCarga() ? 'No se pudieron cargar los registros. Intente de nuevo más tarde.' : 'No se encontraron monografías.' }}</p>}
        @if (paginacionVisible()) { <nav class="pagination-bar" aria-label="Paginación de asignaciones de monografía"><span>Mostrando {{ rangoInicio() }}-{{ rangoFin() }} de {{ totalRegistros() }}</span><div class="pagination-actions"><button type="button" class="ghost-button" [disabled]="paginaActual() === 1" (click)="cambiarPagina(paginaActual() - 1)">Anterior</button><span>Página {{ paginaActual() }} de {{ totalPaginas() }}</span><button type="button" class="ghost-button" [disabled]="paginaActual() >= totalPaginas()" (click)="cambiarPagina(paginaActual() + 1)">Siguiente</button></div></nav> }
      </section>
      @if (detalle(); as d) {
        <div class="modal-backdrop" role="presentation"><section class="editor-modal" role="dialog" aria-modal="true"><div class="modal-heading"><div><p class="eyebrow">Consulta</p><h3>Detalle de la monografía</h3></div><button type="button" class="close-button" (click)="detalle.set(null)">×</button></div>
          <dl class="detail-grid"><div><dt>Estudiante</dt><dd>{{ d.estudiante }} ({{ d.cedulaEstudiante }})</dd></div><div><dt>Sección actual</dt><dd>{{ d.seccionActual }}</dd></div><div><dt>Año de inicio</dt><dd>{{ d.anioInicio }}</dd></div><div><dt>Asignatura</dt><dd>{{ d.asignatura }}</dd></div><div><dt>Profesor Coordinador</dt><dd>{{ d.coordinador }}</dd></div><div><dt>Estado</dt><dd>{{ etiquetaEstado(d.estado) }}</dd></div><div><dt>Seguimientos</dt><dd>{{ d.seguimientos }}</dd></div><div><dt>Último seguimiento</dt><dd>{{ d.ultimoSeguimiento || 'Sin seguimientos' }}</dd></div></dl>
          <div class="modal-actions"><button type="button" class="ghost-button" (click)="detalle.set(null)">Cerrar</button></div></section></div>
      }
      @if (editorOpen()) {
        <div class="modal-backdrop" role="presentation"><form class="editor-modal" (ngSubmit)="guardar()"><div class="modal-heading"><div><p class="eyebrow">Asignación de coordinación de monografía</p><h3>{{ editingId() ? 'Editar asignación' : 'Nueva asignación' }}</h3><p class="required-legend">* Campos obligatorios</p></div><button type="button" class="close-button" (click)="cerrar()">×</button></div>
          <div class="form-grid">
            <label>Estudiante<select name="estudiante" [(ngModel)]="draft.cedulaEstudiante" [disabled]="!!editingId()" required><option value="">Seleccione un estudiante</option>@for (student of students(); track student.cedula) {<option [value]="student.cedula">{{ student.nombre }} ({{ student.cedula }})</option>}</select></label>
            <label>Año de inicio<input type="number" name="anioInicio" [(ngModel)]="draft.anioInicio" [readonly]="!!editingId()" min="2000" max="2100" required /></label>
            <label>Profesor Coordinador de Monografía<select name="coordinador" [(ngModel)]="draft.cedulaCoordinador" required><option value="">Seleccione un coordinador</option>@for (teacher of coordinadoresElegibles(); track teacher.cedula) {<option [value]="teacher.cedula">{{ teacher.nombre }}</option>}</select>@if (!coordinadoresElegibles().length) {<small class="hint">No hay profesores con el rol Profesor Coordinador de Monografía activo.</small>}</label>
            <label>Asignatura<select name="area" [(ngModel)]="draft.codigoAsignatura" required><option value="">Seleccione una asignatura</option>@for (subject of subjects(); track subject.codigo) {<option [value]="subject.codigo">{{ subject.nombre }}</option>}</select></label>
          </div>
          <div class="modal-actions"><button type="button" class="ghost-button" (click)="cerrar()">Cancelar</button><button type="submit" class="primary-button">Guardar asignación</button></div></form></div>
      }
    </section>
  `,
  styles: `
      .pagination-bar{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem 0 0;color:#667085;font-size:.76rem}.pagination-actions{display:flex;align-items:center;gap:.7rem}.pagination-actions button{padding:.35rem .65rem;font-size:.72rem}.pagination-actions button:disabled{opacity:.45;cursor:not-allowed}
     .assignment-page{display:grid;gap:1rem;align-content:start}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.page-header h2,.page-header p:last-child{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.assignment-list{padding:1rem 1.2rem}.table-head,.assignment-row{display:grid;grid-template-columns:1.35fr 1.4fr 1.45fr 170px;gap:1rem;align-items:center}.table-head{padding:.2rem 0 .65rem;color:#667085;font-size:.75rem;text-transform:uppercase}.assignment-row{padding:.75rem 0;border-top:1px solid #e6edf3}.assignment-row strong,.assignment-row small{display:block}.assignment-row small{margin-top:.15rem;color:#667085}.assignment-row span{color:#475467}.row-actions{display:flex;justify-content:flex-end;gap:.45rem}.danger-button{border:0;border-radius:5px;padding:.5rem .7rem;background:#fff0f1;color:#b42318;font:inherit;font-size:.76rem;font-weight:700;cursor:pointer}.empty{padding:1rem 0;color:#667085}.modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:1rem;background:rgba(13,25,39,.52)}.editor-modal{width:min(100%,720px);padding:1.2rem;border-radius:10px;background:#fff;box-shadow:0 20px 60px rgba(4,26,55,.3)}.modal-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem}.modal-heading h3{margin:0;color:#1e3a5f}.close-button{width:32px;height:32px;border:0;border-radius:50%;background:#f2f5f7;color:#667085;font-size:1.25rem;cursor:pointer}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.form-grid label{display:grid;gap:.4rem;font-weight:700}.modal-actions{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1rem}@media(max-width:700px){.page-header{align-items:flex-start;flex-direction:column}.table-head{display:none}.assignment-row{grid-template-columns:1fr;gap:.35rem}.assignment-row button{width:100%}.form-grid{grid-template-columns:1fr}}
     .filters{display:flex;flex-wrap:wrap;gap:.75rem;align-items:flex-end;margin-bottom:1rem}.filters label{display:grid;gap:.25rem;font-size:.75rem;color:#667085}.filter-actions{display:flex;gap:.5rem}
     .assignment-list .table-head,.assignment-list .assignment-row{grid-template-columns:1.4fr 1.2fr 1.3fr .9fr 230px}
     .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem 1.25rem;margin:1rem 0}.detail-grid dt{font-size:.72rem;color:#667085;text-transform:uppercase}.detail-grid dd{margin:.15rem 0 0}.hint{color:#b42318}
    /* Celular: cada fila en bloque y las acciones a lo ancho (las reglas por columnas de arriba tienen más peso). */
    @media (max-width: 700px) { .assignment-list .table-head { display: none !important; } .assignment-list .assignment-row { grid-template-columns: 1fr !important; gap: .35rem; } .assignment-list .row-actions { display: flex; flex-wrap: wrap; gap: .5rem; } .assignment-list .row-actions > button { flex: 1 1 7rem; } }
  `,
})
// Administra las asignaciones de monografías (Administrador CU29 a CU32).
export class AsignacionesMonografiaVistaComponent {
  private readonly estudiantesApi = inject(EstudiantesApiService);
  private readonly profesoresApi = inject(ProfesoresApiService);
  private readonly asignaturasApi = inject(AsignaturasApiService);
  private readonly monografiasApi = inject(MonografiasApiService);
  private readonly cursosApi = inject(CursosLectivosApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly monographRows = signal<MonografiaRow[]>([]);
  /** RV2 CU30 FA4: si la carga falla, el listado no se presenta como vacío. */
  protected readonly errorCarga = signal(false);
  protected readonly paginaActual = signal(1);
  protected readonly totalRegistros = signal(0);
  protected readonly tamanoPagina = 10;
  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalRegistros() / this.tamanoPagina)));
  private readonly studentRows = signal<Opcion[]>([]);
  private readonly teacherRows = signal<Opcion[]>([]);
  private readonly subjectRows = signal<AsignaturaOpcion[]>([]);
  private readonly estadosPeriodo = signal<Record<number, string>>({});
  protected readonly monographs = computed(() => this.monographRows());
  protected readonly students = computed(() => this.studentRows());
  protected readonly teachers = computed(() => this.teacherRows());
  protected readonly subjects = computed(() => this.subjectRows());
  protected readonly anios = computed(() => Object.keys(this.estadosPeriodo()).map(Number).sort((a, b) => b - a));
  protected readonly editorOpen = signal(false);
  protected readonly editingId = signal('');
  protected readonly detalle = signal<MonografiaRow | null>(null);
  protected draft: Borrador = { cedulaEstudiante: '', cedulaCoordinador: '', codigoAsignatura: '', anioInicio: '' };
  protected filtroAnio = '';
  protected filtroCoordinador = '';
  protected filtroAsignatura = '';
  protected filtroEstado = '';

  constructor() {
    // RD-037: las listas del formulario cargan hasta 100 registros.
    this.estudiantesApi.listarPaginado('', 1, 100).pipe(map((response) => response.elementos)).subscribe({ next: (items) => this.studentRows.set(items.map((item) => ({ cedula: item.cedula, nombre: [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' ') }))), error: () => this.feedback.error('No se pudieron cargar los estudiantes.') });
    this.profesoresApi.listarPaginado('', 1, 100).pipe(map((response) => response.elementos)).subscribe({ next: (items) => this.teacherRows.set(items.map((item) => ({ cedula: item.cedula, activo: item.activo, roles: item.roles, nombre: [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' ') }))), error: () => this.feedback.error('No se pudieron cargar los profesores.') });
    this.asignaturasApi.listar({ pagina: 1, tamanoPagina: 100 }).subscribe({ next: (response) => this.subjectRows.set(response.elementos.filter((item) => item.tipo === 'SUPERIOR' || item.tipo === 'MEDIO').map((item) => ({ codigo: item.codigo, nombre: item.nombre }))), error: () => this.feedback.error('No se pudieron cargar las asignaturas.') });
    this.cursosApi.listarPaginado(1, 100).subscribe({ next: (response) => this.estadosPeriodo.set(Object.fromEntries(response.elementos.map((curso) => [curso.anio, curso.estado]))) });
    this.cargarMonografias();
  }

  protected etiquetaEstado(estado: string): string { return ESTADOS[estado] ?? estado; }

  private aFila(item: MonografiaApi): MonografiaRow {
    return { cedulaEstudiante: item.cedulaEstudiante, estudiante: item.nombreEstudiante, anioInicio: item.anioInicio, seccionActual: item.seccionActual ? `${item.anioActual} ${item.seccionActual}` : 'Sin sección vigente', cedulaCoordinador: item.cedulaCoordinador, coordinador: item.nombreCoordinador, codigoAsignatura: item.codigoAsignatura, asignatura: item.asignatura, estado: item.estado, seguimientos: item.seguimientos ?? 0, ultimoSeguimiento: item.ultimoSeguimiento ? fechaCostaRica(item.ultimoSeguimiento) : '' };
  }

  private cargarMonografias(pagina = this.paginaActual()): void {
    // RD-041: filtros de la API por año de inicio, coordinador, asignatura y estado.
    this.monografiasApi.listar({ pagina, tamanoPagina: this.tamanoPagina, anioInicio: this.filtroAnio ? Number(this.filtroAnio) : undefined, cedulaCoordinador: this.filtroCoordinador || undefined, codigoAsignatura: this.filtroAsignatura || undefined, estado: this.filtroEstado || undefined }).subscribe({
      next: (response) => { this.errorCarga.set(false); this.totalRegistros.set(response.total); this.monographRows.set(response.elementos.map((item) => this.aFila(item))); },
      error: (error) => { this.errorCarga.set(true); this.totalRegistros.set(0); this.monographRows.set([]); this.feedback.error(error?.error?.mensaje ?? 'No se pudieron cargar las monografías.'); },
    });
  }

  protected filtrar(): void { this.paginaActual.set(1); this.cargarMonografias(1); }
  protected hayFiltros(): boolean { return Boolean(this.filtroAnio || this.filtroCoordinador || this.filtroAsignatura || this.filtroEstado); }
  protected limpiarFiltros(): void { this.filtroAnio = ''; this.filtroCoordinador = ''; this.filtroAsignatura = ''; this.filtroEstado = ''; this.filtrar(); }

  protected paginacionVisible(): boolean { return this.totalRegistros() > this.tamanoPagina; }
  protected rangoInicio(): number { return this.totalRegistros() ? (this.paginaActual() - 1) * this.tamanoPagina + 1 : 0; }
  protected rangoFin(): number { return Math.min(this.paginaActual() * this.tamanoPagina, this.totalRegistros()); }
  protected cambiarPagina(page: number): void { if (page < 1 || page > this.totalPaginas() || page === this.paginaActual()) return; this.paginaActual.set(page); this.cargarMonografias(page); }

  /**
   * RD-041: coordinadores elegibles: cuenta activa con el rol Profesor Coordinador de Monografía. Si la cohorte
   * empezó en un periodo ya finalizado (digitalización, RN-78) no se exige el rol y se ofrecen todos. El
   * coordinador actual siempre aparece al editar.
   */
  protected coordinadoresElegibles(): Opcion[] {
    const finalizado = this.estadosPeriodo()[Number(this.draft.anioInicio)] === 'FINALIZADO';
    const elegibles = finalizado ? this.teachers() : this.teachers().filter((teacher) => teacher.activo && teacher.roles?.includes('COORD_MONOGRAFIA'));
    const actual = this.teachers().find((teacher) => teacher.cedula === this.draft.cedulaCoordinador);
    return actual && !elegibles.includes(actual) ? [actual, ...elegibles] : elegibles;
  }

  protected nuevo(): void {
    this.editingId.set('');
    this.draft = { cedulaEstudiante: '', cedulaCoordinador: '', codigoAsignatura: '', anioInicio: String(new Date().getFullYear()) };
    this.editorOpen.set(true);
  }

  /** RD-041/RD-008: detalle y edición con los datos vigentes (GET); un 404 informa y actualiza el listado. */
  protected ver(item: MonografiaRow): void {
    this.monografiasApi.obtener(item.cedulaEstudiante).subscribe({ next: (actual) => this.detalle.set(this.aFila(actual)), error: (error) => this.errorAccion(error, 'No se pudo consultar la monografía.') });
  }

  protected editar(item: MonografiaRow): void {
    this.monografiasApi.obtener(item.cedulaEstudiante).subscribe({
      next: (actual) => {
        this.editingId.set(actual.cedulaEstudiante);
        this.draft = { cedulaEstudiante: actual.cedulaEstudiante, cedulaCoordinador: actual.cedulaCoordinador, codigoAsignatura: actual.codigoAsignatura, anioInicio: String(actual.anioInicio) };
        this.editorOpen.set(true);
      },
      error: (error) => this.errorAccion(error, 'No se pudo consultar la monografía.'),
    });
  }

  protected guardar(): void {
    const d = this.draft;
    if (!d.cedulaEstudiante || !d.cedulaCoordinador || !d.codigoAsignatura) { this.feedback.error('Seleccione el estudiante, el coordinador y la asignatura.'); return; }
    const anio = Number(d.anioInicio);
    if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) { this.feedback.error('Indique un año de inicio válido.'); return; }
    const editando = Boolean(this.editingId());
    const operation = editando
      ? this.monografiasApi.actualizar(d.cedulaEstudiante, d.cedulaCoordinador, d.codigoAsignatura)
      : this.monografiasApi.registrar({ anio, cedulaEstudiante: d.cedulaEstudiante, cedulaCoordinador: d.cedulaCoordinador, codigoAsignatura: d.codigoAsignatura });
    operation.subscribe({ next: () => { this.feedback.exito(editando ? 'La coordinación de monografía fue actualizada.' : 'La coordinación de monografía fue registrada.'); this.cargarMonografias(); this.cerrar(); }, error: (error) => this.errorAccion(error, 'No se pudo guardar la coordinación de monografía.') });
  }

  protected async eliminar(item: MonografiaRow): Promise<void> {
    if (!await this.feedback.confirmar(`¿Eliminar la coordinación de monografía de ${item.estudiante} (${item.cedulaEstudiante})?`, 'Eliminar coordinación', 'Eliminar')) return;
    this.monografiasApi.borrar(item.cedulaEstudiante).subscribe({ next: () => { this.feedback.exito('La coordinación de monografía fue eliminada.'); this.cargarMonografias(); }, error: (error) => this.errorAccion(error, 'No se pudo eliminar la coordinación de monografía.') });
  }

  /** RD-012: si el registro ya no existe, informa, cierra el formulario y actualiza el listado. */
  private errorAccion(error: { status?: number; error?: { mensaje?: string } }, respaldo: string): void {
    this.feedback.error(error.error?.mensaje ?? respaldo);
    if (error.status !== 404) return;
    this.cerrar();
    this.detalle.set(null);
    this.cargarMonografias();
  }

  protected cerrar(): void { this.editorOpen.set(false); }
}
