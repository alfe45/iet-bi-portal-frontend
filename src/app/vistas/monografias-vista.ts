import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { PeriodoActualApi, CursosLectivosApiService } from '../nucleo/api/cursos-lectivos-api.service';
import { CoordinadorMonografiaApiService, DetalleMonografiaApi, EstadoMonografiaApi, MonografiaApi, ReporteMonografiaApi, SeguimientoMonografiaApi } from '../nucleo/api/coordinador-monografia-api.service';
import { fechaCostaRica, hoyCostaRica } from '../compartidos/utilidades/fechas';
import { FeedbackService } from '../compartidos/servicios/feedback.service';

@Component({
  selector: 'app-vista-monografias',
  imports: [FormsModule],
  template: `
    <section class="monographs-page" aria-labelledby="monographs-title">
      <header class="page-header"><div><h2 id="monographs-title">Mis estudiantes de monografía</h2></div></header>

      @if(loading()){<p role="status">Cargando monografías...</p>}
      <section class="filters" aria-label="Criterios de búsqueda"><label>Año de inicio<select [ngModel]="filtroAnio()" (ngModelChange)="filtroAnio.set($event); filtrar()" aria-label="Filtrar por año de inicio"><option [ngValue]="null">Todos</option>@for (anio of aniosInicio(); track anio) {<option [ngValue]="anio">{{ anio }}</option>}</select></label><label>Estado<select [ngModel]="filtroEstado()" (ngModelChange)="filtroEstado.set($event); filtrar()" aria-label="Filtrar por estado"><option [ngValue]="null">Todos</option><option value="CAPACITACION">Capacitación</option><option value="INVESTIGACION">Investigación</option><option value="TERMINADA">Terminada</option></select></label>@if (filtroAnio() || filtroEstado()) {<button type="button" class="ghost-button" (click)="limpiarFiltros()">Limpiar filtros</button>}</section>
       @if(!loading() && monographs().length === 0){<p class="empty">{{ errorListado() ? 'No se pudieron cargar las monografías. Intente de nuevo más tarde.' : filtroAnio() || filtroEstado() ? 'No coordina monografías que cumplan los criterios.' : 'No hay monografías asignadas.' }}</p>}

      @if(monographs().length > 0){<section class="student-selector" aria-label="Monografías asignadas">
        <strong>Monografías asignadas</strong>
        <div class="student-options">@for(item of monographs(); track item.cedulaEstudiante){<button type="button" [attr.title]="item.asignatura" [attr.aria-pressed]="item.cedulaEstudiante === selectedId()" [class.selected]="item.cedulaEstudiante === selectedId()" (click)="seleccionar(item)"><span>{{ item.nombreEstudiante }}</span><small>{{ item.asignatura }} · {{ etiquetaEstado(item.estado) }} · inicio {{ item.anioInicio }}</small></button>}</div>
      </section>}

      @if(selected(); as item){
           <div class="selected-toolbar"><div><h3>{{ item.nombreEstudiante }}</h3><p>{{ item.asignatura }} <span class="status-chip">{{ etiquetaEstado(item.estado) }}</span></p></div><div class="top-actions"><button type="button" class="send-button info-button" style="color:#fff;background:#2f80b7;border-color:#2f80b7" [disabled]="saving() || loadingDetail()" (click)="abrirCambioEstado()">Cambiar estado</button><button type="button" class="send-button observations-button" style="color:#fff;background:#7650a8;border-color:#7650a8" [disabled]="saving() || loadingDetail() || !periodoReporte() || reporteConfirmado()" (click)="abrirEdicionObservaciones()">{{ reporteConfirmado() ? 'Reporte confirmado' : 'Observaciones' }}</button><button type="button" class="send-button" [disabled]="saving() || loadingDetail() || reporteConfirmado() || !informacionCompleta()" (click)="abrirEnvioInforme()">Confirmar al Profesor Guía</button></div></div>

           <section class="report-period" aria-label="Periodo del reporte"><strong>Reporte al Profesor Guía</strong><label>Año<select [ngModel]="reporteAnio()" (ngModelChange)="reporteAnio.set($event)" aria-label="Año del reporte">@for (anio of aniosReporte(); track anio) {<option [ngValue]="anio">{{ anio }}</option>}</select></label><label>Semestre<select [ngModel]="reporteSemestre()" (ngModelChange)="reporteSemestre.set($event)" aria-label="Semestre del reporte"><option value="I_SEMESTRE">I semestre</option><option value="II_SEMESTRE">II semestre</option></select></label>@if (draftReport()) {<button type="button" class="ghost-button" [disabled]="saving()" (click)="retirarBorrador()">Retirar borrador</button>}</section>
           @if(loadingDetail()){<p role="status">Cargando información de la monografía...</p>}
           @else if(!periodoReporte()){<p class="empty">Elija el año y el semestre del reporte.</p>}
            @else if (reporteConfirmado()) {<p class="report-lock-message">Este reporte ya fue confirmado al Profesor Guía y su edición está bloqueada. Solo el Profesor Guía puede reactivarla; cuando lo haga, podrá corregir el reporte y confirmarlo nuevamente.</p>}
           @else if (!informacionCompleta()) {<p class="report-warning">Complete las observaciones de la monografía antes de confirmar el reporte.</p>}

         @if(detail(); as detalle){<section class="content-block monograph-summary"><div class="block-heading"><h3>Datos de la monografía</h3></div>
             <dl class="info-grid"><div><dt>Asignatura</dt><dd>{{ detalle.monografia.asignatura }}</dd></div><div><dt>Estado</dt><dd>{{ etiquetaEstado(detalle.monografia.estado) }}</dd></div><div><dt>Año de inicio</dt><dd>{{ detalle.monografia.anioInicio }}</dd></div><div><dt>Año actual</dt><dd>{{ detalle.monografia.anioActual }}</dd></div><div><dt>Sección actual</dt><dd>{{ detalle.monografia.seccionActual }}</dd></div><div><dt>Profesor Coordinador</dt><dd>{{ detalle.monografia.nombreCoordinador }}</dd></div><div class="full"><dt>Reporte de {{ etiquetaSemestre(reporteSemestre()) }} {{ reporteAnio() }}</dt>@if(draftReport(); as reporte){<dd class="observation-entry"><p>{{ reporte.observaciones }}</p></dd>} @else if(confirmedReport(); as reporte){<dd class="observation-entry"><p>{{ reporte.observaciones }}</p><small>{{ reporte.anio }} · {{ etiquetaSemestre(reporte.semestre) }} · Confirmado {{ reporte.enviadoEn!.slice(0, 10) }}</small><strong>Confirmado al Profesor Guía · Edición bloqueada</strong></dd>} @else {<dd class="empty">Sin observaciones registradas.</dd>}</div></dl></section>
        <section class="content-block"><div class="block-heading follow-heading"><h3>Seguimiento</h3><button type="button" class="primary-button" [disabled]="saving()" (click)="nuevoSeguimiento()">Registrar seguimiento</button></div>
          @for (seg of seguimientosOrdenados(); track seg.idSeguimiento) {<article class="follow-up"><div><strong>{{ fecha(seg.fecha) }}</strong><p>{{ seg.observacion }}</p></div><div class="follow-actions"><button type="button" class="ghost-button" [disabled]="saving()" (click)="editarSeguimiento(seg)">Editar</button><button type="button" class="danger-button" [disabled]="saving()" (click)="eliminarSeguimiento(seg)">Eliminar</button></div></article>} @empty {<p class="empty">Sin seguimientos registrados.</p>}
        </section>
        <section class="content-block"><div class="block-heading"><h3>Reportes semestrales</h3></div>
          @for (rep of reportesOrdenados(); track rep.anio + rep.semestre) {<article class="follow-up"><div><strong>{{ rep.anio }} · {{ etiquetaSemestre(rep.semestre) }}</strong><p>{{ rep.observaciones }}</p></div><span class="status-chip">{{ rep.enviadoEn ? 'Confirmado el ' + fecha(rep.enviadoEn) : 'Borrador' }}</span></article>} @empty {<p class="empty">Sin reportes registrados.</p>}
        </section>}
      }
           @if(reportModal(); as modal){<div class="modal-backdrop" role="presentation"><section class="monograph-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title"><div class="modal-heading"><div><p class="eyebrow">{{ modal === 'status' ? 'Información de la monografía' : modal === 'observations' ? 'Observaciones de la monografía' : 'Confirmación al Profesor Guía' }}</p><h3 id="report-modal-title">{{ modal === 'status' ? 'Cambiar el estado de la monografía' : modal === 'observations' ? 'Observaciones' : 'Confirmar al Profesor Guía' }}</h3>@if (modal !== 'confirm-send') { <p class="required-legend">* Campos obligatorios</p> }</div><button type="button" class="close-button" (click)="cerrarModal()">×</button></div>
                 @if(modal === 'status'){<form class="modal-form" (ngSubmit)="guardarEstado()"><div class="form-grid"><p class="field-note">Estado actual: {{ etiquetaEstado(selected()!.estado) }}</p><label>Estado<select name="estado" [(ngModel)]="draftEstado" [disabled]="selected()?.estado === 'TERMINADA'"><option value="CAPACITACION">Capacitación</option><option value="INVESTIGACION">Investigación</option><option value="TERMINADA">Terminada</option></select>@if (selected()?.estado === 'TERMINADA') {<small class="field-note">Una monografía terminada no se puede reabrir.</small>}</label></div><div class="modal-actions"><button type="button" class="ghost-button" (click)="cerrarModal()">Cancelar</button><button type="submit" class="primary-button" [disabled]="saving()">Guardar estado</button></div></form>}
                  @else if(modal === 'observations'){<form class="modal-form" (ngSubmit)="guardarObservaciones()"><label>Observaciones<textarea name="reportObservation" rows="8" [(ngModel)]="reportObservation" minlength="3" maxlength="1000" required placeholder="Escriba las observaciones para el Profesor Guía"></textarea></label><div class="modal-actions"><button type="button" class="ghost-button" (click)="cerrarModal()">Cancelar</button><button type="submit" class="primary-button" [disabled]="saving()">Guardar</button></div></form>}
                  @else if(modal === 'confirm-send'){<p>La información de la monografía está completa. ¿Desea confirmar las observaciones de <strong>{{ selected()?.nombreEstudiante }}</strong> al Profesor Guía?</p><div class="warning-box">Después de confirmar, usted no podrá modificar ni volver a enviar este reporte. Si necesita corregirlo, el Profesor Guía deberá reactivar la edición.</div><div class="modal-actions"><button type="button" class="ghost-button" (click)="cerrarModal()">Cancelar</button><button type="button" class="send-button" [disabled]="saving()" (click)="confirmarEnvio()">Confirmar al Profesor Guía</button></div>}
         </section></div>}
      @if (seguimientoAbierto()) {<div class="modal-backdrop" role="presentation"><section class="monograph-modal" role="dialog" aria-modal="true" aria-labelledby="follow-title"><div class="modal-heading"><div><p class="eyebrow">{{ selected()?.nombreEstudiante }}</p><h3 id="follow-title">{{ seguimientoId() ? 'Modificar seguimiento' : 'Registrar seguimiento' }}</h3><p class="required-legend">* Campos obligatorios</p></div><button type="button" class="close-button" (click)="seguimientoAbierto.set(false)">×</button></div>
        <form class="modal-form" (ngSubmit)="guardarSeguimiento()"><div class="form-grid"><label>Fecha *<input name="fechaSeguimiento" type="date" [max]="hoy" [(ngModel)]="draftSeguimientoFecha" required /></label></div><label>Observación *<textarea name="observacionSeguimiento" rows="6" maxlength="1000" [(ngModel)]="draftSeguimientoObservacion" placeholder="Avance del estudiante"></textarea></label>@if (errorSeguimiento()) {<p class="report-warning" role="alert">{{ errorSeguimiento() }}</p>}<div class="modal-actions"><button type="button" class="ghost-button" (click)="seguimientoAbierto.set(false)">Cancelar</button><button type="submit" class="primary-button" [disabled]="saving()">Guardar seguimiento</button></div></form></section></div>}
    </section>
  `,
  styles: `
    .filters,.report-period{display:flex;align-items:flex-end;gap:.7rem;flex-wrap:wrap;padding:.8rem 1.2rem;border:1px solid #dbe5ef;border-radius:9px;background:#fff}.filters label,.report-period label{display:grid;gap:.2rem;color:#667085;font-size:.78rem;font-weight:700}.filters select,.report-period select{min-height:34px;padding:.3rem .5rem;border:1px solid #cfd9e3;border-radius:6px}.report-period strong{align-self:center;color:#1e3a5f}
    .follow-heading{display:flex;justify-content:space-between;align-items:center;gap:1rem}.follow-up{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding:.6rem 0;border-top:1px solid #eef2f6}.follow-up p{margin:.2rem 0 0;color:#475467;white-space:pre-wrap}.follow-actions{display:flex;gap:.4rem}.follow-actions button{min-height:30px;padding:.25rem .6rem;font-size:.78rem}
    .report-lock-message,.report-warning{margin:0;padding:.75rem;border-radius:6px;background:#fff4e5;font-weight:700}.report-lock-message{color:#8a4b00}.report-warning{color:#9a6700}.warning-box{padding:.75rem;border-radius:6px;background:#fff4e5;color:#8a4b00}.field-note{color:#8a4b00;font-size:.78rem;font-weight:600}
    .monographs-page{display:grid;gap:1rem;align-content:start}.page-header,.student-selector,.selected-toolbar,.content-block{padding:1rem 1.2rem;border:1px solid #dbe5ef;border-radius:9px;background:#fff}.page-header{border-left:5px solid #2f6b9a}.page-header h2,.page-header p:last-child,.selected-toolbar h3,.selected-toolbar p{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.student-options{display:flex;gap:.5rem;margin-top:.7rem;overflow-x:auto}.student-options button{display:grid;min-width:210px;padding:.65rem .8rem;border:1px solid #dbe5ef;border-radius:7px;background:#fff;color:#1e3a5f;text-align:left;cursor:pointer}.student-options button.selected{border-color:#2f6b9a;background:#eaf3f8;box-shadow:inset 0 0 0 1px #2f6b9a}.student-options small{margin-top:.15rem;color:#667085;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.selected-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.selected-toolbar p{margin-top:.25rem;color:#667085}.top-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.5rem}.content-block{display:grid;gap:1rem}.block-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.block-heading h3{margin:0;color:#1e3a5f;text-transform:uppercase;font-size:.92rem;letter-spacing:.04em}.block-heading p{margin:.25rem 0 0;color:#667085}.edit-button,.send-button{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:.5rem .8rem;border:1px solid transparent;border-radius:5px;font-weight:700;cursor:pointer}.edit-button{color:#8a4b00;background:#fff0d6;border-color:#f0bd6b}.send-button{color:#fff;background:#1b6f60;border-color:#1b6f60}.send-button:disabled{cursor:not-allowed;opacity:.5}.actions{display:flex;justify-content:flex-end;gap:.5rem}.info-grid,.report-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;margin:0}.info-grid>div,.report-grid>div{padding:.75rem;border:1px solid #e6edf3;border-radius:7px}.info-grid .full,.report-grid .full{grid-column:1/-1}.info-grid dt,.report-grid dt,.report-observation dt{font-size:.74rem;color:#667085}.info-grid dd,.report-grid dd{margin:.2rem 0 0;color:#1e3a5f;font-weight:600}.follow-ups{display:grid;gap:.6rem}.follow-ups article{display:grid;gap:.35rem;padding:.75rem;border-left:3px solid #b9d3e5;background:#f8fbfd}.follow-ups p,.follow-ups small{margin:0}.follow-ups small{color:#667085}.follow-up-top{display:flex;justify-content:space-between;gap:1rem}.inline-form{padding:.9rem;border:1px solid #b9d3e5;border-radius:7px;background:#f8fbfd}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}.form-grid label,.inline-form>label,.monograph-modal label{display:grid;gap:.35rem;font-weight:700}.form-grid .full{grid-column:1/-1}.text-button{justify-self:start;padding:0;border:0;background:none;color:#2f6b9a;font-weight:700;cursor:pointer}.report-observation{display:grid;gap:.25rem;padding:.8rem;border:1px solid #e6edf3;border-radius:7px}.report-observation p{margin:0;color:#1e3a5f}.report-observation small,.sent-status{color:#667085}.sent-status{margin:0;font-size:.82rem}.report-preview{display:grid;gap:.6rem;margin-top:.25rem;padding:1rem;background:#f8fbfd;border:1px solid #b9d3e5}.preview-label{margin:0;color:#667085;font-size:.74rem;font-weight:800;text-transform:uppercase}.report-preview h4{margin:0;text-align:center;letter-spacing:.08em}.report-preview table{width:100%;border-collapse:collapse}.report-preview th,.report-preview td{padding:.6rem;border:1px solid #222;text-align:left;vertical-align:top}.modal-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:1rem;background:rgba(20,36,54,.48)}.monograph-modal{width:min(560px,100%);max-height:90vh;overflow:auto;padding:1.2rem;border-radius:10px;background:#fff;box-shadow:0 18px 60px rgba(0,0,0,.25)}.modal-heading{display:flex;justify-content:space-between;gap:1rem;margin-bottom:1rem}.modal-heading h3{margin:0;color:#1e3a5f}.close-button{border:0;background:transparent;color:#667085;font-size:1.5rem;cursor:pointer}.readonly-fields{display:grid;gap:.6rem;margin-bottom:1rem}.readonly-fields div{display:grid;gap:.15rem;padding:.65rem;border:1px solid #e6edf3;border-radius:6px;background:#f8fbfd}.readonly-fields small{color:#667085}.modal-actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem}.empty{margin:0;color:#667085}@media(max-width:700px){.block-heading,.selected-toolbar{align-items:flex-start;flex-direction:column}.top-actions{justify-content:flex-start}.info-grid,.report-grid,.form-grid{grid-template-columns:1fr}.info-grid .full,.report-grid .full,.form-grid .full{grid-column:auto}}
  `,
})
// Gestiona la consulta de monografías.
export class MonografiasVista implements OnInit {
  private readonly api = inject(CoordinadorMonografiaApiService);
  private readonly periodosApi = inject(CursosLectivosApiService);
  private readonly feedback = inject(FeedbackService);
  private detalleRequestId = 0;
  protected readonly monographs = signal<MonografiaApi[]>([]);
  protected readonly selectedId = signal('');
  protected readonly selected = computed(() => this.monographs().find((item) => item.cedulaEstudiante === this.selectedId()) ?? null);
  protected readonly detail = signal<DetalleMonografiaApi | null>(null);
  protected readonly currentPeriod = signal<PeriodoActualApi | null>(null);
    protected readonly currentReport = computed(() => {
    const period = this.periodoReporte();
    if (!period) return null;
     return this.detail()?.reportes.find((report) => report.anio === period.anio && this.normalizarSemestre(report.semestre) === this.normalizarSemestre(period.semestreActual!)) ?? null;
   });
    protected readonly draftReport = computed(() => {
      const report = this.currentReport();
      return report && !report.enviadoEn ? report : null;
    });
    protected readonly confirmedReport = computed(() => {
      const report = this.currentReport();
      return report?.enviadoEn ? report : null;
    });
   protected readonly pendingObservation = signal('');
   protected readonly observationToSend = computed(() => this.pendingObservation().trim() || this.currentReport()?.observaciones?.trim() || '');
   protected readonly informacionCompleta = computed(() => {
     const observaciones = this.observationToSend();
     return observaciones.length >= 3 && observaciones.length <= 1000;
   });
   protected readonly reporteConfirmado = computed(() => Boolean(this.confirmedReport()));
  protected readonly loading = signal(false);
  // DV-002: la última carga del listado falló (no se muestra como "no hay monografías").
  protected readonly errorListado = signal(false);
  protected readonly loadingDetail = signal(false);
  protected readonly saving = signal(false);
  protected readonly reportModal = signal<'status' | 'observations' | 'confirm-send' | null>(null);
  protected draftEstado: EstadoMonografiaApi = 'INVESTIGACION';
  protected readonly hoy = hoyCostaRica();
  // CM01: filtros; la lista completa da los años de inicio disponibles.
  private readonly todas = signal<MonografiaApi[]>([]);
  protected readonly aniosInicio = computed(() => [...new Set(this.todas().map((item) => item.anioInicio))].sort((a, b) => b - a));
  protected readonly filtroAnio = signal<number | null>(null);
  protected readonly filtroEstado = signal<EstadoMonografiaApi | null>(null);
  // CM05: año y semestre del reporte (por defecto, los del periodo en curso).
  protected readonly reporteAnio = signal<number | null>(null);
  protected readonly reporteSemestre = signal('I_SEMESTRE');
  protected readonly periodoReporte = computed(() => { const anio = this.reporteAnio(); const semestre = this.reporteSemestre(); return anio && semestre ? { anio, semestreActual: semestre } : null; });
  protected readonly aniosReporte = computed(() => { const m = this.detail()?.monografia; const actual = this.reporteAnio(); const anios = m ? Array.from({ length: m.anioActual - m.anioInicio + 1 }, (_, i) => m.anioInicio + i) : []; return actual && !anios.includes(actual) ? [...anios, actual].sort() : anios; });
  // CM01/CM03/CM04: seguimiento (del más reciente al más antiguo) y reportes semestrales.
  protected readonly seguimientosOrdenados = computed(() => [...(this.detail()?.seguimientos ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.idSeguimiento - a.idSeguimiento));
  protected readonly reportesOrdenados = computed(() => [...(this.detail()?.reportes ?? [])].sort((a, b) => b.anio - a.anio || b.semestre.localeCompare(a.semestre)));
  protected readonly seguimientoAbierto = signal(false);
  protected readonly seguimientoId = signal<number | null>(null);
  protected readonly errorSeguimiento = signal('');
  protected draftSeguimientoFecha = '';
  protected draftSeguimientoObservacion = '';
  protected reportObservation = '';

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      monografias: this.api.listar(),
       periodo: this.periodosApi.obtenerActual().pipe(catchError(() => of(null))),
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ monografias, periodo }) => {
        this.errorListado.set(false);
        this.monographs.set(monografias);
        this.currentPeriod.set(periodo);
        this.todas.set(monografias);
        if (periodo) { this.reporteAnio.set(periodo.anio); this.reporteSemestre.set(periodo.semestreActual ?? 'I_SEMESTRE'); }
        if (monografias[0]) this.seleccionar(monografias[0]);
      },
       error: (error: unknown) => { this.errorListado.set(true); this.feedback.error(this.mensajeError(error, 'No se pudieron cargar las monografías.')); },
    });
  }

  protected seleccionar(item: MonografiaApi): void {
    this.selectedId.set(item.cedulaEstudiante);
    this.pendingObservation.set('');
    this.reportObservation = '';
    const requestId = ++this.detalleRequestId;
    this.detail.set(null);
    this.loadingDetail.set(true);
    this.api.obtener(item.cedulaEstudiante).pipe(finalize(() => {
      if (requestId === this.detalleRequestId) this.loadingDetail.set(false);
    })).subscribe({
      next: (detail) => { if (requestId === this.detalleRequestId) this.detail.set(detail); },
      error: (error: unknown) => {
         if (requestId === this.detalleRequestId) this.feedback.error(this.mensajeError(error, 'No se pudo cargar el detalle de la monografía.'));
      },
    });
  }

  protected fecha(value: string): string { return fechaCostaRica(value); }

  protected filtrar(): void {
    this.loading.set(true);
    this.api.listar({ anioInicio: this.filtroAnio(), estado: this.filtroEstado() }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (monografias) => {
        this.errorListado.set(false);
        this.monographs.set(monografias);
        const actual = monografias.find((item) => item.cedulaEstudiante === this.selectedId());
        if (!actual) { this.selectedId.set(''); this.detail.set(null); if (monografias[0]) this.seleccionar(monografias[0]); }
      },
      error: (error: unknown) => { this.errorListado.set(true); this.monographs.set([]); this.feedback.error(this.mensajeError(error, 'No se pudieron consultar las monografías.')); },
    });
  }

  protected limpiarFiltros(): void { this.filtroAnio.set(null); this.filtroEstado.set(null); this.filtrar(); }

  protected nuevoSeguimiento(): void {
    this.seguimientoId.set(null);
    this.draftSeguimientoFecha = this.hoy;
    this.draftSeguimientoObservacion = '';
    this.errorSeguimiento.set('');
    this.seguimientoAbierto.set(true);
  }

  protected editarSeguimiento(seg: SeguimientoMonografiaApi): void {
    this.seguimientoId.set(seg.idSeguimiento);
    this.draftSeguimientoFecha = seg.fecha;
    this.draftSeguimientoObservacion = seg.observacion;
    this.errorSeguimiento.set('');
    this.seguimientoAbierto.set(true);
  }

  protected guardarSeguimiento(): void {
    const item = this.selected();
    const observacion = this.draftSeguimientoObservacion.trim();
    if (!item) return;
    if (!this.draftSeguimientoFecha) { this.errorSeguimiento.set('Indique la fecha del seguimiento.'); return; }
    if (observacion.length < 3 || observacion.length > 1000) { this.errorSeguimiento.set('La observación debe tener entre 3 y 1000 caracteres.'); return; }
    const id = this.seguimientoId();
    this.saving.set(true);
    const peticion = id === null
      ? this.api.registrarSeguimiento(item.cedulaEstudiante, this.draftSeguimientoFecha, observacion)
      : this.api.modificarSeguimiento(id, this.draftSeguimientoFecha, observacion);
    (peticion as import('rxjs').Observable<unknown>).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.seguimientoAbierto.set(false); this.feedback.exito(id === null ? 'Seguimiento registrado.' : 'Seguimiento actualizado.'); this.recargarDetalle(item.cedulaEstudiante); this.filtrarSilencioso(); },
      error: (error: unknown) => { this.errorSeguimiento.set(this.mensajeError(error, 'No se pudo guardar el seguimiento.')); if ((error as { status?: number })?.status === 404) { this.seguimientoAbierto.set(false); this.recargarDetalle(item.cedulaEstudiante); } },
    });
  }

  protected async eliminarSeguimiento(seg: SeguimientoMonografiaApi): Promise<void> {
    const item = this.selected();
    if (!item) return;
    if (!(await this.feedback.confirmar(`Se eliminará el seguimiento del ${this.fecha(seg.fecha)}.`, '¿Eliminar el seguimiento?', 'Eliminar'))) return;
    this.saving.set(true);
    this.api.eliminarSeguimiento(seg.idSeguimiento).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.feedback.exito('Seguimiento eliminado.'); this.recargarDetalle(item.cedulaEstudiante); this.filtrarSilencioso(); },
      error: (error: unknown) => { this.feedback.error(this.mensajeError(error, 'No se pudo eliminar el seguimiento.')); this.recargarDetalle(item.cedulaEstudiante); },
    });
  }

  protected async retirarBorrador(): Promise<void> {
    const item = this.selected();
    const period = this.periodoReporte();
    if (!item || !period || !this.draftReport()) return;
    if (!(await this.feedback.confirmar(`Se retirará el borrador del reporte de ${this.etiquetaSemestre(period.semestreActual)} ${period.anio}. El Profesor Guía volverá a ver que no hay informe registrado.`, '¿Retirar el borrador?', 'Retirar'))) return;
    this.saving.set(true);
    this.api.retirarReporte(item.cedulaEstudiante, period.anio, period.semestreActual).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.feedback.exito('Borrador retirado.'); this.recargarDetalle(item.cedulaEstudiante); },
      error: (error: unknown) => this.feedback.error(this.mensajeError(error, 'No se pudo retirar el borrador.')),
    });
  }

  // Actualiza la cantidad de seguimientos de la lista sin cambiar la selección.
  private filtrarSilencioso(): void {
    this.api.listar({ anioInicio: this.filtroAnio(), estado: this.filtroEstado() }).subscribe({ next: (monografias) => this.monographs.set(monografias), error: () => undefined });
  }

  protected etiquetaEstado(estado: EstadoMonografiaApi): string {
    return { CAPACITACION: 'Capacitación', INVESTIGACION: 'Investigación', TERMINADA: 'Terminada' }[estado];
  }

  protected etiquetaSemestre(semestre: string): string {
    return semestre === 'I_SEMESTRE' ? 'I semestre' : semestre === 'II_SEMESTRE' ? 'II semestre' : semestre;
  }

  protected abrirCambioEstado(): void {
    const item = this.selected();
    if (!item) return;
    this.draftEstado = item.estado;
     this.reportModal.set('status');
  }

   protected guardarEstado(): void {
     const item = this.selected();
     if (!item) return;
     if (item.estado === 'TERMINADA' && this.draftEstado !== 'TERMINADA') {
       this.feedback.error('Una monografía terminada no se puede reabrir.');
       return;
     }
     this.saving.set(true);
     this.api.cambiarEstado(item.cedulaEstudiante, this.draftEstado).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.monographs.update((items) => items.map((entry) => entry.cedulaEstudiante === item.cedulaEstudiante ? { ...entry, estado: this.draftEstado } : entry));
        this.detail.update((detail) => detail ? { ...detail, monografia: { ...detail.monografia, estado: this.draftEstado } } : detail);
        this.reportModal.set(null);
         this.feedback.exito('Estado actualizado.');
      },
       error: (error: unknown) => this.feedback.error(this.mensajeError(error, 'No se pudo actualizar el estado.')),
    });
  }

   protected abrirEdicionObservaciones(): void {
     if (this.reporteConfirmado()) {
        this.feedback.error('Este reporte ya fue confirmado al Profesor Guía. Su edición está bloqueada hasta que el Profesor Guía la reactive.');
       return;
     }
     if (!this.periodoReporte()) {
        this.feedback.error('Elija el año y el semestre del reporte.');
      return;
    }
    this.reportObservation = this.pendingObservation() || (this.currentReport()?.observaciones ?? '');
     this.reportModal.set('observations');
  }

   protected guardarObservaciones(): void {
     if (this.reporteConfirmado()) {
        this.feedback.error('Este reporte ya fue confirmado al Profesor Guía. Su edición está bloqueada hasta que el Profesor Guía la reactive.');
       return;
     }
     const observaciones = this.reportObservation.trim();
    if (observaciones.length < 3 || observaciones.length > 1000) {
       this.feedback.error('Las observaciones deben tener entre 3 y 1000 caracteres.');
      return;
    }
     const item = this.selected();
     const period = this.periodoReporte();
     if (!item || !period) return;
     this.saving.set(true);
     this.api.guardarBorradorReporte(item.cedulaEstudiante, period.anio, period.semestreActual, observaciones)
       .pipe(finalize(() => this.saving.set(false)))
       .subscribe({
         next: () => {
           this.pendingObservation.set('');
           this.reportObservation = '';
           this.reportModal.set(null);
             this.feedback.exito('Borrador guardado. El Profesor Guía lo ve como pendiente de confirmación hasta que usted lo confirme.');
           this.recargarDetalle(item.cedulaEstudiante);
         },
          error: (error: unknown) => this.feedback.error(this.mensajeError(error, 'No se pudieron guardar las observaciones.')),
       });
  }

   protected abrirEnvioInforme(): void {
     if (this.reporteConfirmado()) {
        this.feedback.error('Este reporte ya fue confirmado al Profesor Guía y no puede volver a enviarse. Si necesita corregirlo, solicite al Profesor Guía que reactive la edición.');
       return;
     }
     if (!this.informacionCompleta()) {
       this.feedback.error('Complete las observaciones de la monografía antes de confirmar el reporte.');
       return;
     }
      this.reportModal.set('confirm-send');
  }

  protected confirmarEnvio(): void {
    const observaciones = this.observationToSend();
    if (observaciones) this.enviarObservaciones(observaciones);
  }

  protected cerrarModal(): void {
     this.reportModal.set(null);
  }

   private enviarObservaciones(observaciones: string): void {
     if (this.reporteConfirmado() || !this.informacionCompleta()) return;
     const item = this.selected();
    const period = this.periodoReporte();
    if (!item || !period) return;
    this.saving.set(true);
           this.api.confirmarReporte(item.cedulaEstudiante, period.anio, period.semestreActual, observaciones)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.pendingObservation.set('');
          this.reportObservation = '';
          this.reportModal.set(null);
            this.feedback.exito('Reporte confirmado y enviado al Profesor Guía. La edición quedó bloqueada hasta que el Profesor Guía la reactive.');
           this.recargarDetalle(item.cedulaEstudiante, 'El envío se completó, pero no se pudo actualizar el detalle.');
        },
         error: (error: unknown) => this.feedback.error(this.mensajeError(error, 'No se pudieron enviar las observaciones.')),
      });
  }

  private recargarDetalle(cedula: string, errorFallback = 'No se pudo actualizar el detalle de la monografía.'): void {
    const requestId = ++this.detalleRequestId;
    this.loadingDetail.set(true);
    this.api.obtener(cedula).pipe(finalize(() => {
      if (requestId === this.detalleRequestId) this.loadingDetail.set(false);
    })).subscribe({
      next: (detail) => { if (requestId === this.detalleRequestId) this.detail.set(detail); },
      error: (error: unknown) => {
         if (requestId === this.detalleRequestId) this.feedback.error(this.mensajeError(error, errorFallback));
      },
    });
  }

  private normalizarSemestre(semestre: string): string {
    return semestre.trim().toUpperCase();
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const body = (error as { error?: { mensaje?: string } }).error;
      if (body?.mensaje) return body.mensaje;
    }
    return fallback;
  }
}
