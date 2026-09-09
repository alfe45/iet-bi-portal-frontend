import { Component, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { AlertBannerComponent } from '../compartidos/componentes/banner-alerta.component';
import { DataTableComponent } from '../compartidos/componentes/tabla-datos.component';
import { PortalDatosService } from '../nucleo/datos/portal-datos.service';

@Component({
  selector: 'app-vista-reportes',
  imports: [AlertBannerComponent, DataTableComponent, RouterLink, RouterLinkActive],
  template: `
    <section class="page-grid">
      <section class="surface">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Reportes</p>
            <h2>{{ pageTitle() }}</h2>
            <p>{{ pageDescription() }}</p>
          </div>

          <div class="pill-grid">
             <button type="button" class="ghost-button" (click)="back()">← Volver</button>
            @if (isGuide()) {
               <a class="ghost-button" routerLink="/reportes/asignatura" routerLinkActive="tab-active">Mi asignatura</a>
            }

             <button type="button" class="primary-button" (click)="print()">Imprimir reporte</button>
          </div>
        </div>

         <div class="report-context"><strong>Periodo activo:</strong> {{ period }} <strong>Grupo:</strong> {{ subject }} · {{ section }} <strong>Estudiantes:</strong> {{ groupStudentCount() }}</div>
      </section>

      @if (isProfessor()) {
        <section class="surface report-preview">
          <div class="report-header">
            <div>
              <p class="eyebrow">Vista previa</p>
               <h3>Reporte de {{ subject }}</h3>
            </div>
            <span class="tag">Documento</span>
          </div>

          <div class="report-sheet">
            <p><strong>Estudiante:</strong> {{ professorReport().student.name }}</p>
            <p><strong>Sección:</strong> {{ professorReport().student.section }}</p>
             <p><strong>Periodo:</strong> {{ period }}</p>
          </div>

          <app-data-table [columns]="individualColumns" [rows]="professorRows()" />
        </section>
      }

      @if (isCoordinator()) {
        <app-alert-banner title="Reporte de monografía" message="El Profesor Coordinador de Monografía genera el reporte con área y observaciones. El Profesor Guía de sección puede consultarlo en modo lectura." tone="success" />

        <section class="surface report-preview">
          <div class="report-header">
            <div>
              <p class="eyebrow">Vista previa</p>
              <h3>REPORTE DE MONOGRAFÍA</h3>
            </div>
            <div class="pill-grid">
               <button type="button" class="ghost-button" (click)="back()">Volver</button>
               <button type="button" class="primary-button" (click)="print()">Imprimir reporte</button>
            </div>
          </div>

           <p class="report-context"><strong>Observación:</strong> {{ selectedObservation() }}</p>

          <app-data-table [columns]="monographReportColumns" [rows]="monographReportRows()" />
        </section>
      }
    </section>
  `,
  styles: `
    .eyebrow { margin: 0 0 0.25rem; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.74rem; color: #2f6b9a; font-weight: 700; }
    .report-preview { display: grid; gap: 1rem; }
    .report-header { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
    .report-sheet { padding: 1.5rem; border-radius: 24px; background: linear-gradient(180deg, #fff, #f8fbfd); border: 1px solid #dfe7ef; display: grid; gap: 0.5rem; }
    .report-sheet p, .monograph-report-block p { margin: 0; }
    .section-heading p { margin: 0.35rem 0 0; color: #667085; }
    .tab-active { background: #d9ebf7; color: #1e3a5f; box-shadow: inset 0 0 0 1px rgba(47, 107, 154, 0.2); }
    .monograph-report-block { display: grid; gap: 0.6rem; }
    .monograph-report-block h4 { margin: 0; color: #1e3a5f; }
    .observation-filter { max-width: 420px; }
    @media print { .pill-grid, app-header, app-sidebar, app-footer { display: none !important; } .surface { box-shadow: none; } }
  `,
})
export class ReportesVistaComponent {
  private readonly auth = inject(AutenticacionService);
  private readonly route = inject(ActivatedRoute);
  private readonly datos = inject(PortalDatosService);
  private readonly location = inject(Location);

  protected readonly role = computed(() => this.auth.currentRole() ?? 'Administrador');
    protected readonly reportMode = (this.route.snapshot.data['reportMode'] as 'subject' | 'monograph' | undefined) ?? 'subject';
    protected readonly period = this.route.snapshot.queryParamMap.get('periodo') ?? 'Segundo semestre 2026';
    protected readonly section = this.route.snapshot.queryParamMap.get('seccion') ?? '11-1';
   protected readonly student = 'José Luis Rodríguez Mora';
    protected readonly subject = this.route.snapshot.queryParamMap.get('asignatura') ?? 'Historia';
   protected readonly monograph = 'Lectura crítica y escritura argumentativa';
   protected readonly selectedObservation = computed(() => this.datos.monografias()[0]?.seguimientos.at(-1)?.observacion ?? 'Sin observaciones registradas.');
   protected readonly groupStudentCount = computed(() => this.datos.estudiantes().filter((item) => item['seccion'] === this.section).length);


  protected readonly individualColumns = [
    { key: 'asignatura', label: 'Asignatura' },
    { key: 'minimo', label: 'Valor mínimo' },
    { key: 'obtenido', label: 'Valor obtenido' },
    { key: 'ausentismo', label: 'Ausentismo' },
    { key: 'observaciones', label: 'Observaciones' },
  ];

  protected readonly monographReportColumns = [
    { key: 'area', label: 'Área' },
    { key: 'coordinador', label: 'Profesor Coordinador de Monografía' },
    { key: 'observaciones', label: 'Observaciones' },
  ];

    private readonly academic = computed(() => {
      const student = this.datos.estudiantes()[0];
      const evaluation = this.datos.evaluacion(student?.id ?? '');
      const attendance = this.datos.asistencia(student?.id ?? '');
      const monograph = this.datos.monografias()[0];
       return { student: { name: student?.['nombre'] ?? '', section: this.section, email: student?.['correo'] ?? '' }, absenteeism: { tardies: attendance.tardias, justifiedAbsences: attendance.justificadas, unjustifiedAbsences: attendance.injustificadas }, subjects: [{ subject: this.subject, minimumValue: this.subject === 'Estudios Sociales' ? '70' : '4', obtainedValue: evaluation.valor, observations: evaluation.observacion }], monographReport: monograph ? { area: monograph.area, coordinator: monograph.coordinador, observations: this.selectedObservation() } : undefined };
    });
    protected readonly professorReport = computed(() => this.academic());
    protected readonly guideReport = computed(() => this.academic());
    protected readonly monographReportRows = computed(() => { const report = this.academic().monographReport; return report ? [{ area: report.area, coordinador: report.coordinator, observaciones: report.observations }] : []; });

  protected readonly pageTitle = computed(() => {
    if (this.isCoordinator()) {
      return 'Reporte de monografía';
    }

    if (this.isGuide()) {
       return 'Reporte académico';
    }

    return 'Reporte académico individual';
  });

  protected readonly pageDescription = computed(() => {
    if (this.isCoordinator()) {
      return 'Seleccione periodo, estudiante y monografía para preparar el reporte correspondiente.';
    }

    if (this.isGuide()) {
      return 'Acceda a los reportes de su sección guía y consulte el detalle académico de cada estudiante.';
    }

    return 'Seleccione un estudiante y genere el reporte únicamente de la asignatura que imparte.';
  });

  protected professorRows() {
    const report = this.professorReport();

     return report.subjects.map((subject) => ({
      asignatura: subject.subject,
      minimo: subject.minimumValue,
      obtenido: subject.obtainedValue,
      ausentismo: this.etiquetaAusentismo(report.absenteeism),
      observaciones: subject.observations,
    }));
  }

  protected guideRows() {
    const report = this.guideReport();

    return report.subjects.map((subject) => ({
      asignatura: subject.subject,
      minimo: subject.minimumValue,
      obtenido: subject.obtainedValue,
      ausentismo: this.etiquetaAusentismo(report.absenteeism),
      observaciones: subject.observations,
    }));
  }

  protected isProfessor() {
    return this.reportMode === 'subject' && ['Profesor regular', 'Profesor Guía', 'Profesor Coordinador de Monografía'].includes(this.role());
  }

  protected isGuide() {
    return this.role() === 'Profesor Guía';
  }

  protected isCoordinator() {
    return this.role() === 'Profesor Coordinador de Monografía' && this.reportMode === 'monograph';
  }

  protected back(): void { this.location.back(); }
  protected print(): void { window.print(); }

  private etiquetaAusentismo(absenteeism: { tardies: number; justifiedAbsences: number; unjustifiedAbsences: number }) {
    return `T: ${absenteeism.tardies} · AJ: ${absenteeism.justifiedAbsences} · AI: ${absenteeism.unjustifiedAbsences}`;
  }
}
