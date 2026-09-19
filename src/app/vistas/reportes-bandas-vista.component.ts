import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { DocumentoReporteBandas, ReporteBandasEstudianteComponent } from '../compartidos/componentes/reporte-bandas-estudiante.component';
import { PortalDatosService, RegistroPortal } from '../nucleo/datos/portal-datos.service';

@Component({
  selector: 'app-vista-reportes-bandas',
  imports: [FormsModule, RouterLink, ReporteBandasEstudianteComponent],
  template: `
    <section class="bands-module">
      <header class="module-header no-print">
        <div><p class="eyebrow">Profesor Guía</p><h2>Reportes de Bandas</h2><p>Reporte general de notas de los estudiantes de su sección guía.</p></div>
        <div class="module-actions"><a class="ghost-button" routerLink="/dashboard">← Volver</a><button class="primary-button" type="button" (click)="printAll()">Imprimir todos los reportes</button></div>
      </header>

      <section class="context-panel no-print">
        <div><small>Periodo actual</small><strong>{{ periodLabel() }}</strong></div>
        <div><small>Sección guía</small><strong>{{ field(section(), 'nombre') }} · {{ field(section(), 'nivel') }}</strong></div>
         <div><small>Profesor Guía</small><strong>{{ guideName() }}</strong></div>
         <div><small>Estado de notas</small>@if (missingAssignments().length) {<ul class="missing-assignment-list">@for (assignment of missingAssignments(); track assignment) {<li>Faltan notas de {{ assignment }}</li>}</ul>} @else {<strong>Notas recibidas en paquete</strong>}</div>
       </section>

      <section class="student-picker no-print">
        <label for="student-search">Buscar estudiante</label>
         <input id="student-search" type="search" [ngModel]="search()" (ngModelChange)="search.set($event); studentPage.set(0)" placeholder="Nombre o identificación" />
         <div class="student-list">
           @for (student of paginatedStudents(); track student.id) {
             <div class="student-row">
               <div><strong>{{ field(student, 'nombre') }}</strong><small>{{ field(student, 'cedula') }}</small></div>
                <button class="primary-button" type="button" (click)="printOne(student.id)">Imprimir</button>
             </div>
           } @empty { <p class="empty-state">No se encontraron estudiantes en la sección guía.</p> }
         </div>@if (totalPages() > 1) {<div class="pagination"><button type="button" class="ghost-button" [disabled]="studentPage() === 0" (click)="previousPage()">Anterior</button><span>Página {{ studentPage() + 1 }} de {{ totalPages() }}</span><button type="button" class="ghost-button" [disabled]="studentPage() + 1 >= totalPages()" (click)="nextPage()">Siguiente</button></div>}
      </section>

       <section class="reports-preview report-print-area" [class.reports-preview--all]="printingAll()">
        @if (printingAll()) {
           @for (report of allReports(); track report.identificacion) { <div class="report-page-break"><app-reporte-bandas-estudiante [report]="report" /></div> }
        } @else if (selectedReport(); as report) {
          <app-reporte-bandas-estudiante [report]="report" />
        } @else { <p class="empty-state no-print">Seleccione un estudiante para ver su reporte institucional.</p> }
      </section>
    </section>
  `,
  styles: `
    :host { display: block; height: 100%; overflow: hidden; }
    .bands-module { height: 100%; min-height: 0; overflow: auto; padding-bottom: 2rem; }
    .module-header,.preview-header,.context-panel,.student-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .module-header { margin-bottom: 1rem; }.module-header h2,.preview-header h3,.module-header p { margin: 0; }.module-header p,.preview-header p { color: #667085; }.eyebrow { margin: 0 0 .25rem; color: #2f6b9a; font-size: .8rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }.module-actions { display: flex; gap: .6rem; }
     .context-panel { padding: 1rem 1.2rem; margin-bottom: 1rem; background: #fff; border: 1px solid #dbe5ef; border-left: 4px solid #4099ff; box-shadow: 0 2px 8px rgba(27,46,94,.06); }.context-panel div { display: grid; gap: .2rem; }.context-panel small,.student-row small { color: #8996a4; font-size: .78rem; }.context-panel strong { font-size: .95rem; }.missing-assignment-list { margin:.15rem 0 0; padding-left:1.1rem; color:#b86b00; font-size:.88rem; font-weight:700; }.missing-assignment-list li::marker { color:#d97706; }.monograph-verification { display:grid; gap:.7rem; padding:1rem 1.2rem; margin-bottom:1rem; background:#fff; border:1px solid #dbe5ef; border-left:4px solid #238d78; }.monograph-verification h3 { margin:.15rem 0 0; }.monograph-verification small { color:#8996a4; }.verification-pending { color:#b42318; }.verification-ready { color:#147d64; }.monograph-status-table { width:100%; border-collapse:collapse; font-size:.82rem; }.monograph-status-table th,.monograph-status-table td { padding:.45rem .55rem; border:1px solid #dbe5ef; text-align:left; }.monograph-status-table th { background:#f5f8fa; }
     .student-picker { padding: 1rem 1.2rem; margin-bottom: 1rem; background: #fff; border: 1px solid #dbe5ef; }.student-picker > label { display: block; margin-bottom: .4rem; color: #29344a; font-weight: 700; }.student-picker > input { max-width: 430px; margin-bottom: .8rem; }.student-list { display: grid; gap: .45rem; }.student-row { padding: .7rem .85rem; border: 1px solid #e1e7ee; border-radius: 7px; }.student-row > div { display: grid; flex: 1; gap: .15rem; }.student-row strong { font-size: .95rem; }.student-row button { min-height: 36px; }.pagination { display:flex; align-items:center; justify-content:space-between; gap:.5rem; margin-top:.8rem; padding-top:.7rem; border-top:1px solid #e6edf3; color:#667085; font-size:.8rem; }.pagination .ghost-button { min-height:32px; padding:.3rem .6rem; font-size:.76rem; }.empty-state { padding: 1.5rem; margin: 0; color: #8996a4; text-align: center; }
     .report-print-area { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); }.reports-preview { padding: 1rem; background: #e9edf2; }.reports-preview app-reporte-bandas-estudiante { display: block; padding: 8mm; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.12); }.reports-preview--all { display: grid; gap: 1rem; }
    @media (max-width: 800px) { .module-header,.context-panel,.student-row { align-items: stretch; flex-direction: column; }.module-actions { width: 100%; }.module-actions > * { flex: 1; }.student-row { gap: .6rem; }.student-row button { width: 100%; } }
    @media print {
      @page { size: A4 portrait; margin: 10mm; }
       :host { height: auto; overflow: visible; }.bands-module { height: auto; overflow: visible; padding: 0; }.no-print { display: none !important; }.report-print-area { position: static; width: auto; height: auto; overflow: visible; clip: auto; }.reports-preview { padding: 0; background: #fff; }.reports-preview app-reporte-bandas-estudiante { padding: 0; box-shadow: none; }.reports-preview--all { display: block; }.reports-preview--all .report-page-break { display: block; break-after: auto !important; page-break-after: auto !important; break-inside: auto; page-break-inside: auto; }
    }
  `,
})
// Genera reportes de rendimiento por bandas.
export class ReportesBandasVistaComponent {
  private readonly datos = inject(PortalDatosService);
  private readonly auth = inject(AutenticacionService);
  protected readonly search = signal('');
  protected readonly selectedId = signal('');
  protected readonly printingAll = signal(false);
  protected readonly studentPage = signal(0);
  protected readonly pageSize = 3;
  private printingInProgress = false;

  protected readonly guideName = computed(() => ({ 'Profesor Guía': 'Laura Vanessa Quirós Brenes' } as Record<string, string>)[this.auth.currentRole() ?? ''] ?? 'Profesor Guía');
  protected readonly period = computed(() => this.datos.listar('periodos').find((item) => this.field(item, 'estado') === 'Activo') ?? this.datos.listar('periodos')[0] ?? { nombre: 'Sin periodo activo', descripcion: '', estado: 'Inactivo' });
  protected readonly periodLabel = computed(() => this.field(this.period(), 'nombre'));
  protected readonly section = computed(() => this.datos.listar('secciones').find((item) => this.field(item, 'guia') === this.guideName() && this.field(item, 'estado') === 'Activa') ?? this.datos.listar('secciones')[0] ?? { nombre: 'Sin sección', nivel: 'Sin nivel', guia: '', estado: 'Inactiva' });
  protected readonly students = computed(() => {
    const validIds = new Set(this.datos.listar('matriculas').filter((item) => this.field(item, 'seccion') === this.field(this.section(), 'nombre') && this.field(item, 'periodo') === this.field(this.period(), 'nombre') && this.field(item, 'estado') === 'Activa').map((item) => this.field(item, 'estudiante')));
    return this.datos.estudiantes().filter((student) => validIds.has(this.field(student, 'nombre')));
  });
  protected readonly filteredStudents = computed(() => { const term = this.search().trim().toLowerCase(); return this.students().filter((student) => !term || this.field(student, 'nombre').toLowerCase().includes(term) || this.field(student, 'cedula').toLowerCase().includes(term)); });
  protected readonly paginatedStudents = computed(() => { const students = this.filteredStudents(); const start = this.studentPage() * this.pageSize; return students.slice(start, start + this.pageSize); });
  protected readonly totalPages = computed(() => Math.ceil(this.filteredStudents().length / this.pageSize));
  protected readonly allReports = computed(() => this.students().map((student) => this.buildReport(student)));
  protected readonly selectedReport = computed(() => { const id = this.selectedId() || this.students()[0]?.id; const student = this.students().find((item) => item.id === id); return student ? this.buildReport(student) : undefined; });
  protected readonly missingAssignments = computed(() => {
    const assignments = this.datos.listar('asignaciones').filter((item) => this.field(item, 'seccion') === this.field(this.section(), 'nombre') && this.field(item, 'periodo') === this.field(this.period(), 'nombre') && this.field(item, 'estado') === 'Activa');
    return assignments.filter((assignment) => this.students().some((student) => !this.datos.evaluacionDeGrupo(student.id, { asignatura: this.field(assignment, 'asignatura'), seccion: this.field(this.section(), 'nombre'), periodo: this.field(this.period(), 'nombre') }).valor.trim())).map((assignment) => this.field(assignment, 'asignatura'));
  });
  protected readonly missingMonographReports = computed(() => {
    const reports = this.datos.monografias();
    return this.students().filter((student) => !reports.some((report) => report.estudiante === this.field(student, 'nombre') && report.informeEnviado)).map((student) => this.field(student, 'nombre'));
  });
  protected readonly monographVerification = computed(() => {
    const reports = this.datos.monografias();
    return this.students().map((student) => {
      const report = reports.find((item) => item.estudiante === this.field(student, 'nombre'));
      return { estudiante: this.field(student, 'nombre'), titulo: report?.titulo ?? 'Sin proyecto registrado', area: report?.area ?? '—', enviado: Boolean(report?.informeEnviado), tieneObservaciones: Boolean(report?.observacionReporte?.trim()) };
    });
  });

  protected select(id: string): void { this.printingAll.set(false); this.selectedId.set(id); }
  protected previousPage(): void { this.studentPage.update((page) => Math.max(0, page - 1)); }
  protected nextPage(): void { this.studentPage.update((page) => Math.min(this.totalPages() - 1, page + 1)); }
  protected printOne(id: string): void { this.printingAll.set(false); this.selectedId.set(this.students().find((student) => student.id === id)?.id ?? id); this.startPrint(); }
  protected printAll(): void { this.printingAll.set(true); this.startPrint(); }

  private startPrint(): void {
    if (this.printingInProgress) return;
    this.printingInProgress = true;
    const printWindow = window.open('', '_blank', `width=${screen.availWidth},height=${screen.availHeight},left=0,top=0`);
    if (!printWindow) {
      this.printingInProgress = false;
      window.print();
      return;
    }

    const restorePage = () => { document.body.style.visibility = ''; this.printingInProgress = false; };
    document.body.style.visibility = 'hidden';

    setTimeout(() => {
      const reports = Array.from(document.querySelectorAll('.reports-preview app-reporte-bandas-estudiante'))
        .map((element) => `<div class="report-copy">${element.innerHTML}</div>`)
        .join('');
      const styles = Array.from(document.head.querySelectorAll('style')).map((style) => style.textContent ?? '').join('\n');
      printWindow.document.open();
      printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Reportes de bandas</title><style>${styles}</style><style>@page{size:A4 portrait;margin:10mm}html,body{margin:0;background:#fff}.report-copy{display:block;break-after:page;page-break-after:always;overflow:visible}.report-copy:last-child{break-after:auto;page-break-after:auto}app-reporte-bandas-estudiante{display:block}.report-copy .report-page{break-after:auto!important;page-break-after:auto!important}</style></head><body>${reports}</body></html>`);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.addEventListener('afterprint', () => {
          restorePage();
          printWindow.close();
        }, { once: true });
        printWindow.addEventListener('beforeunload', restorePage, { once: true });
        printWindow.focus();
        printWindow.print();
      }, 300);
    }, 100);
  }

  private buildReport(student: RegistroPortal): DocumentoReporteBandas {
    const assignments = this.datos.listar('asignaciones').filter((item) => this.field(item, 'seccion') === this.field(this.section(), 'nombre') && this.field(item, 'periodo') === this.field(this.period(), 'nombre') && this.field(item, 'estado') === 'Activa');
    const subjects = this.datos.listar('asignaturas');
    const attendance = this.datos.asistencia(student.id);
    const monograph = this.datos.monografias().find((item) => item.estudiante === this.field(student, 'nombre'));
    const theoryAssignment = assignments.find((assignment) => this.field(assignment, 'asignatura') === 'Teoría del Conocimiento');
    const theoryEvaluation = theoryAssignment ? this.datos.evaluacionDeGrupo(student.id, { asignatura: 'Teoría del Conocimiento', seccion: this.field(this.section(), 'nombre'), periodo: this.field(this.period(), 'nombre') }) : undefined;
    const numericAssignments = assignments.filter((assignment) => subjects.find((subject) => this.field(subject, 'nombre') === this.field(assignment, 'asignatura'))?.['escala'] === '1-100');
    return {
      estudiante: this.field(student, 'nombre'),
      identificacion: this.field(student, 'cedula'),
      seccion: this.field(this.section(), 'nombre'),
      nivel: this.field(this.section(), 'nivel'),
      periodo: this.field(this.period(), 'nombre').replace(/\s+\d{4}$/, ''),
      anio: this.field(this.period(), 'nombre').match(/\d{4}/)?.[0] ?? '',
      filas: assignments.map((assignment) => {
        const subject = subjects.find((item) => this.field(item, 'nombre') === this.field(assignment, 'asignatura'));
         const groupEvaluation = this.datos.evaluacionDeGrupo(student.id, { asignatura: this.field(assignment, 'asignatura'), seccion: this.field(this.section(), 'nombre'), periodo: this.field(this.period(), 'nombre') });
         const hasEvaluation = groupEvaluation.valor.trim() !== '';
         return { asignatura: this.field(assignment, 'asignatura'), bandaMinima: this.field(subject, 'escala') === 'A-E' ? 'A' : this.field(subject, 'escala') === '1-100' ? '70' : '4', bandaAlcanzada: hasEvaluation ? groupEvaluation.valor : '—', tardias: String(attendance.tardias), injustificadas: String(attendance.injustificadas), justificadas: String(attendance.justificadas), observaciones: hasEvaluation ? groupEvaluation.observacion : 'Sin registrar' };
       }),
       teoriaConocimiento: { bandaAlcanzada: theoryEvaluation?.valor || '—', tardias: String(attendance.tardias), injustificadas: String(attendance.injustificadas), justificadas: String(attendance.justificadas), observaciones: theoryEvaluation?.observacion || 'Sin registrar' },
       reporteMonografia: { area: monograph?.area ?? '', coordinador: monograph?.coordinador ?? '', observaciones: monograph?.informeEnviado ? monograph.observacionReporte ?? 'Sin observaciones registradas' : 'Sin informe registrado' },
       filasNumericas: numericAssignments.map((assignment) => {
         const subjectName = this.field(assignment, 'asignatura');
         const evaluation = this.datos.evaluacionDeGrupo(student.id, { asignatura: subjectName, seccion: this.field(this.section(), 'nombre'), periodo: this.field(this.period(), 'nombre') });
         return { asignatura: subjectName, notaMinima: '70', notaAlcanzada: evaluation.valor || '—', tardias: String(attendance.tardias), injustificadas: String(attendance.injustificadas), justificadas: String(attendance.justificadas), observaciones: evaluation.observacion || 'Sin registrar' };
       }),
    };
  }

  protected field(record: RegistroPortal | undefined, key: string): string { return record?.[key] ?? ''; }
  protected missingSubjects(student: RegistroPortal): string[] { return this.datos.listar('asignaciones').filter((item) => this.field(item, 'seccion') === this.field(this.section(), 'nombre') && this.field(item, 'periodo') === this.field(this.period(), 'nombre') && this.field(item, 'estado') === 'Activa').filter((item) => !this.datos.evaluacionDeGrupo(student.id, { asignatura: this.field(item, 'asignatura'), seccion: this.field(this.section(), 'nombre'), periodo: this.field(this.period(), 'nombre') }).valor.trim()).map((item) => this.field(item, 'asignatura')); }
}
