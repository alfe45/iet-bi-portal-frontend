import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { PeriodoActualApi, CursosLectivosApiService } from '../nucleo/api/cursos-lectivos-api.service';
import { CoordinadorMonografiaApiService, DetalleMonografiaApi, EstadoMonografiaApi, MonografiaApi, ReporteMonografiaApi } from '../nucleo/api/coordinador-monografia-api.service';

@Component({
  selector: 'app-vista-monografias',
  imports: [FormsModule],
  template: `
    <section class="monographs-page" aria-labelledby="monographs-title">
      <header class="page-header"><div><h2 id="monographs-title">Mis estudiantes de monografía</h2></div></header>

      @if(loading()){<p role="status">Cargando monografías...</p>}
      @if(errorMessage()){<p class="error-message" role="alert">{{ errorMessage() }}</p>}
      @if(!loading() && monographs().length === 0 && !errorMessage()){<p class="empty">No hay monografías asignadas.</p>}

      @if(monographs().length > 0){<section class="student-selector" aria-label="Monografías asignadas">
        <strong>Monografías asignadas</strong>
        <div class="student-options">@for(item of monographs(); track item.cedulaEstudiante){<button type="button" [attr.title]="item.asignatura" [attr.aria-pressed]="item.cedulaEstudiante === selectedId()" [class.selected]="item.cedulaEstudiante === selectedId()" (click)="seleccionar(item)"><span>{{ item.nombreEstudiante }}</span><small>{{ item.asignatura }}</small></button>}</div>
      </section>}

      @if(selected(); as item){
        <div class="selected-toolbar"><div><h3>{{ item.nombreEstudiante }}</h3><p>{{ item.asignatura }} <span class="status-chip">{{ etiquetaEstado(item.estado) }}</span></p></div><div class="top-actions"><button type="button" class="send-button info-button" style="color:#fff;background:#2f80b7;border-color:#2f80b7" [disabled]="saving() || item.estado === 'TERMINADA'" (click)="abrirCambioEstado()">Editar información de la monografía</button><button type="button" class="send-button observations-button" style="color:#fff;background:#7650a8;border-color:#7650a8" [disabled]="saving() || !currentPeriod()?.semestreActual" (click)="abrirEdicionObservaciones()">Observaciones</button><button type="button" class="send-button" [disabled]="saving() || !currentReport()" (click)="abrirEnvioInforme()">{{ currentReport() ? 'Reenviar al Profesor Guía' : 'Enviar al Profesor Guía' }}</button></div></div>

        @if(!currentPeriod()?.semestreActual){<p class="empty">No hay un semestre activo para enviar observaciones.</p>}
        @if(operationMessage()){<p class="success-message" role="status">{{ operationMessage() }}</p>}
        @if(operationError()){<p class="error-message" role="alert">{{ operationError() }}</p>}
        @if(loadingDetail()){<p role="status">Cargando información de la monografía...</p>}

        @if(detail(); as detalle){<section class="content-block monograph-summary"><div class="block-heading"><h3>Datos de la monografía</h3></div>
          <dl class="info-grid"><div><dt>Asignatura</dt><dd>{{ detalle.monografia.asignatura }}</dd></div><div><dt>Estado</dt><dd>{{ etiquetaEstado(detalle.monografia.estado) }}</dd></div><div><dt>Año de inicio</dt><dd>{{ detalle.monografia.anioInicio }}</dd></div><div><dt>Año actual</dt><dd>{{ detalle.monografia.anioActual }}</dd></div><div><dt>Sección actual</dt><dd>{{ detalle.monografia.seccionActual }}</dd></div><div><dt>Profesor Coordinador</dt><dd>{{ detalle.monografia.nombreCoordinador }}</dd></div><div class="full"><dt>Última observación registrada</dt>@if(latestReport(); as reporte){<dd class="observation-entry"><p>{{ reporte.observaciones }}</p><small>{{ reporte.anio }} · {{ etiquetaSemestre(reporte.semestre) }} · {{ reporte.enviadoEn.slice(0, 10) }}</small></dd>} @else {<dd class="empty">Sin observaciones registradas.</dd>}</div></dl>
        </section>}
      }
          @if(reportModal(); as modal){<div class="modal-backdrop" role="presentation"><section class="monograph-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title"><div class="modal-heading"><div><p class="eyebrow">{{ modal === 'status' ? 'Información de la monografía' : modal === 'observations' ? 'Observaciones de la monografía' : 'Envío al Profesor Guía' }}</p><h3 id="report-modal-title">{{ modal === 'status' ? 'Editar información de la monografía' : modal === 'observations' ? 'Observaciones' : 'Confirmar envío' }}</h3></div><button type="button" class="close-button" (click)="cerrarModal()">×</button></div>
              @if(modal === 'status'){<form (ngSubmit)="guardarEstado()"><div class="form-grid"><label>Título<input name="modalTitulo" [(ngModel)]="draftTitulo" placeholder="No disponible desde el backend" /></label><label>Área<input name="modalArea" [(ngModel)]="draftArea" /></label><label>Estado<select name="estado" [(ngModel)]="draftEstado"><option value="CAPACITACION">Capacitación</option><option value="INVESTIGACION">Investigación</option><option value="TERMINADA">Terminada</option></select></label><label>Fecha de inicio<input name="modalFechaInicio" type="date" [(ngModel)]="draftFechaInicio" /></label><label class="full">Descripción<textarea name="modalDescripcion" rows="4" [(ngModel)]="draftDescripcion" placeholder="No disponible desde el backend"></textarea></label></div><div class="modal-actions"><button type="button" class="ghost-button" (click)="cerrarModal()">Cancelar</button><button type="submit" class="primary-button" [disabled]="saving()">Guardar información</button></div></form>}
              @else if(modal === 'observations'){<form (ngSubmit)="guardarObservaciones()"><div class="readonly-fields"><div><small>Estudiante</small><strong>{{ selected()?.nombreEstudiante }}</strong></div><div><small>Asignatura</small><strong>{{ selected()?.asignatura }}</strong></div><div><small>Profesor Coordinador</small><strong>{{ selected()?.nombreCoordinador }}</strong></div><div><small>Periodo</small><strong>{{ currentPeriod()?.anio }} · {{ etiquetaSemestre(currentPeriod()?.semestreActual ?? '') }}</strong></div></div><label>Observaciones<textarea name="reportObservation" rows="5" [(ngModel)]="reportObservation" minlength="3" maxlength="1000" required placeholder="Escriba las observaciones para el Profesor Guía"></textarea></label><p class="modal-note">Al guardar, las observaciones se enviarán al Profesor Guía.</p><div class="modal-actions"><button type="button" class="ghost-button" (click)="cerrarModal()">Cancelar</button><button type="submit" class="primary-button" [disabled]="saving()">Guardar y enviar</button></div></form>}
              @else if(modal === 'confirm-send'){<p>¿Desea reenviar las observaciones de <strong>{{ selected()?.nombreEstudiante }}</strong> al Profesor Guía?</p><div class="modal-actions"><button type="button" class="ghost-button" (click)="cerrarModal()">Cancelar</button><button type="button" class="send-button" [disabled]="saving()" (click)="confirmarEnvio()">Confirmar envío</button></div>}
         </section></div>}
    </section>
  `,
  styles: `
    .monographs-page{display:grid;gap:1rem;align-content:start}.page-header,.student-selector,.selected-toolbar,.content-block{padding:1rem 1.2rem;border:1px solid #dbe5ef;border-radius:9px;background:#fff}.page-header{border-left:5px solid #2f6b9a}.page-header h2,.page-header p:last-child,.selected-toolbar h3,.selected-toolbar p{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.student-options{display:flex;gap:.5rem;margin-top:.7rem;overflow-x:auto}.student-options button{display:grid;min-width:210px;padding:.65rem .8rem;border:1px solid #dbe5ef;border-radius:7px;background:#fff;color:#1e3a5f;text-align:left;cursor:pointer}.student-options button.selected{border-color:#2f6b9a;background:#eaf3f8;box-shadow:inset 0 0 0 1px #2f6b9a}.student-options small{margin-top:.15rem;color:#667085;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.selected-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.selected-toolbar p{margin-top:.25rem;color:#667085}.top-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.5rem}.content-block{display:grid;gap:1rem}.block-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.block-heading h3{margin:0;color:#1e3a5f;text-transform:uppercase;font-size:.92rem;letter-spacing:.04em}.block-heading p{margin:.25rem 0 0;color:#667085}.edit-button,.send-button{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:.5rem .8rem;border:1px solid transparent;border-radius:5px;font-weight:700;cursor:pointer}.edit-button{color:#8a4b00;background:#fff0d6;border-color:#f0bd6b}.send-button{color:#fff;background:#238d78;border-color:#238d78}.send-button:disabled{cursor:not-allowed;opacity:.5}.actions{display:flex;justify-content:flex-end;gap:.5rem}.info-grid,.report-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;margin:0}.info-grid>div,.report-grid>div{padding:.75rem;border:1px solid #e6edf3;border-radius:7px}.info-grid .full,.report-grid .full{grid-column:1/-1}.info-grid dt,.report-grid dt,.report-observation dt{font-size:.74rem;color:#667085}.info-grid dd,.report-grid dd{margin:.2rem 0 0;color:#1e3a5f;font-weight:600}.follow-ups{display:grid;gap:.6rem}.follow-ups article{display:grid;gap:.35rem;padding:.75rem;border-left:3px solid #b9d3e5;background:#f8fbfd}.follow-ups p,.follow-ups small{margin:0}.follow-ups small{color:#667085}.follow-up-top{display:flex;justify-content:space-between;gap:1rem}.inline-form{padding:.9rem;border:1px solid #b9d3e5;border-radius:7px;background:#f8fbfd}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}.form-grid label,.inline-form>label,.monograph-modal label{display:grid;gap:.35rem;font-weight:700}.form-grid .full{grid-column:1/-1}.text-button{justify-self:start;padding:0;border:0;background:none;color:#2f6b9a;font-weight:700;cursor:pointer}.report-observation{display:grid;gap:.25rem;padding:.8rem;border:1px solid #e6edf3;border-radius:7px}.report-observation p{margin:0;color:#1e3a5f}.report-observation small,.sent-status{color:#667085}.sent-status{margin:0;font-size:.82rem}.report-preview{display:grid;gap:.6rem;margin-top:.25rem;padding:1rem;background:#f8fbfd;border:1px solid #b9d3e5}.preview-label{margin:0;color:#667085;font-size:.74rem;font-weight:800;text-transform:uppercase}.report-preview h4{margin:0;text-align:center;letter-spacing:.08em}.report-preview table{width:100%;border-collapse:collapse}.report-preview th,.report-preview td{padding:.6rem;border:1px solid #222;text-align:left;vertical-align:top}.modal-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:1rem;background:rgba(20,36,54,.48)}.monograph-modal{width:min(560px,100%);max-height:90vh;overflow:auto;padding:1.2rem;border-radius:10px;background:#fff;box-shadow:0 18px 60px rgba(0,0,0,.25)}.modal-heading{display:flex;justify-content:space-between;gap:1rem;margin-bottom:1rem}.modal-heading h3{margin:0;color:#1e3a5f}.close-button{border:0;background:transparent;color:#667085;font-size:1.5rem;cursor:pointer}.readonly-fields{display:grid;gap:.6rem;margin-bottom:1rem}.readonly-fields div{display:grid;gap:.15rem;padding:.65rem;border:1px solid #e6edf3;border-radius:6px;background:#f8fbfd}.readonly-fields small{color:#667085}.modal-actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem}.empty{margin:0;color:#667085}@media(max-width:700px){.block-heading,.selected-toolbar{align-items:flex-start;flex-direction:column}.top-actions{justify-content:flex-start}.info-grid,.report-grid,.form-grid{grid-template-columns:1fr}.info-grid .full,.report-grid .full,.form-grid .full{grid-column:auto}}
  `,
})
// Gestiona la consulta de monografías.
export class MonografiasVista implements OnInit {
  private readonly api = inject(CoordinadorMonografiaApiService);
  private readonly periodosApi = inject(CursosLectivosApiService);
  private detalleRequestId = 0;
  protected readonly monographs = signal<MonografiaApi[]>([]);
  protected readonly selectedId = signal('');
  protected readonly selected = computed(() => this.monographs().find((item) => item.cedulaEstudiante === this.selectedId()) ?? null);
  protected readonly detail = signal<DetalleMonografiaApi | null>(null);
  protected readonly currentPeriod = signal<PeriodoActualApi | null>(null);
  protected readonly latestReport = computed(() => [...(this.detail()?.reportes ?? [])].sort((a, b) => b.enviadoEn.localeCompare(a.enviadoEn))[0] ?? null);
  protected readonly currentReport = computed(() => {
    const period = this.currentPeriod();
    if (!period?.semestreActual) return null;
    return this.detail()?.reportes.find((report) => report.anio === period.anio && this.normalizarSemestre(report.semestre) === this.normalizarSemestre(period.semestreActual!)) ?? null;
  });
  protected readonly loading = signal(false);
  protected readonly loadingDetail = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly operationError = signal('');
  protected readonly operationMessage = signal('');
  protected readonly reportModal = signal<'status' | 'observations' | 'confirm-send' | null>(null);
  protected draftTitulo = '';
  protected draftArea = '';
  protected draftEstado: EstadoMonografiaApi = 'INVESTIGACION';
  protected draftFechaInicio = '';
  protected draftDescripcion = '';
  protected reportObservation = '';

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      monografias: this.api.listar(),
      periodo: this.periodosApi.obtenerActual().pipe(catchError(() => of(null))),
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ monografias, periodo }) => {
        this.monographs.set(monografias);
        this.currentPeriod.set(periodo);
        if (monografias[0]) this.seleccionar(monografias[0]);
      },
      error: (error: unknown) => this.errorMessage.set(this.mensajeError(error, 'No se pudieron cargar las monografías.')),
    });
  }

  protected seleccionar(item: MonografiaApi): void {
    this.selectedId.set(item.cedulaEstudiante);
    this.errorMessage.set('');
    this.operationError.set('');
    this.operationMessage.set('');
    const requestId = ++this.detalleRequestId;
    this.detail.set(null);
    this.loadingDetail.set(true);
    this.api.obtener(item.cedulaEstudiante).pipe(finalize(() => {
      if (requestId === this.detalleRequestId) this.loadingDetail.set(false);
    })).subscribe({
      next: (detail) => { if (requestId === this.detalleRequestId) this.detail.set(detail); },
      error: (error: unknown) => {
        if (requestId === this.detalleRequestId) this.errorMessage.set(this.mensajeError(error, 'No se pudo cargar el detalle de la monografía.'));
      },
    });
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
    this.draftTitulo = '';
    this.draftArea = item.asignatura;
    this.draftEstado = item.estado;
    this.draftFechaInicio = '';
    this.draftDescripcion = '';
    this.operationError.set('');
    this.reportModal.set('status');
  }

  protected guardarEstado(): void {
    const item = this.selected();
    if (!item) return;
    this.saving.set(true);
    this.operationError.set('');
    this.api.cambiarEstado(item.cedulaEstudiante, this.draftEstado).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.monographs.update((items) => items.map((entry) => entry.cedulaEstudiante === item.cedulaEstudiante ? { ...entry, estado: this.draftEstado } : entry));
        this.detail.update((detail) => detail ? { ...detail, monografia: { ...detail.monografia, estado: this.draftEstado } } : detail);
        this.reportModal.set(null);
        this.operationMessage.set('Estado actualizado. Los otros campos no se guardaron.');
      },
      error: (error: unknown) => this.operationError.set(this.mensajeError(error, 'No se pudo actualizar el estado.')),
    });
  }

  protected abrirEdicionObservaciones(): void {
    if (!this.currentPeriod()?.semestreActual) {
      this.operationError.set('No hay un semestre activo para enviar observaciones.');
      return;
    }
    this.reportObservation = this.currentReport()?.observaciones ?? '';
    this.operationError.set('');
    this.reportModal.set('observations');
  }

  protected guardarObservaciones(): void {
    const observaciones = this.reportObservation.trim();
    if (observaciones.length < 3 || observaciones.length > 1000) {
      this.operationError.set('Las observaciones deben tener entre 3 y 1000 caracteres.');
      return;
    }
    this.enviarObservaciones(observaciones);
  }

  protected abrirEnvioInforme(): void {
    if (!this.currentReport()) return;
    this.operationError.set('');
    this.reportModal.set('confirm-send');
  }

  protected confirmarEnvio(): void {
    const report = this.currentReport();
    if (report) this.enviarObservaciones(report.observaciones);
  }

  protected cerrarModal(): void {
    this.operationError.set('');
    this.reportModal.set(null);
  }

  private enviarObservaciones(observaciones: string): void {
    const item = this.selected();
    const period = this.currentPeriod();
    if (!item || !period?.semestreActual) return;
    this.saving.set(true);
    this.operationError.set('');
    this.api.enviarReporte(item.cedulaEstudiante, period.anio, period.semestreActual, observaciones)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.reportModal.set(null);
          this.operationMessage.set('Observaciones enviadas al Profesor Guía.');
          const requestId = ++this.detalleRequestId;
          this.loadingDetail.set(true);
          this.api.obtener(item.cedulaEstudiante).pipe(finalize(() => {
            if (requestId === this.detalleRequestId) this.loadingDetail.set(false);
          })).subscribe({
            next: (detail) => { if (requestId === this.detalleRequestId) this.detail.set(detail); },
            error: (error: unknown) => {
              if (requestId === this.detalleRequestId) this.operationError.set(this.mensajeError(error, 'El envío se completó, pero no se pudo actualizar el detalle.'));
            },
          });
        },
        error: (error: unknown) => this.operationError.set(this.mensajeError(error, 'No se pudieron enviar las observaciones.')),
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
