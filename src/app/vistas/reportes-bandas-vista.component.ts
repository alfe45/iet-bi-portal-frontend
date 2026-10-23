import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { DocumentoReporteBandas, ReporteBandasEstudianteComponent } from '../compartidos/componentes/reporte-bandas-estudiante.component';
import { BandaAsignaturaGuiaApi, PeriodoGuiaApi, ProfesorGuiaApiService, ReporteBandasGuiaApi, SeccionGuiaApi } from '../nucleo/api/profesor-guia-api.service';
import { FeedbackService } from '../compartidos/servicios/feedback.service';

interface ProblemaReporteBandas {
  titulo: string;
  descripcion: string;
  estudiantes: Array<{ nombre: string; detalle: string }>;
}

@Component({
  selector: 'app-vista-reportes-bandas',
  imports: [FormsModule, RouterLink, ReporteBandasEstudianteComponent],
  template: `
    <section class="bands-module">
       <header class="module-header no-print"><div><p class="eyebrow">Profesor Guía</p><h2>Reportes de Bandas</h2><p>Reporte general de notas de los estudiantes de su sección guía.</p></div><div class="module-actions"><a class="ghost-button" routerLink="/dashboard">← Volver</a><button class="ghost-button reactivate-button" type="button" [disabled]="reactivating() || !puedeReactivarBandasSeccion()" (click)="reactivarBandasSeccion()">Reactivar edición de la sección</button><button class="primary-button" type="button" [disabled]="!reports().length" (click)="printAll()">Imprimir todos los reportes</button></div></header>

       <section class="context-panel no-print">
         <div><small>Periodo actual</small><strong>{{ periodoEtiqueta() }}</strong></div>
         <div><small>Sección guía</small><strong>{{ seccionActual()?.nombre || 'Sin sección' }} · Nivel {{ seccionActual()?.nivel ?? '-' }}</strong></div>
         <div><small>Profesor Guía</small><strong>{{ guideName() }}</strong></div>
          <div><small>Estado de información</small>@if (loading()) {<strong>Cargando...</strong>} @else if (!reports().length) {<strong class="context-status status-pending">Sin información</strong>} @else if (incompleteStudents().length) {<strong class="context-status status-pending">Información incompleta</strong><small>Faltan notas en {{ incompleteStudents().length }} estudiante(s).</small><button type="button" class="status-link" (click)="abrirIncompletos()">Ver estudiantes</button>} @else if (pendingConfirmationStudents().length) {<strong class="context-status status-warning">Completa, pendiente de confirmación</strong><small>{{ pendingConfirmationStudents().length }} estudiante(s) tienen notas completas, pero falta confirmar alguna.</small><button type="button" class="status-link" (click)="abrirIncompletos()">Ver estudiantes</button>} @else {<strong class="context-status status-ready">Confirmada y completa</strong><small>Todos los estudiantes tienen sus notas confirmadas.</small>@if (problemasSeccion().length) {<button type="button" class="status-link" (click)="abrirIncompletos()">Ver estudiantes</button>}}</div>
       </section>

       @if (secciones().length > 1) {<section class="section-selector no-print"><label>Sección<select [value]="clave(seccionActual())" (change)="cambiarSeccion($any($event.target).value)">@for (section of secciones(); track clave(section)) {<option [value]="clave(section)">{{ section.nombre }}</option>}</select></label></section>}
       <section class="student-picker no-print">
        <label for="student-search">Buscar estudiante</label>
         <input id="student-search" type="search" [ngModel]="search()" (ngModelChange)="search.set($event); studentPage.set(0)" placeholder="Nombre o identificación" />
             <div class="student-list">@for (student of paginatedStudents(); track student.cedulaEstudiante) {<div class="student-row"><div><strong>{{ student.nombreEstudiante }}</strong><small>{{ student.cedulaEstudiante }}</small></div><span class="report-status" [class.report-status--complete]="estadoReporte(student) === 'completo'" [class.report-status--confirmed]="estadoReporte(student) === 'confirmado'">{{ etiquetaEstadoReporte(student) }}</span><button class="primary-button" type="button" (click)="printOne(student.cedulaEstudiante)">Imprimir</button></div>} @empty {<p class="empty-state">{{ loading() ? 'Cargando estudiantes...' : 'No se encontraron estudiantes en la sección guía.' }}</p>}</div>
         @if (totalPages() > 1) {<div class="pagination"><button type="button" class="ghost-button" [disabled]="studentPage() === 0" (click)="previousPage()">Anterior</button><span>Página {{ studentPage() + 1 }} de {{ totalPages() }}</span><button type="button" class="ghost-button" [disabled]="studentPage() + 1 >= totalPages()" (click)="nextPage()">Siguiente</button></div>}
       </section>

        @if (incompleteModalOpen()) {<div class="modal-backdrop no-print" role="presentation" (click)="cerrarIncompletos()"><section class="incomplete-modal" role="dialog" aria-modal="true" aria-labelledby="incomplete-title" (click)="$event.stopPropagation()"><div class="modal-heading"><h3 id="incomplete-title">Pendientes de la sección</h3><button type="button" class="close-button" aria-label="Cerrar lista" (click)="cerrarIncompletos()">×</button></div><div class="issue-groups">@for (group of problemasSeccion(); track group.titulo) {<section class="issue-group"><h4>{{ group.titulo }}</h4><p>{{ group.descripcion }}</p><ul class="incomplete-list">@for (student of group.estudiantes; track student.nombre + student.detalle) {<li><strong>{{ student.nombre }}</strong>@if (student.detalle) {<small>{{ student.detalle }}</small>}</li>}</ul></section>}</div></section></div>}

       <section class="reports-preview report-print-area" [class.reports-preview--all]="printingAll()">
        @if (printingAll()) { @for (report of allReports(); track report.identificacion) {<div class="report-page-break"><app-reporte-bandas-estudiante [report]="report" /></div>} }
        @else if (selectedReport(); as report) { <app-reporte-bandas-estudiante [report]="report" /> }
        @else { <p class="empty-state no-print">Seleccione un estudiante para ver su reporte institucional.</p> }
      </section>
    </section>
  `,
  styles: `
      .context-status,.report-status{display:inline-block;width:max-content;padding:.18rem .45rem;border:1px solid transparent;border-radius:999px;font-size:.78rem!important;font-weight:800}.status-ready,.report-status--confirmed{color:#067647!important;background:#ecfdf3;border-color:#abefc6}.status-pending{color:#b42318!important;background:#fff1f0;border-color:#fecdca}.status-warning,.report-status--complete{color:#9a6700!important;background:#fff8db;border-color:#f3d36a}.status-link{width:max-content;padding:0;border:0;background:none;color:#1769aa;font:inherit;font-size:.78rem;font-weight:800;text-decoration:underline;cursor:pointer}.modal-backdrop{position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(13,25,39,.52)}.incomplete-modal{width:min(100%,680px);max-height:calc(100vh - 2rem);margin:auto;overflow:auto;border-radius:10px;background:#fff;box-shadow:0 20px 60px rgba(4,26,55,.3)}.incomplete-modal .modal-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.2rem;border-bottom:1px solid #e6edf3}.incomplete-modal h3{margin:0;color:#1e3a5f}.incomplete-modal .close-button{display:grid;flex:0 0 auto;place-items:center;width:32px;height:32px;padding:0;border:1px solid #fecdca;border-radius:50%;color:#b42318;background:#fff1f0;font-weight:800;line-height:1}.issue-groups{display:grid;gap:.8rem;padding:1rem 1.2rem 1.2rem}.issue-group{border:1px solid #e1e7ee;border-radius:8px;background:#fbfcfe}.issue-group h4{margin:0;padding:.75rem .9rem .2rem;color:#1e3a5f;font-size:.95rem}.issue-group>p{margin:.1rem .9rem .55rem;color:#667085;font-size:.82rem;line-height:1.4}.issue-group .incomplete-list{padding:.25rem .9rem .85rem 2rem}.incomplete-list{display:grid;gap:.45rem;margin:0;color:#344054}.incomplete-list li{line-height:1.35}.incomplete-list small{display:block;margin-top:.1rem;color:#667085;font-size:.78rem}.student-row .report-status{margin-left:auto}
     :host{display:block;height:100%;overflow:hidden}.bands-module{height:100%;min-height:0;overflow:auto;padding-bottom:2rem}.module-header,.context-panel,.student-row{display:flex;align-items:center;justify-content:space-between;gap:1rem}.module-header{margin-bottom:1rem}.module-header h2,.module-header p{margin:0}.module-header p{color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.8rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.module-actions{display:flex;gap:.6rem}.reactivate-button{color:#1769aa;background:#eef6ff;border-color:#9ac7f5}.reactivate-button:hover{color:#0f568e;background:#dceeff;border-color:#6daee8}.reactivate-button:disabled{cursor:not-allowed;opacity:.55;transform:none;box-shadow:none}.context-panel,.section-selector,.student-picker{padding:1rem 1.2rem;margin-bottom:1rem;background:#fff;border:1px solid #dbe5ef}.context-panel{border-left:4px solid #4099ff;box-shadow:0 2px 8px rgba(27,46,94,.06)}.context-panel div{display:grid;gap:.2rem}.context-panel small,.student-row small{color:#667085;font-size:.78rem}.context-panel strong{font-size:.95rem}.missing-assignment-list{margin:.15rem 0 0;padding-left:1.1rem;color:#b86b00;font-size:.88rem;font-weight:700}.section-selector label{display:grid;gap:.35rem;max-width:360px;font-weight:700}.student-picker>label{display:block;margin-bottom:.4rem;color:#29344a;font-weight:700}.student-picker>input{max-width:430px;margin-bottom:.8rem}.student-list{display:grid;gap:.45rem}.student-row{padding:.7rem .85rem;border:1px solid #e1e7ee;border-radius:7px}.student-row>div{display:grid;flex:1;gap:.15rem}.student-row strong{font-size:.95rem}.student-row button{min-height:36px}.pagination{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:.8rem;padding-top:.7rem;border-top:1px solid #e6edf3;color:#667085;font-size:.8rem}.pagination .ghost-button{min-height:32px;padding:.3rem .6rem;font-size:.76rem}.empty-state,.error{padding:1.5rem;margin:0;color:#667085;text-align:center}.error{margin-bottom:1rem;border:1px solid #f5c2c0;color:#b42318;background:#fff4f3}.report-print-area{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.reports-preview{padding:1rem;background:#e9edf2}.reports-preview app-reporte-bandas-estudiante{display:block;padding:8mm;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.12)}.reports-preview--all{display:grid;gap:1rem}@media(max-width:800px){.module-header,.context-panel,.student-row{align-items:stretch;flex-direction:column}.module-actions{width:100%}.module-actions>*{flex:1}.student-row button{width:100%}}@media print{@page{size:A4 portrait;margin:10mm}:host{height:auto;overflow:visible}.bands-module{height:auto;overflow:visible;padding:0}.no-print{display:none!important}.report-print-area{position:static;width:auto;height:auto;overflow:visible;clip:auto}.reports-preview{padding:0;background:#fff}.reports-preview app-reporte-bandas-estudiante{padding:0;box-shadow:none}.reports-preview--all{display:block}.reports-preview--all .report-page-break{display:block;break-after:auto!important;page-break-after:auto!important}}
  `,
})
// Genera reportes de bandas con los datos consolidados por el backend para el Profesor Guía.
export class ReportesBandasVistaComponent {
  private readonly api = inject(ProfesorGuiaApiService);
  private readonly auth = inject(AutenticacionService);
  private readonly feedback = inject(FeedbackService);
  private readonly periodo = signal<PeriodoGuiaApi | null>(null);
  protected readonly secciones = signal<SeccionGuiaApi[]>([]);
  private readonly seleccion = signal('');
  private readonly reportsState = signal<ReporteBandasGuiaApi[]>([]);
  protected readonly search = signal('');
  protected readonly selectedId = signal('');
  protected readonly printingAll = signal(false);
  protected readonly studentPage = signal(0);
   protected readonly loading = signal(true);
   protected readonly reactivating = signal(false);
  protected readonly pageSize = 3;
  private printingInProgress = false;

  protected readonly reports = computed(() => this.reportsState());
  protected readonly guideName = computed(() => this.auth.currentDisplayName() || 'Profesor Guía');
  protected readonly seccionActual = computed(() => this.secciones().find((section) => this.clave(section) === this.seleccion()) ?? this.secciones()[0]);
  protected readonly periodoEtiqueta = computed(() => this.etiquetaPeriodo(this.periodo()));
  protected readonly filteredStudents = computed(() => { const term = this.search().trim().toLowerCase(); return this.reportsState().filter((item) => !term || item.nombreEstudiante.toLowerCase().includes(term) || item.cedulaEstudiante.toLowerCase().includes(term)); });
  protected readonly paginatedStudents = computed(() => { const start = this.studentPage() * this.pageSize; return this.filteredStudents().slice(start, start + this.pageSize); });
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredStudents().length / this.pageSize)));
  protected readonly allReports = computed(() => this.reportsState().map((item) => this.buildReport(item)));
  protected readonly selectedReport = computed(() => { const id = this.selectedId() || this.reportsState()[0]?.cedulaEstudiante; const report = this.reportsState().find((item) => item.cedulaEstudiante === id); return report ? this.buildReport(report) : undefined; });
   protected readonly incompleteStudents = computed(() => this.reportsState().filter((report) => !this.estudianteCompleto(report)));
   protected readonly pendingConfirmationStudents = computed(() => this.reportsState().filter((report) => this.estudianteCompleto(report) && !this.reporteConfirmado(report)));
   protected readonly problemasSeccion = computed<ProblemaReporteBandas[]>(() => {
     const reports = this.reportsState();
     const grupos: ProblemaReporteBandas[] = [];
      const notasPendientes = reports
        .map((report) => ({ report, asignaturas: report.asignaturas.filter((item) => item.nota === null) }))
        .filter(({ report, asignaturas }) => report.asignaturas.length === 0 || asignaturas.length > 0)
        .map(({ report, asignaturas }) => ({ nombre: report.nombreEstudiante, detalle: report.asignaturas.length === 0 ? 'No tiene asignaturas para registrar notas.' : `Sin nota: ${asignaturas.map((item) => item.asignatura).join(', ')}` }));
      const notasSinConfirmar = reports
       .map((report) => ({ report, asignaturas: report.asignaturas.filter((item) => item.nota !== null && !item.confirmada) }))
        .filter(({ asignaturas }) => asignaturas.length > 0)
        .map(({ report, asignaturas }) => ({ nombre: report.nombreEstudiante, detalle: `Pendientes: ${asignaturas.map((item) => item.asignatura).join(', ')}` }));
      const monografiasCompletas = reports
        .filter((report) => Boolean(report.monografia?.observaciones?.trim()))
        .map((report) => ({ nombre: report.nombreEstudiante, detalle: report.monografia?.enviadoEn ? 'Reporte completo y confirmado.' : 'Reporte completo, pendiente de confirmación.' }));

      if (notasPendientes.length) grupos.push({ titulo: 'Notas sin registrar', descripcion: 'Tienen notas pendientes de registro o no tienen asignaturas disponibles para registrarlas.', estudiantes: notasPendientes });
      if (notasSinConfirmar.length) grupos.push({ titulo: 'Notas pendientes de confirmación', descripcion: 'Tienen notas registradas que aún no han sido confirmadas por el profesor responsable.', estudiantes: notasSinConfirmar });
      if (monografiasCompletas.length) grupos.push({ titulo: 'Reportes de monografía completos', descripcion: 'Tienen las observaciones del reporte registradas para este semestre.', estudiantes: monografiasCompletas });
     return grupos;
   });
   protected readonly incompleteModalOpen = signal(false);

  constructor() {
    this.api.obtenerPeriodoActual().pipe(
      switchMap((periodo) => { this.periodo.set(periodo); return this.api.listarSecciones(periodo.anio); }),
    ).subscribe({
      next: (secciones) => {
        this.secciones.set(secciones);
        if (secciones[0]) this.cargar(secciones[0]);
        else this.loading.set(false);
      },
      error: () => { this.feedback.error('No se pudo cargar la sección guía del profesor.'); this.loading.set(false); },
    });
  }

  protected cambiarSeccion(key: string): void {
    const seccion = this.secciones().find((item) => this.clave(item) === key);
    if (seccion) this.cargar(seccion);
  }
  protected clave(section: SeccionGuiaApi | undefined): string { return section ? `${section.anio}-${section.nivel}-${section.numero}` : ''; }
  protected previousPage(): void { this.studentPage.update((page) => Math.max(0, page - 1)); }
  protected nextPage(): void { this.studentPage.update((page) => Math.min(this.totalPages() - 1, page + 1)); }
   protected async printOne(id: string): Promise<void> {
     const student = this.reportsState().find((item) => item.cedulaEstudiante === id);
     if (!student) return;
     const confirmado = await this.feedback.confirmar(
       `Se generará el reporte de bandas de ${student.nombreEstudiante}. Verifique que la información mostrada sea la correcta antes de imprimir.`,
       'Confirmar impresión',
       'Imprimir reporte',
     );
     if (!confirmado) return;
     this.printingAll.set(false);
     this.selectedId.set(id);
     this.startPrint();
   }
   protected async printAll(): Promise<void> {
     const confirmado = await this.feedback.confirmar(
       'Se generarán los reportes de bandas de toda la sección. Verifique que la información esté completa antes de imprimir.',
       'Confirmar impresión',
       'Imprimir todos',
     );
     if (!confirmado) return;
     this.printingAll.set(true);
     this.startPrint();
   }
   protected puedeReactivarBandasSeccion(): boolean { return this.reportsState().some((report) => report.asignaturas.some((item) => item.confirmada)); }
   protected async reactivarBandasSeccion(): Promise<void> {
     const section = this.seccionActual();
     const period = this.periodo();
     if (!section || !period?.semestreActual || !this.puedeReactivarBandasSeccion()) return;
     const confirmado = await this.feedback.confirmar(
       `Se reactivará la edición de las notas de toda la sección ${section.nombre}. Los profesores responsables de cada asignatura podrán corregir sus notas y deberán confirmarlas nuevamente. El Profesor Guía no tendrá que volver a confirmar esas notas.`,
       'Reactivar edición de las notas',
       'Reactivar edición',
     );
     if (!confirmado) return;
     this.reactivating.set(true);
     this.api.reactivarBandasSeccion({ anio: section.anio, nivel: section.nivel, numero: section.numero, semestre: period.semestreActual })
       .pipe(finalize(() => this.reactivating.set(false)))
       .subscribe({
         next: () => { this.feedback.exito('Edición reactivada. Los profesores responsables ya pueden corregir y confirmar nuevamente las notas de la sección.'); this.cargar(section); },
         error: (e: { error?: { mensaje?: string } }) => this.feedback.error(e.error?.mensaje ?? 'No se pudo reactivar la edición de las notas de la sección.'),
       });
   }
  protected abrirIncompletos(): void { this.incompleteModalOpen.set(true); }
  protected cerrarIncompletos(): void { this.incompleteModalOpen.set(false); }
  protected estudianteCompleto(report: ReporteBandasGuiaApi): boolean {
     return report.asignaturas.length > 0 && report.asignaturas.every((item) => item.nota !== null);
  }

  protected reporteConfirmado(report: ReporteBandasGuiaApi): boolean {
     return report.asignaturas.length > 0 && report.asignaturas.every((item) => item.nota !== null && item.confirmada);
  }

  protected estadoReporte(report: ReporteBandasGuiaApi): 'incompleto' | 'completo' | 'confirmado' {
    if (!this.estudianteCompleto(report)) return 'incompleto';
    return this.reporteConfirmado(report) ? 'confirmado' : 'completo';
  }

  protected etiquetaEstadoReporte(report: ReporteBandasGuiaApi): string {
    return { incompleto: 'Incompleto', completo: 'Completo · pendiente de confirmación', confirmado: 'Confirmado y completo' }[this.estadoReporte(report)];
  }

  private cargar(seccion: SeccionGuiaApi): void {
    const semestre = this.periodo()?.semestreActual;
    this.seleccion.set(this.clave(seccion));
    this.reportsState.set([]);
    this.selectedId.set('');
    this.incompleteModalOpen.set(false);
    this.search.set('');
    this.studentPage.set(0);
     if (!semestre) { this.feedback.error('No hay un semestre académico activo.'); this.loading.set(false); return; }
     this.loading.set(true);
    this.api.listarReportesBandas({ anio: seccion.anio, nivel: seccion.nivel, numero: seccion.numero, semestre }).subscribe({
      next: (reports) => { this.reportsState.set(reports); this.selectedId.set(reports[0]?.cedulaEstudiante ?? ''); this.loading.set(false); },
       error: () => { this.feedback.error('No se pudieron cargar los reportes de bandas.'); this.loading.set(false); },
    });
  }

  private buildReport(report: ReporteBandasGuiaApi): DocumentoReporteBandas {
    const theory = report.asignaturas.find((item) => item.codigoAsignatura === 'TOK' || item.asignatura === 'Teoría del Conocimiento');
    const bands = report.asignaturas.filter((item) => ['SUPERIOR', 'MEDIO'].includes(item.tipoAsignatura));
    const numeric = report.asignaturas.filter((item) => item.tipoAsignatura === 'MEP');
    return {
      estudiante: report.nombreEstudiante,
      identificacion: report.cedulaEstudiante,
      seccion: report.seccion,
      nivel: `Nivel ${report.nivel}`,
      periodo: this.semesterLabel(report.semestre),
      anio: String(report.anio),
      filas: bands.map((item) => ({ asignatura: item.asignatura, bandaMinima: item.notaMinima ?? '—', bandaAlcanzada: item.nota ?? '—', ...this.attendance(item), observaciones: this.observations(item) })),
      teoriaConocimiento: theory ? { bandaAlcanzada: theory.nota ?? '—', ...this.attendance(theory), observaciones: this.observations(theory) } : { bandaAlcanzada: '—', tardias: '0', injustificadas: '0', justificadas: '0', observaciones: 'Sin registrar' },
      reporteMonografia: { area: report.monografia?.area ?? '', coordinador: report.monografia?.nombreCoordinador ?? '', observaciones: report.monografia?.enviadoEn ? report.monografia.observaciones ?? 'Sin informe registrado' : 'Sin informe registrado' },
      filasNumericas: numeric.map((item) => ({ asignatura: item.asignatura, notaMinima: item.notaMinima ?? '70', notaAlcanzada: item.nota ?? '—', ...this.attendance(item), observaciones: this.observations(item) })),
    };
  }

  private attendance(item: BandaAsignaturaGuiaApi): { tardias: string; injustificadas: string; justificadas: string } {
    return { tardias: String(item.tardias), injustificadas: String(item.injustificadas), justificadas: String(item.justificadas) };
  }

  private observations(item: BandaAsignaturaGuiaApi): string {
    return item.nota === null ? 'Sin registrar' : item.observaciones?.trim() || 'Sin observación';
  }

  private semesterLabel(value: string): string {
    return value === 'I_SEMESTRE' ? 'Primer semestre' : value === 'II_SEMESTRE' ? 'Segundo semestre' : value;
  }

  private etiquetaPeriodo(periodo: PeriodoGuiaApi | null): string {
    if (!periodo) return 'Periodo actual';
    const semestre = periodo.semestreActual === 'I_SEMESTRE' ? 'Primer semestre' : periodo.semestreActual === 'II_SEMESTRE' ? 'Segundo semestre' : 'Receso académico';
    return `${semestre} ${periodo.anio}`;
  }

  private startPrint(): void {
    if (this.printingInProgress) return;
    this.printingInProgress = true;
    const printWindow = window.open('', '_blank', `width=${screen.availWidth},height=${screen.availHeight},left=0,top=0`);
    if (!printWindow) { this.printingInProgress = false; window.print(); return; }
    const restorePage = () => { document.body.style.visibility = ''; this.printingInProgress = false; };
    document.body.style.visibility = 'hidden';
    setTimeout(() => {
      const reports = Array.from(document.querySelectorAll('.reports-preview app-reporte-bandas-estudiante')).map((element) => `<div class="report-copy">${element.innerHTML}</div>`).join('');
      const styles = Array.from(document.head.querySelectorAll('style')).map((style) => style.textContent ?? '').join('\n');
      printWindow.document.open();
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Reportes de bandas</title><style>${styles}</style><style>@page{size:210mm 297mm;margin:0}html,body{margin:0;background:#fff}.report-copy{display:block;min-height:297mm;padding:10mm;box-sizing:border-box;break-after:page;page-break-after:always;overflow:visible}.report-copy:last-child{break-after:auto;page-break-after:auto}app-reporte-bandas-estudiante{display:block}.report-copy .report-page{break-after:auto!important;page-break-after:auto!important}</style></head><body>${reports}</body></html>`);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.addEventListener('afterprint', () => { restorePage(); printWindow.close(); }, { once: true });
        printWindow.addEventListener('beforeunload', restorePage, { once: true });
        printWindow.focus();
        printWindow.print();
      }, 300);
    }, 100);
  }
}
