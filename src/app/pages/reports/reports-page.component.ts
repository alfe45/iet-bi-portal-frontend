import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PrototypeDataService } from '../../core/data/prototype-data.service';
import { AlertBannerComponent, DataTableComponent, FilterSelectComponent } from '../../shared/components/ui-kit.component';

@Component({
  selector: 'app-reports-page',
  imports: [FilterSelectComponent, AlertBannerComponent, DataTableComponent],
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
            <button type="button" class="ghost-button" (click)="goBack()">← Volver</button>
            @if (isGuide()) {
              <button type="button" class="ghost-button" [class.tab-active]="guideMode() === 'individual'" (click)="guideMode.set('individual')">Académico individual</button>
              <button type="button" class="ghost-button" [class.tab-active]="guideMode() === 'consolidated'" (click)="guideMode.set('consolidated')">Consolidado de notas</button>
              <button type="button" class="ghost-button" [class.tab-active]="guideMode() === 'section'" (click)="guideMode.set('section')">General de sección</button>
            }

            <button type="button" class="primary-button">Generar reporte</button>
          </div>
        </div>

        <div class="filters-row">
          <app-filter-select label="Periodo" [value]="period()" [options]="periodOptions" (selectionChange)="period.set($event)" />

          @if (isCoordinator()) {
            <app-filter-select label="Estudiante" [value]="student()" [options]="studentOptions()" (selectionChange)="onStudentChange($event)" />
            <app-filter-select label="Monografía" [value]="monograph()" [options]="monographOptions()" (selectionChange)="monograph.set($event)" />
          } @else {
            <app-filter-select label="Sección" [value]="section()" [options]="sectionOptions" (selectionChange)="section.set($event)" />
            <app-filter-select label="Estudiante" [value]="student()" [options]="studentOptions()" (selectionChange)="onStudentChange($event)" />
            @if (isProfessor()) {
              <app-filter-select label="Mi asignatura" [value]="subject()" [options]="subjectOptions" (selectionChange)="subject.set($event)" />
            }
          }
        </div>
      </section>

      @if (isProfessor()) {
        <section class="surface report-preview">
          <div class="report-header">
            <div>
              <p class="eyebrow">Vista previa</p>
              <h3>Reporte de {{ subject() }}</h3>
            </div>
            <span class="tag">Documento</span>
          </div>

          <div class="report-sheet">
            <p><strong>Estudiante:</strong> {{ professorReport().student.name }}</p>
            <p><strong>Sección:</strong> {{ professorReport().student.section }}</p>
            <p><strong>Periodo:</strong> {{ period() }}</p>
          </div>

          <app-data-table [columns]="individualColumns" [rows]="professorRows()" />
        </section>
      }

      @if (isGuide() && guideMode() === 'individual') {
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
            <p><strong>Periodo:</strong> {{ period() }}</p>
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

      @if (isGuide() && guideMode() === 'consolidated') {
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

      @if (isGuide() && guideMode() === 'section') {
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
        <app-alert-banner title="Reporte de monografía" message="El Profesor Guía de Monografía genera el reporte con área, profesor guía y observaciones. El Profesor Guía de sección puede consultarlo en modo lectura." tone="success" />

        <section class="surface report-preview">
          <div class="report-header">
            <div>
              <p class="eyebrow">Vista previa</p>
              <h3>REPORTE DE MONOGRAFÍA</h3>
            </div>
            <div class="pill-grid">
              <button type="button" class="ghost-button">Volver</button>
              <button type="button" class="primary-button">Generar reporte</button>
            </div>
          </div>

          <div class="filters-row observation-filter">
            <app-filter-select label="Observación del reporte" [value]="selectedObservation()" [options]="observationOptions()" (selectionChange)="selectedObservation.set($event)" />
          </div>

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
export class ReportsPageComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly data = inject(PrototypeDataService);

  protected readonly role = computed(() => this.auth.currentRole() ?? 'Administrador');
  protected readonly guideMode = signal<'individual' | 'consolidated' | 'section'>(
    (this.route.snapshot.data['reportMode'] as 'individual' | 'consolidated' | 'section' | undefined) ?? 'individual',
  );
  protected readonly period = signal('2026 | Segundo semestre');
  protected readonly section = signal('11-1');
  protected readonly student = signal('Ana López');
  protected readonly subject = signal('Historia');
  protected readonly monograph = signal('Lectura crítica y escritura argumentativa');
  protected readonly selectedObservation = signal(
    'Se presenta a las secciones de supervisión con puntualidad. Estamos redactando la pregunta para iniciar con la introducción de la monografía, es un estudiante muy aplicado y responsable.',
  );

  protected readonly periodOptions = this.data.getPeriods().map((value) => ({ value, label: value }));
  protected readonly sectionOptions = this.data.getSections().map((value) => ({ value, label: value }));
  protected readonly subjectOptions = [
    { value: 'Historia', label: 'Historia' },
    { value: 'Estudios Sociales', label: 'Estudios Sociales' },
  ];
  protected readonly studentOptions = computed(() => {
    const values = this.isCoordinator() ? this.data.getGuideStudents() : this.isGuide() ? this.data.getGuideStudents() : this.data.getProfessorStudents();
    return values.map((value) => ({ value, label: value }));
  });

  protected readonly monographOptions = computed(() => {
    const options = this.data
      .getMonographs()
      .filter((item) => item.student === this.student())
      .map((item) => ({ value: item.title, label: item.title }));

    return options.length ? options : [{ value: 'Sin monografía', label: 'Sin monografía' }];
  });

  protected readonly observationOptions = computed(() =>
    this.data.getCoordinatorMonographReport(this.student()).observations.map((item) => ({ value: item.value, label: item.label })),
  );

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

  protected readonly professorReport = computed(() => this.data.getProfessorIndividualReport(this.student()));
  protected readonly guideReport = computed(() => this.data.getGuideIndividualReport(this.student()));
  protected readonly consolidatedRows = computed(() => this.data.getGuideConsolidatedRows(this.section()));
  protected readonly sectionSummary = computed(() => this.data.getGuideSectionSummary(this.section()));
  protected readonly monographReportRows = computed(() => this.data.getMonographReportTable(this.student(), this.selectedObservation()));

  protected readonly pageTitle = computed(() => {
    if (this.isCoordinator()) {
      return 'Reporte de monografía';
    }

    if (this.isGuide()) {
      if (this.guideMode() === 'consolidated') {
        return 'Reporte consolidado de notas';
      }

      if (this.guideMode() === 'section') {
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

    return report.subjects.filter((item) => item.subject === this.subject()).map((subject) => ({
      asignatura: subject.subject,
      minimo: subject.minimumValue,
      obtenido: subject.obtainedValue,
      ausentismo: this.absenteeismLabel(report.absenteeism),
      observaciones: subject.observations,
    }));
  }

  protected guideRows() {
    const report = this.guideReport();

    return report.subjects.map((subject) => ({
      asignatura: subject.subject,
      minimo: subject.minimumValue,
      obtenido: subject.obtainedValue,
      ausentismo: this.absenteeismLabel(report.absenteeism),
      observaciones: subject.observations,
    }));
  }

  protected onStudentChange(student: string) {
    this.student.set(student);
    this.monograph.set(this.monographOptions()[0]?.value ?? 'Sin monografía');
    this.selectedObservation.set(this.observationOptions()[0]?.value ?? 'Sin observaciones registradas.');
  }

  protected isProfessor() {
    return this.role() === 'Profesor';
  }

  protected isGuide() {
    return this.role() === 'Profesor Guía';
  }

  protected isCoordinator() {
    return this.role() === 'Profesor Guía de Monografía';
  }

  protected goBack() {
    this.location.back();
  }

  private absenteeismLabel(absenteeism: { tardies: number; justifiedAbsences: number; unjustifiedAbsences: number }) {
    return `T: ${absenteeism.tardies} · AJ: ${absenteeism.justifiedAbsences} · AI: ${absenteeism.unjustifiedAbsences}`;
  }
}
