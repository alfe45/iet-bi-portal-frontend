import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { AlertBannerComponent } from '../compartidos/componentes/banner-alerta.component';
import { DataTableComponent } from '../compartidos/componentes/tabla-datos.component';

@Component({
  selector: 'app-vista-reportes',
  imports: [AlertBannerComponent, DataTableComponent],
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
             <button type="button" class="ghost-button" disabled>← Volver</button>
            @if (isGuide()) {
               <button type="button" class="ghost-button" disabled>Académico individual</button>
               <button type="button" class="ghost-button" disabled>Consolidado de notas</button>
               <button type="button" class="ghost-button" disabled>General de sección</button>
            }

             <button type="button" class="primary-button" disabled>Vista previa</button>
          </div>
        </div>

        <div class="report-context"><strong>Periodo:</strong> {{ period }} <strong>Estudiante:</strong> {{ student }} <strong>Sección:</strong> {{ section }}</div>
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

       @if (isGuide() && guideMode === 'individual') {
        <app-alert-banner title="Reporte académico individual" message="Incluye automáticamente el reporte de monografía cuando el estudiante dispone de esa información." tone="success" />

        <section class="surface report-preview">
          <div class="report-header">
            <div>
              <p class="eyebrow">Vista previa</p>
              <h3>Reporte académico individual</h3>
            </div>
            <span class="tag">Profesor Guía</span>
          </div>

          <div class="report-sheet">
            <p><strong>Estudiante:</strong> {{ guideReport().student.name }}</p>
            <p><strong>Sección:</strong> {{ guideReport().student.section }}</p>
            <p><strong>Correo:</strong> {{ guideReport().student.email }}</p>
             <p><strong>Periodo:</strong> {{ period }}</p>
          </div>

          <app-data-table [columns]="individualColumns" [rows]="guideRows()" />

          @if (guideReport().monographReport; as report) {
            <article class="surface inset-surface monograph-report-block">
              <h4>REPORTE DE MONOGRAFÍA</h4>
              <p><strong>Área:</strong> {{ report.area }}</p>
              <p><strong>Supervisor:</strong> {{ report.supervisor }}</p>
              <p><strong>Observaciones:</strong></p>
              <p>{{ report.observations }}</p>
            </article>
          }
        </section>
      }

       @if (isGuide() && guideMode === 'consolidated') {
        <app-alert-banner title="Reporte consolidado de notas" message="Muestra en una sola tabla todos los estudiantes de la sección guía y todas sus asignaturas." tone="success" />

        <section class="surface report-preview">
          <div class="report-header">
            <div>
              <p class="eyebrow">Vista previa</p>
              <h3>Consolidado de notas de la sección guía</h3>
            </div>
            <span class="tag">Una sola tabla</span>
          </div>

          <app-data-table [columns]="consolidatedColumns" [rows]="consolidatedRows()" />
        </section>
      }

       @if (isGuide() && guideMode === 'section') {
        <app-alert-banner title="Reporte general de sección" message="Resume estudiantes, evaluaciones, ausentismo, observaciones académicas e información relevante de la sección guía." tone="success" />

        <section class="surface report-preview">
          <div class="report-header">
            <div>
              <p class="eyebrow">Vista previa</p>
              <h3>Reporte general de sección</h3>
            </div>
            <span class="tag">11-1</span>
          </div>

          <div class="report-sheet">
            <p><strong>Estudiantes:</strong> {{ sectionSummary().students }}</p>
            <p><strong>Evaluaciones:</strong> {{ sectionSummary().evaluations }}</p>
            <p><strong>Ausentismo:</strong> {{ sectionSummary().absenteeism }}</p>
            <p><strong>Observaciones académicas:</strong> {{ sectionSummary().observations }}</p>
            <p><strong>Información académica relevante:</strong> {{ sectionSummary().academicInfo }}</p>
          </div>
        </section>
      }

      @if (isCoordinator()) {
        <app-alert-banner title="Reporte de monografía" message="El Coordinador de monografía genera el reporte con área, profesor guía y observaciones. El Profesor Guía de sección puede consultarlo en modo lectura." tone="success" />

        <section class="surface report-preview">
          <div class="report-header">
            <div>
              <p class="eyebrow">Vista previa</p>
              <h3>REPORTE DE MONOGRAFÍA</h3>
            </div>
            <div class="pill-grid">
               <button type="button" class="ghost-button" disabled>Volver</button>
               <button type="button" class="primary-button" disabled>Vista previa</button>
            </div>
          </div>

           <p class="report-context"><strong>Observación:</strong> {{ selectedObservation }}</p>

          <div class="ascii-report">
            <p>---------------------------------------------------------</p>
            <p class="ascii-report__title">REPORTE DE MONOGRAFÍA</p>
            <p>---------------------------------------------------------</p>
          </div>

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
    .report-sheet p, .monograph-report-block p, .ascii-report p { margin: 0; }
    .section-heading p { margin: 0.35rem 0 0; color: #667085; }
    .tab-active { background: #d9ebf7; color: #1e3a5f; box-shadow: inset 0 0 0 1px rgba(47, 107, 154, 0.2); }
    .monograph-report-block { display: grid; gap: 0.6rem; }
    .monograph-report-block h4 { margin: 0; color: #1e3a5f; }
    .ascii-report { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #1e3a5f; }
    .ascii-report__title { font-weight: 800; text-align: center; }
    .observation-filter { max-width: 420px; }
  `,
})
export class ReportesVistaComponent {
  private readonly auth = inject(AutenticacionService);
  private readonly route = inject(ActivatedRoute);

  protected readonly role = computed(() => this.auth.currentRole() ?? 'Administrador');
   protected readonly guideMode = (this.route.snapshot.data['reportMode'] as 'individual' | 'consolidated' | 'section' | undefined) ?? 'individual';
   protected readonly period = '2026 | Segundo semestre';
   protected readonly section = '11-1';
   protected readonly student = 'Ana López';
   protected readonly subject = 'Historia';
   protected readonly monograph = 'Lectura crítica y escritura argumentativa';
   protected readonly selectedObservation = 'Se presenta a las secciones de supervisión con puntualidad. Estamos redactando la pregunta para iniciar con la introducción de la monografía, es un estudiante muy aplicado y responsable.';


  protected readonly individualColumns = [
    { key: 'asignatura', label: 'Asignatura' },
    { key: 'minimo', label: 'Valor mínimo' },
    { key: 'obtenido', label: 'Valor obtenido' },
    { key: 'ausentismo', label: 'Ausentismo' },
    { key: 'observaciones', label: 'Observaciones' },
  ];

  protected readonly consolidatedColumns = [
    { key: 'estudiante', label: 'Estudiante' },
    { key: 'matematica', label: 'Matemática' },
    { key: 'historia', label: 'Historia' },
    { key: 'lenguaB', label: 'Lengua B' },
    { key: 'estudiosSociales', label: 'Estudios Sociales' },
    { key: 'teoriaConocimiento', label: 'Teoría del Conocimiento' },
  ];

  protected readonly monographReportColumns = [
    { key: 'area', label: 'Área' },
    { key: 'supervisor', label: 'Supervisor' },
    { key: 'observaciones', label: 'Observaciones' },
  ];

    private readonly academic = { student: { name: 'Ana López', section: '11-1', email: 'ana.lopez@estudiante.edu' }, absenteeism: { tardies: 1, justifiedAbsences: 0, unjustifiedAbsences: 0 }, subjects: [{ subject: 'Historia', minimumValue: '4', obtainedValue: '6', observations: 'Buen análisis de fuentes.' }, { subject: 'Lengua B', minimumValue: '4', obtainedValue: '6', observations: 'Producción escrita consistente.' }], monographReport: { area: 'Lengua A', supervisor: 'Maya Quirós Paniagua', observations: this.selectedObservation } };
    protected readonly professorReport = computed(() => this.academic);
    protected readonly guideReport = computed(() => this.academic);
    protected readonly consolidatedRows = computed(() => [{ estudiante: 'Ana López', matematica: '6', historia: '6', lenguaB: '6', estudiosSociales: '85', teoriaConocimiento: 'B' }, { estudiante: 'Juan Mora', matematica: '4', historia: '6', lenguaB: '5', estudiosSociales: '90', teoriaConocimiento: 'C' }]);
    protected readonly sectionSummary = computed(() => ({ students: '2 mostrados de 29 registrados', evaluations: '10 registros de notas', absenteeism: '2 ausencias totales', observations: 'Predomina un buen desempeño general.', academicInfo: 'La sección mantiene estabilidad académica.' }));
    protected readonly monographReportRows = computed(() => [{ area: this.academic.monographReport.area, supervisor: this.academic.monographReport.supervisor, observaciones: this.selectedObservation }]);

  protected readonly pageTitle = computed(() => {
    if (this.isCoordinator()) {
      return 'Reporte de monografía';
    }

    if (this.isGuide()) {
       if (this.guideMode === 'consolidated') {
        return 'Reporte consolidado de notas';
      }

       if (this.guideMode === 'section') {
        return 'Reporte general de sección';
      }

      return 'Reporte académico individual';
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
    return this.role() === 'Profesor regular';
  }

  protected isGuide() {
    return this.role() === 'Profesor Guía';
  }

  protected isCoordinator() {
    return this.role() === 'Coordinador de monografía';
  }

  private etiquetaAusentismo(absenteeism: { tardies: number; justifiedAbsences: number; unjustifiedAbsences: number }) {
    return `T: ${absenteeism.tardies} · AJ: ${absenteeism.justifiedAbsences} · AI: ${absenteeism.unjustifiedAbsences}`;
  }
}
