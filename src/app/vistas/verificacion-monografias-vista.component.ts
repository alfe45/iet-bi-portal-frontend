import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin, switchMap } from 'rxjs';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { MonografiaSeguimientoGuiaApi, PeriodoGuiaApi, ProfesorGuiaApiService, ReporteMonografiaGuiaApi, SeccionGuiaApi } from '../nucleo/api/profesor-guia-api.service';
import { FeedbackService } from '../compartidos/servicios/feedback.service';

interface VerificacionMonografia {
  cedula: string;
  estudiante: string;
  titulo: string;
  area: string;
  coordinador: string;
  observaciones: string;
  estado: string;
  completa: boolean;
  confirmada: boolean;
}

interface ProblemaVerificacionMonografia {
  titulo: string;
  descripcion: string;
  estudiantes: Array<{ nombre: string; detalle: string }>;
}

@Component({
  selector: 'app-vista-verificacion-monografias',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="bands-module" aria-labelledby="verification-title">
      <header class="module-header no-print"><div><p class="eyebrow">Profesor Guía</p><h2 id="verification-title">Verificación de reportes de monografía</h2><p>Revise los proyectos y las observaciones recibidas antes de generar las notas.</p></div><div class="module-actions"><a class="ghost-button" routerLink="/dashboard">← Volver</a></div></header>
       <section class="context-panel no-print"><div><small>Periodo actual</small><strong>{{ periodoEtiqueta() }}</strong></div><div><small>Sección guía</small><strong>{{ seccionActual()?.nombre || 'Sin sección' }} · Nivel {{ seccionActual()?.nivel ?? '-' }}</strong></div><div><small>Profesor Guía</small><strong>{{ guideName() }}</strong></div><div><small>Estado de información</small>@if (loading()) {<strong>Cargando...</strong>} @else if (!reports().length) {<strong class="context-status status-pending">Sin información</strong>} @else if (incompleteProjects().length) {<strong class="context-status status-pending">Información incompleta</strong><small>Faltan reportes en {{ incompleteProjects().length }} proyecto(s).</small><button type="button" class="status-link" (click)="abrirProblemas()">Ver estudiantes</button>} @else if (pending() > 0) {<strong class="context-status status-warning">Completa, pendiente de confirmación</strong><small>{{ pending() }} proyecto(s) esperan confirmación.</small><button type="button" class="status-link" (click)="abrirProblemas()">Ver estudiantes</button>} @else {<strong class="context-status status-ready">Confirmada y completa</strong><small>Todos los reportes están completos y confirmados.</small>}</div></section>
       @if (problemasModalOpen()) {<div class="modal-backdrop no-print" role="presentation" (click)="cerrarProblemas()"><section class="incomplete-modal" role="dialog" aria-modal="true" aria-labelledby="monograph-issues-title" (click)="$event.stopPropagation()"><div class="modal-heading"><h3 id="monograph-issues-title">Pendientes de monografías</h3><button type="button" class="close-button" aria-label="Cerrar lista" (click)="cerrarProblemas()">×</button></div><div class="issue-groups">@for (group of problemasMonografia(); track group.titulo) {<section class="issue-group"><h4>{{ group.titulo }}</h4><p>{{ group.descripcion }}</p><ul class="incomplete-list">@for (student of group.estudiantes; track student.nombre + student.detalle) {<li><strong>{{ student.nombre }}</strong>@if (student.detalle) {<small>{{ student.detalle }}</small>}</li>}</ul></section>}</div></section></div>}
      @if (secciones().length > 1) {<section class="section-selector no-print"><label>Sección<select [value]="clave(seccionActual())" (change)="cambiarSeccion($any($event.target).value)">@for (section of secciones(); track clave(section)) {<option [value]="clave(section)">{{ section.nombre }}</option>}</select></label></section>}
      <section class="student-picker no-print"><label for="student-search">Buscar estudiante</label><input id="student-search" type="search" [ngModel]="search()" (ngModelChange)="search.set($event); studentPage.set(0)" placeholder="Nombre o identificación" /><div class="student-list">@for (item of paginatedReports(); track item.cedula) {<div class="student-row"><div><strong>{{ item.estudiante }}</strong><small class="student-detail">{{ item.cedula }} · {{ item.titulo }} · {{ item.area }} · {{ item.coordinador }}</small></div><span class="report-status" [class.report-status--confirmed]="item.confirmada && item.completa" [class.report-status--complete]="item.completa && !item.confirmada" [class.status-pending]="!item.completa">{{ etiquetaReporte(item) }}</span><button class="ghost-button reactivate-button" type="button" [disabled]="saving() || !item.confirmada" (click)="permitirCambios(item)">{{ item.confirmada ? 'Reactivar edición' : 'Sin confirmar' }}</button></div>} @empty {<p class="empty-state">{{ loading() ? 'Cargando reportes...' : 'No se encontraron reportes de monografía en la sección guía.' }}</p>}</div>@if (totalPages() > 1) {<div class="pagination"><button type="button" class="ghost-button" [disabled]="studentPage() === 0" (click)="previousPage()">Anterior</button><span>Página {{ studentPage() + 1 }} de {{ totalPages() }}</span><button type="button" class="ghost-button" [disabled]="studentPage() + 1 >= totalPages()" (click)="nextPage()">Siguiente</button></div>}</section>
    </section>
  `,
  styles: `
      :host{display:block;height:100%;overflow:hidden}.bands-module{height:100%;min-height:0;overflow:auto;padding-bottom:2rem}.module-header,.context-panel,.student-row{display:flex;align-items:center;justify-content:space-between;gap:1rem}.module-header{margin-bottom:1rem}.module-header h2,.module-header p{margin:0}.module-header p{color:#667085}.context-panel{padding:1rem 1.2rem;margin-bottom:1rem;background:#fff;border:1px solid #dbe5ef;border-left:4px solid #4099ff;box-shadow:0 2px 8px rgba(27,46,94,.06)}.context-panel div{display:grid;gap:.2rem}.context-panel small,.student-row small{color:#667085;font-size:.78rem}.context-panel strong{font-size:.95rem}.context-status,.report-status{display:inline-block;width:max-content;padding:.18rem .45rem;border:1px solid transparent;border-radius:999px;font-size:.78rem!important;font-weight:800}.status-ready,.report-status--confirmed{color:#067647!important;background:#ecfdf3;border-color:#abefc6}.status-pending{color:#b42318!important;background:#fff1f0;border-color:#fecdca}.status-warning,.report-status--complete{color:#9a6700!important;background:#fff8db;border-color:#f3d36a}.student-picker{padding:1rem 1.2rem;margin-bottom:1rem;background:#fff;border:1px solid #dbe5ef}.student-picker>label{display:block;margin-bottom:.4rem;color:#29344a;font-weight:700}.student-picker>input{max-width:430px;margin-bottom:.8rem}.student-list{display:grid;gap:.45rem}.student-row{padding:.7rem .85rem;border:1px solid #e1e7ee;border-radius:7px}.student-row>div{display:grid;flex:1;min-width:0;gap:.15rem}.student-row strong{font-size:.95rem}.student-detail{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.student-row button{min-height:36px}.pagination{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:.8rem;padding-top:.7rem;border-top:1px solid #e6edf3;color:#667085;font-size:.8rem}.pagination .ghost-button{min-height:32px;padding:.3rem .6rem;font-size:.76rem}.empty-state,.error{padding:1.5rem;margin:0;color:#667085;text-align:center}@media(max-width:800px){.module-header,.context-panel,.student-row{align-items:stretch;flex-direction:column}.module-actions{width:100%}.module-actions>*{flex:1}.student-row button{width:100%}}
       .module-actions{display:flex;gap:.6rem}.context-panel,.section-selector,.student-picker{padding:1rem 1.2rem;margin-bottom:1rem;background:#fff;border:1px solid #dbe5ef}.context-panel{border-left:4px solid #4099ff;box-shadow:0 2px 8px rgba(27,46,94,.06)}.section-selector label{display:grid;gap:.35rem;max-width:360px;font-weight:700}.student-picker>label{display:block;margin-bottom:.4rem;color:#29344a;font-weight:700}.student-picker>input{max-width:430px;margin-bottom:.8rem}.reactivate-button{min-height:36px!important;padding:.45rem .7rem!important;color:#1769aa;background:#eef6ff;border-color:#9ac7f5}.reactivate-button:hover{color:#0f568e;background:#dceeff;border-color:#6daee8}.reactivate-button:disabled{cursor:not-allowed;opacity:.55;transform:none;box-shadow:none}.pagination{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-top:.8rem;padding-top:.7rem;border-top:1px solid #e6edf3;color:#667085;font-size:.8rem}.pagination .ghost-button{min-height:32px;padding:.3rem .6rem;font-size:.76rem}.empty-state,.error{padding:1.5rem;margin:0;color:#667085;text-align:center}@media(max-width:800px){.module-header,.context-panel{align-items:stretch;flex-direction:column}.module-actions{width:100%}.module-actions>*{flex:1}}
       .status-link{width:max-content;padding:0;border:0;background:none;color:#1769aa;font:inherit;font-size:.78rem;font-weight:800;text-decoration:underline;cursor:pointer}.modal-backdrop{position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(13,25,39,.52)}.incomplete-modal{width:min(100%,680px);max-height:calc(100vh - 2rem);margin:auto;overflow:auto;border-radius:10px;background:#fff;box-shadow:0 20px 60px rgba(4,26,55,.3)}.incomplete-modal .modal-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.2rem;border-bottom:1px solid #e6edf3}.incomplete-modal h3{margin:0;color:#1e3a5f}.incomplete-modal .close-button{display:grid;flex:0 0 auto;place-items:center;width:32px;height:32px;padding:0;border:1px solid #fecdca;border-radius:50%;color:#b42318;background:#fff1f0;font-weight:800;line-height:1}.issue-groups{display:grid;gap:.8rem;padding:1rem 1.2rem 1.2rem}.issue-group{border:1px solid #e1e7ee;border-radius:8px;background:#fbfcfe}.issue-group h4{margin:0;padding:.75rem .9rem .2rem;color:#1e3a5f;font-size:.95rem}.issue-group>p{margin:.1rem .9rem .55rem;color:#667085;font-size:.82rem;line-height:1.4}.issue-group .incomplete-list{padding:.25rem .9rem .85rem 2rem}.incomplete-list{display:grid;gap:.45rem;margin:0;color:#344054}.incomplete-list li{line-height:1.35}.incomplete-list small{display:block;margin-top:.1rem;color:#667085;font-size:.78rem}
  `,
})
// Revisa los reportes reales de monografía de la sección guía.
export class VerificacionMonografiasVistaComponent {
  private readonly api = inject(ProfesorGuiaApiService);
  private readonly auth = inject(AutenticacionService);
  private readonly feedback = inject(FeedbackService);
  private readonly periodo = signal<PeriodoGuiaApi | null>(null);
  protected readonly secciones = signal<SeccionGuiaApi[]>([]);
  private readonly seleccion = signal('');
   protected readonly reports = signal<VerificacionMonografia[]>([]);
   protected readonly loading = signal(true);
    protected readonly saving = signal(false);
    protected readonly search = signal('');
   protected readonly studentPage = signal(0);
   protected readonly pageSize = 3;
   protected readonly seccionActual = computed(() => this.secciones().find((section) => this.clave(section) === this.seleccion()) ?? this.secciones()[0]);
   protected readonly periodoEtiqueta = computed(() => this.etiquetaPeriodo(this.periodo()));
   protected readonly guideName = computed(() => this.auth.currentDisplayName() || 'Profesor Guía');
   protected readonly confirmed = computed(() => this.reports().filter((item) => item.confirmada).length);
   protected readonly complete = computed(() => this.reports().filter((item) => item.completa).length);
   protected readonly projectCount = computed(() => this.reports().length);
     protected readonly pending = computed(() => this.projectCount() - this.confirmed());
     protected readonly incompleteProjects = computed(() => this.reports().filter((item) => !item.completa));
     protected readonly problemasMonografia = computed<ProblemaVerificacionMonografia[]>(() => {
       const incompletos = this.reports()
         .filter((item) => !item.completa)
         .map((item) => ({ nombre: item.estudiante, detalle: `Área: ${item.area || 'sin especificar'}` }));
       const pendientes = this.reports()
         .filter((item) => item.completa && !item.confirmada)
         .map((item) => ({ nombre: item.estudiante, detalle: `Área: ${item.area || 'sin especificar'}` }));
       const grupos: ProblemaVerificacionMonografia[] = [];
       if (incompletos.length) grupos.push({ titulo: 'Reportes de monografía incompletos', descripcion: 'No tienen las observaciones completas para este semestre.', estudiantes: incompletos });
       if (pendientes.length) grupos.push({ titulo: 'Reportes de monografía pendientes de confirmación', descripcion: 'Están completos, pero todavía no han sido confirmados por el Coordinador de Monografía.', estudiantes: pendientes });
       return grupos;
     });
     protected readonly problemasModalOpen = signal(false);
    protected readonly filteredReports = computed(() => {
      const term = this.search().trim().toLowerCase();
      return this.reports().filter((item) => !term || [item.estudiante, item.cedula, item.titulo, item.area, item.coordinador].some((value) => value.toLowerCase().includes(term)));
    });
    protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredReports().length / this.pageSize)));
    protected readonly paginatedReports = computed(() => {
       const start = this.studentPage() * this.pageSize;
      return this.filteredReports().slice(start, start + this.pageSize);
   });

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
   protected previousPage(): void { this.studentPage.update((value) => Math.max(0, value - 1)); }
    protected nextPage(): void { this.studentPage.update((value) => Math.min(this.totalPages() - 1, value + 1)); }
    protected abrirProblemas(): void { this.problemasModalOpen.set(true); }
    protected cerrarProblemas(): void { this.problemasModalOpen.set(false); }

   protected async permitirCambios(item: VerificacionMonografia): Promise<void> {
     const section = this.seccionActual();
     const period = this.periodo();
     if (!section || !period?.semestreActual || !item.confirmada) return;
     const confirmado = await this.feedback.confirmar(
       `Se reactivará la edición del reporte de ${item.estudiante}. El Coordinador de Monografía podrá corregir las observaciones de este semestre y deberá confirmarlas nuevamente al Profesor Guía.`,
       'Reactivar edición del reporte',
       'Reactivar edición',
     );
     if (!confirmado) return;
     this.saving.set(true);
     this.api.permitirCambiosReporteMonografia({ anio: section.anio, nivel: section.nivel, numero: section.numero, semestre: period.semestreActual }, item.cedula)
       .pipe(finalize(() => this.saving.set(false)))
       .subscribe({
         next: () => { this.feedback.exito(`Edición reactivada. El Coordinador de Monografía ya puede corregir y confirmar nuevamente el reporte de ${item.estudiante}.`); this.cargar(section); },
         error: (e: { error?: { mensaje?: string } }) => this.feedback.error(e.error?.mensaje ?? 'No se pudo reactivar el reporte para el Coordinador de Monografía.'),
       });
   }

   private cargar(seccion: SeccionGuiaApi): void {
    const semestre = this.periodo()?.semestreActual;
     this.seleccion.set(this.clave(seccion));
       this.reports.set([]);
       this.problemasModalOpen.set(false);
       this.search.set('');
      this.studentPage.set(0);
     if (!semestre) { this.feedback.error('No hay un semestre académico activo.'); this.loading.set(false); return; }
     this.loading.set(true);
    const query = { anio: seccion.anio, nivel: seccion.nivel, numero: seccion.numero, semestre };
    forkJoin({ monographs: this.api.listarMonografias(query), reports: this.api.listarReportesMonografia(query) }).subscribe({
      next: ({ monographs, reports }) => { this.reports.set(this.adaptar(monographs, reports)); this.loading.set(false); },
     error: () => { this.feedback.error('No se pudo cargar la verificación de monografías.'); this.loading.set(false); },
    });
  }

  private adaptar(monographs: MonografiaSeguimientoGuiaApi[], reports: ReporteMonografiaGuiaApi[]): VerificacionMonografia[] {
    const byStudent = new Map(reports.map((report) => [report.cedulaEstudiante, report]));
    return monographs.map(({ monografia }) => {
      const report = byStudent.get(monografia.cedulaEstudiante);
      return {
        cedula: monografia.cedulaEstudiante,
        estudiante: monografia.nombreEstudiante,
        titulo: `Monografía de ${monografia.asignatura}`,
         area: monografia.asignatura,
         coordinador: monografia.nombreCoordinador,
          observaciones: report?.observaciones?.trim() || 'Sin reporte registrado',
          estado: monografia.estado,
         completa: Boolean(report?.observaciones?.trim()),
         confirmada: Boolean(report?.enviadoEn),
       };
     }).sort((a, b) => Number(a.confirmada) - Number(b.confirmada));
   }

   protected etiquetaReporte(item: VerificacionMonografia): string {
     if (!item.completa) return 'Incompleto';
     return item.confirmada ? 'Confirmado y completo' : 'Completo · pendiente de confirmación';
   }

  private etiquetaPeriodo(periodo: PeriodoGuiaApi | null): string {
    if (!periodo) return 'Periodo actual';
    const semestre = periodo.semestreActual === 'I_SEMESTRE' ? 'Primer semestre' : periodo.semestreActual === 'II_SEMESTRE' ? 'Segundo semestre' : 'Receso académico';
    return `${semestre} ${periodo.anio}`;
  }
}
