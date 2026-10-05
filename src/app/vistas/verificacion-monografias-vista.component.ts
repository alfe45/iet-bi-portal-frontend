import { Component, computed, inject } from '@angular/core';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';
import { PortalDatosService } from '../nucleo/datos/portal-datos.service';

@Component({
  selector: 'app-vista-verificacion-monografias',
  imports: [],
  template: `
    <section class="verification-page" aria-labelledby="verification-title">
      <header class="surface page-header"><div><p class="eyebrow">Sección guía</p><h2 id="verification-title">Verificación de reportes de monografía</h2><p>Revise los proyectos y las observaciones recibidas antes de generar las notas.</p></div><span class="period-chip">{{ grupos.periodoActivo() }}</span></header>
       <section class="surface verification-card"><div class="verification-summary"><div><strong>Estado general</strong><p>{{ received() }} de {{ projectCount() }} proyectos con reporte enviado al Profesor Guía.</p></div>@if (pending() === 0) {<strong class="status-ready">Todos los proyectos tienen reporte</strong>} @else {<strong class="status-pending">Faltan {{ pending() }} reportes</strong>}</div>
         <div class="report-table"><div class="report-table-head"><strong>Estudiante</strong><strong>Proyecto</strong><strong>Área</strong><strong>Profesor Coordinador de Monografía</strong><strong>Reporte</strong><strong>Observaciones</strong></div>@for (item of reports(); track item.estudiante) {<div class="report-table-row"><span>{{ item.estudiante }}</span><span>{{ item.titulo }}</span><span>{{ item.area }}</span><span>{{ item.coordinador }}</span><span [class.status-ready]="item.enviado" [class.status-pending]="item.tieneProyecto && !item.enviado">{{ item.tieneProyecto ? (item.enviado ? 'Enviado' : 'Pendiente') : 'No aplica' }}</span><span [class.status-ready]="item.tieneObservaciones" [class.status-pending]="item.tieneProyecto && !item.tieneObservaciones">{{ item.tieneProyecto ? (item.tieneObservaciones ? 'Sí' : 'No') : '—' }}</span></div>} @empty {<p class="empty">No hay estudiantes registrados en la sección guía.</p>}</div>
      </section>
    </section>
  `,
  styles: `
    .verification-page{display:grid;gap:1rem;align-content:start}.page-header,.verification-card{padding:1rem 1.2rem;border:1px solid #dbe5ef;border-radius:9px;background:#fff}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.page-header h2,.page-header p:last-child{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.period-chip{padding:.35rem .65rem;border-radius:999px;background:#eefaf8;color:#238d78;font-size:.78rem;font-weight:700}.verification-card{display:grid;gap:1rem}.verification-summary{display:flex;align-items:center;justify-content:space-between;gap:1rem}.verification-summary p{margin:.25rem 0 0;color:#667085}.report-table{overflow-x:auto}.report-table-head,.report-table-row{display:grid;grid-template-columns:1.2fr 1.4fr .9fr 1.8fr .8fr .9fr;gap:.7rem;align-items:center;min-width:980px}.report-table-head{padding:.65rem .7rem;background:#f5f8fa;color:#667085;font-size:.75rem;text-transform:uppercase}.report-table-row{padding:.75rem .7rem;border-top:1px solid #e6edf3;font-size:.86rem}.status-ready{color:#147d64;font-weight:700}.status-pending{color:#b42318;font-weight:700}.empty{padding:1rem;color:#667085}@media(max-width:800px){.page-header,.verification-summary{align-items:flex-start;flex-direction:column}}
  `,
})
// Revisa el estado de verificación de las monografías.
export class VerificacionMonografiasVistaComponent {
  protected readonly grupos = inject(GruposProfesorService);
  private readonly datos = inject(PortalDatosService);
  protected readonly reports = computed(() => {
    const students = this.grupos.grupos().filter((group) => group.seccion === '11-1').flatMap((group) => group.estudiantes).filter((student, index, list) => list.findIndex((item) => item.id === student.id) === index);
    const monographs = this.datos.monografias();
      return students.map((student) => monographs.find((item) => item.estudiante === student['nombre'])).filter((report): report is typeof monographs[number] => Boolean(report)).map((report) => ({ estudiante: report.estudiante, titulo: report.titulo, area: report.area, coordinador: report.coordinador, tieneProyecto: true, enviado: Boolean(report.informeEnviado), tieneObservaciones: Boolean(report.observacionReporte?.trim()) }));
  });
  protected readonly received = computed(() => this.reports().filter((item) => item.enviado).length);
  protected readonly projectCount = computed(() => this.reports().filter((item) => item.tieneProyecto).length);
  protected readonly pending = computed(() => this.projectCount() - this.received());
}
