import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { DocumentoReporteBandas, ReporteBandasEstudianteComponent } from '../compartidos/componentes/reporte-bandas-estudiante.component';
import { BandaAsignaturaGuiaApi, PeriodoGuiaApi, ProfesorGuiaApiService, ReporteBandasGuiaApi, SeccionGuiaApi } from '../nucleo/api/profesor-guia-api.service';

@Component({
  selector: 'app-vista-reportes-bandas',
  imports: [FormsModule, RouterLink, ReporteBandasEstudianteComponent],
  template: `
    <section class="bands-module">
      <header class="module-header no-print"><div><p class="eyebrow">Profesor Guía</p><h2>Reportes de Bandas</h2><p>Reporte general de notas de los estudiantes de su sección guía.</p></div><div class="module-actions"><a class="ghost-button" routerLink="/dashboard">← Volver</a><button class="primary-button" type="button" [disabled]="!reports().length" (click)="printAll()">Imprimir todos los reportes</button></div></header>

       @if (error()) { <p class="error no-print" role="alert">{{ error() }}</p> }
       <section class="context-panel no-print">
         <div><small>Periodo actual</small><strong>{{ periodoEtiqueta() }}</strong></div>
         <div><small>Sección guía</small><strong>{{ seccionActual()?.nombre || 'Sin sección' }} · Nivel {{ seccionActual()?.nivel ?? '-' }}</strong></div>
         <div><small>Profesor Guía</small><strong>{{ guideName() }}</strong></div>
         <div><small>Estado de notas</small>@if (loading()) {<strong>Cargando...</strong>} @else if (missingAssignments().length) {<ul class="missing-assignment-list">@for (assignment of missingAssignments(); track assignment) {<li>Faltan notas de {{ assignment }}</li>}</ul>} @else {<strong>Notas recibidas en paquete</strong>}</div>
       </section>

       @if (secciones().length > 1) {<section class="section-selector no-print"><label>Sección<select [value]="clave(seccionActual())" (change)="cambiarSeccion($any($event.target).value)">@for (section of secciones(); track clave(section)) {<option [value]="clave(section)">{{ section.nombre }}</option>}</select></label></section>}
      <section class="student-picker no-print">
        <label for="student-search">Buscar estudiante</label>
        <input id="student-search" type="search" [ngModel]="search()" (ngModelChange)="search.set($event); studentPage.set(0)" placeholder="Nombre o identificación" />
        <div class="student-list">@for (student of paginatedStudents(); track student.cedulaEstudiante) {<div class="student-row"><div><strong>{{ student.nombreEstudiante }}</strong><small>{{ student.cedulaEstudiante }}</small></div><button class="primary-button" type="button" (click)="printOne(student.cedulaEstudiante)">Imprimir</button></div>} @empty {<p class="empty-state">{{ loading() ? 'Cargando estudiantes...' : 'No se encontraron estudiantes en la sección guía.' }}</p>}</div>
        @if (totalPages() > 1) {<div class="pagination"><button type="button" class="ghost-button" [disabled]="studentPage() === 0" (click)="previousPage()">Anterior</button><span>Página {{ studentPage() + 1 }} de {{ totalPages() }}</span><button type="button" class="ghost-button" [disabled]="studentPage() + 1 >= totalPages()" (click)="nextPage()">Siguiente</button></div>}
      </section>

      <section class="reports-preview report-print-area" [class.reports-preview--all]="printingAll()">
        @if (printingAll()) { @for (report of allReports(); track report.identificacion) {<div class="report-page-break"><app-reporte-bandas-estudiante [report]="report" /></div>} }
        @else if (selectedReport(); as report) { <app-reporte-bandas-estudiante [report]="report" /> }
        @else { <p class="empty-state no-print">Seleccione un estudiante para ver su reporte institucional.</p> }
      </section>
    </section>
  `,
  styles: `
    :host{display:block;height:100%;overflow:hidden}.bands-module{height:100%;min-height:0;overflow:auto;padding-bottom:2rem}.module-header,.context-panel,.student-row{display:flex;align-items:center;justify-content:space-between;gap:1rem}.module-header{margin-bottom:1rem}.module-header h2,.module-header p{margin:0}.module-header p{color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.8rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.module-actions{display:flex;gap:.6rem}.context-panel,.section-selector,.student-picker{padding:1rem 1.2rem;margin-bottom:1rem;background:#fff;border:1px solid #dbe5ef}.context-panel{border-left:4px solid #4099ff;box-shadow:0 2px 8px rgba(27,46,94,.06)}.context-panel div{display:grid;gap:.2rem}.context-panel small,.student-row small{color:#8996a4;font-size:.78rem}.context-panel strong{font-size:.95rem}.missing-assignment-list{margin:.15rem 0 0;padding-left:1.1rem;color:#b86b00;font-size:.88rem;font-weight:700}.section-selector label{display:grid;gap:.35rem;max-width:360px;font-weight:700}.student-picker>label{display:block;margin-bottom:.4rem;color:#29344a;font-weight:700}.student-picker>input{max-width:430px;margin-bottom:.8rem}.student-list{display:grid;gap:.45rem}.student-row{padding:.7rem .85rem;border:1px solid #e1e7ee;border-radius:7px}.student-row>div{display:grid;flex:1;gap:.15rem}.student-row strong{font-size:.95rem}.student-row button{min-height:36px}.pagination{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:.8rem;padding-top:.7rem;border-top:1px solid #e6edf3;color:#667085;font-size:.8rem}.pagination .ghost-button{min-height:32px;padding:.3rem .6rem;font-size:.76rem}.empty-state,.error{padding:1.5rem;margin:0;color:#8996a4;text-align:center}.error{margin-bottom:1rem;border:1px solid #f5c2c0;color:#b42318;background:#fff4f3}.report-print-area{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.reports-preview{padding:1rem;background:#e9edf2}.reports-preview app-reporte-bandas-estudiante{display:block;padding:8mm;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.12)}.reports-preview--all{display:grid;gap:1rem}@media(max-width:800px){.module-header,.context-panel,.student-row{align-items:stretch;flex-direction:column}.module-actions{width:100%}.module-actions>*{flex:1}.student-row button{width:100%}}@media print{@page{size:A4 portrait;margin:10mm}:host{height:auto;overflow:visible}.bands-module{height:auto;overflow:visible;padding:0}.no-print{display:none!important}.report-print-area{position:static;width:auto;height:auto;overflow:visible;clip:auto}.reports-preview{padding:0;background:#fff}.reports-preview app-reporte-bandas-estudiante{padding:0;box-shadow:none}.reports-preview--all{display:block}.reports-preview--all .report-page-break{display:block;break-after:auto!important;page-break-after:auto!important}}
  `,
})
// Genera reportes de bandas con los datos consolidados por el backend para el Profesor Guía.
export class ReportesBandasVistaComponent {
  private readonly api = inject(ProfesorGuiaApiService);
  private readonly auth = inject(AutenticacionService);
  private readonly periodo = signal<PeriodoGuiaApi | null>(null);
  protected readonly secciones = signal<SeccionGuiaApi[]>([]);
  private readonly seleccion = signal('');
  private readonly reportsState = signal<ReporteBandasGuiaApi[]>([]);
  protected readonly search = signal('');
  protected readonly selectedId = signal('');
  protected readonly printingAll = signal(false);
  protected readonly studentPage = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
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
  protected readonly missingAssignments = computed(() => [...new Set(this.reportsState().flatMap((report) => report.asignaturas.filter((item) => item.nota === null).map((item) => item.asignatura)))]);

  constructor() {
    this.api.obtenerPeriodoActual().pipe(
      switchMap((periodo) => { this.periodo.set(periodo); return this.api.listarSecciones(periodo.anio); }),
    ).subscribe({
      next: (secciones) => {
        this.secciones.set(secciones);
        if (secciones[0]) this.cargar(secciones[0]);
        else this.loading.set(false);
      },
      error: () => { this.error.set('No se pudo cargar la sección guía del profesor.'); this.loading.set(false); },
    });
  }

  protected cambiarSeccion(key: string): void {
    const seccion = this.secciones().find((item) => this.clave(item) === key);
    if (seccion) this.cargar(seccion);
  }
  protected clave(section: SeccionGuiaApi | undefined): string { return section ? `${section.anio}-${section.nivel}-${section.numero}` : ''; }
  protected previousPage(): void { this.studentPage.update((page) => Math.max(0, page - 1)); }
  protected nextPage(): void { this.studentPage.update((page) => Math.min(this.totalPages() - 1, page + 1)); }
  protected printOne(id: string): void { this.printingAll.set(false); this.selectedId.set(id); this.startPrint(); }
  protected printAll(): void { this.printingAll.set(true); this.startPrint(); }

  private cargar(seccion: SeccionGuiaApi): void {
    const semestre = this.periodo()?.semestreActual;
    this.seleccion.set(this.clave(seccion));
    this.reportsState.set([]);
    this.selectedId.set('');
    this.search.set('');
    this.studentPage.set(0);
    if (!semestre) { this.error.set('No hay un semestre académico activo.'); this.loading.set(false); return; }
    this.loading.set(true);
    this.error.set('');
    this.api.listarReportesBandas({ anio: seccion.anio, nivel: seccion.nivel, numero: seccion.numero, semestre }).subscribe({
      next: (reports) => { this.reportsState.set(reports); this.selectedId.set(reports[0]?.cedulaEstudiante ?? ''); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los reportes de bandas.'); this.loading.set(false); },
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
      reporteMonografia: { area: report.monografia?.area ?? '', coordinador: report.monografia?.nombreCoordinador ?? '', observaciones: report.monografia?.observaciones ?? 'Sin informe registrado' },
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
