import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin, switchMap } from 'rxjs';
import { MonografiaSeguimientoGuiaApi, PeriodoGuiaApi, ProfesorGuiaApiService, ReporteMonografiaGuiaApi, SeccionGuiaApi } from '../nucleo/api/profesor-guia-api.service';

interface VerificacionMonografia {
  cedula: string;
  estudiante: string;
  titulo: string;
  area: string;
  coordinador: string;
  observaciones: string;
  estado: string;
  enviado: boolean;
}

@Component({
  selector: 'app-vista-verificacion-monografias',
  imports: [],
  template: `
    <section class="verification-page" aria-labelledby="verification-title">
      <header class="surface page-header"><div><p class="eyebrow">Sección guía</p><h2 id="verification-title">Verificación de reportes de monografía</h2><p>Revise los proyectos y las observaciones recibidas antes de generar las notas.</p></div><span class="period-chip">{{ periodoEtiqueta() }}</span></header>
      @if (secciones().length > 1) {<section class="surface section-selector"><label>Sección<select [value]="clave(seccionActual())" (change)="cambiarSeccion($any($event.target).value)">@for (section of secciones(); track clave(section)) {<option [value]="clave(section)">{{ section.nombre }}</option>}</select></label></section>}
      @if (error()) { <p class="surface error" role="alert">{{ error() }}</p> }
      <section class="surface verification-card"><div class="verification-summary"><div><strong>Estado general</strong><p>{{ received() }} de {{ projectCount() }} proyectos con reporte enviado al Profesor Guía.</p></div>@if (loading()) {<strong>Cargando verificación...</strong>} @else if (pending() === 0) {<strong class="status-ready">Todos los proyectos tienen reporte</strong>} @else {<strong class="status-pending">Faltan {{ pending() }} reportes</strong>}</div>
         <div class="report-table"><div class="report-table-head"><strong>Estudiante</strong><strong>Proyecto</strong><strong>Área</strong><strong>Profesor Coordinador de Monografía</strong><strong>Observaciones</strong><strong>Reporte</strong></div>@for (item of reports(); track item.cedula) {<div class="report-table-row"><span>{{ item.estudiante }}</span><span>{{ item.titulo }}</span><span>{{ item.area }}</span><span>{{ item.coordinador }}</span><span>{{ item.observaciones }}</span><span [class.status-ready]="item.enviado" [class.status-pending]="!item.enviado">{{ item.enviado ? 'Enviado' : 'Pendiente' }}</span></div>} @empty {<p class="empty">No hay monografías registradas en la sección guía.</p>}</div>
      </section>
    </section>
  `,
  styles: `
    :host .report-table-head,:host .report-table-row{grid-template-columns:1.2fr 1.4fr .9fr 1.8fr 1.35fr .8fr;min-width:1040px}
    .verification-page{display:grid;gap:1rem;align-content:start}.page-header,.verification-card,.section-selector{padding:1rem 1.2rem;border:1px solid #dbe5ef;border-radius:9px;background:#fff}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.page-header h2,.page-header p:last-child{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.period-chip{padding:.35rem .65rem;border-radius:999px;background:#eefaf8;color:#1b6f60;font-size:.78rem;font-weight:700}.section-selector label{display:grid;gap:.35rem;max-width:360px;font-weight:700}.verification-card{display:grid;gap:1rem}.verification-summary{display:flex;align-items:center;justify-content:space-between;gap:1rem}.verification-summary p{margin:.25rem 0 0;color:#667085}.report-table{overflow-x:auto}.report-table-head,.report-table-row{display:grid;grid-template-columns:1.2fr 1.4fr .9fr 1.8fr .8fr 1.35fr;gap:.7rem;align-items:center;min-width:1040px}.report-table-head{padding:.65rem .7rem;background:#f5f8fa;color:#667085;font-size:.75rem;text-transform:uppercase}.report-table-row{padding:.75rem .7rem;border-top:1px solid #e6edf3;font-size:.86rem}.status-ready{color:#147d64;font-weight:700}.status-pending{color:#b42318;font-weight:700}.empty,.error{padding:1rem;color:#667085}@media(max-width:800px){.page-header,.verification-summary{align-items:flex-start;flex-direction:column}}
  `,
})
// Revisa los reportes reales de monografía de la sección guía.
export class VerificacionMonografiasVistaComponent {
  private readonly api = inject(ProfesorGuiaApiService);
  private readonly periodo = signal<PeriodoGuiaApi | null>(null);
  protected readonly secciones = signal<SeccionGuiaApi[]>([]);
  private readonly seleccion = signal('');
  protected readonly reports = signal<VerificacionMonografia[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly seccionActual = computed(() => this.secciones().find((section) => this.clave(section) === this.seleccion()) ?? this.secciones()[0]);
  protected readonly periodoEtiqueta = computed(() => this.etiquetaPeriodo(this.periodo()));
  protected readonly received = computed(() => this.reports().filter((item) => item.enviado).length);
  protected readonly projectCount = computed(() => this.reports().length);
  protected readonly pending = computed(() => this.projectCount() - this.received());

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

  private cargar(seccion: SeccionGuiaApi): void {
    const semestre = this.periodo()?.semestreActual;
    this.seleccion.set(this.clave(seccion));
    this.reports.set([]);
    if (!semestre) { this.error.set('No hay un semestre académico activo.'); this.loading.set(false); return; }
    this.loading.set(true);
    this.error.set('');
    const query = { anio: seccion.anio, nivel: seccion.nivel, numero: seccion.numero, semestre };
    forkJoin({ monographs: this.api.listarMonografias(query), reports: this.api.listarReportesMonografia(query) }).subscribe({
      next: ({ monographs, reports }) => { this.reports.set(this.adaptar(monographs, reports)); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar la verificación de monografías.'); this.loading.set(false); },
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
         observaciones: report?.enviadoEn ? report.observaciones?.trim() || 'Sin observaciones registradas' : 'Sin reporte enviado',
         estado: monografia.estado,
        enviado: Boolean(report?.enviadoEn),
      };
    }).sort((a, b) => Number(a.enviado) - Number(b.enviado));
  }

  private etiquetaPeriodo(periodo: PeriodoGuiaApi | null): string {
    if (!periodo) return 'Periodo actual';
    const semestre = periodo.semestreActual === 'I_SEMESTRE' ? 'Primer semestre' : periodo.semestreActual === 'II_SEMESTRE' ? 'Segundo semestre' : 'Receso académico';
    return `${semestre} ${periodo.anio}`;
  }
}
