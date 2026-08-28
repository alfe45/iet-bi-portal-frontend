import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { PrototypeDataService } from '../../core/data/prototype-data.service';
import { DataTableComponent, FilterSelectComponent, StatGridComponent } from '../../shared/components/ui-kit.component';

@Component({
  selector: 'app-guide-section-page',
  imports: [StatGridComponent, DataTableComponent, FilterSelectComponent],
  template: `
    <section class="page-grid">
      <section class="surface">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Vista específica</p>
            <h2>Mi sección guía</h2>
            <p>Consulte de forma centralizada el estado académico de la sección y el reporte de monografía de cada estudiante.</p>
          </div>
          <div class="pill-grid">
            <button type="button" class="ghost-button" (click)="goBack()">← Volver</button>
            <button type="button" class="primary-button">Generar reporte</button>
          </div>
        </div>

        <div class="hero-summary">
          <div><strong>Periodo:</strong> {{ guide().period }}</div>
          <div><strong>Sección:</strong> {{ guide().section }}</div>
          <div><strong>Nivel:</strong> {{ guide().level }}</div>
          <div><strong>Profesor guía:</strong> {{ guide().guideTeacher }}</div>
          <div><strong>Cantidad de estudiantes:</strong> {{ guide().count }}</div>
        </div>
      </section>

      <app-stat-grid [cards]="cards()" />

      <app-data-table [columns]="studentColumns" [rows]="studentRows()" />

      <section class="surface">
        <div class="section-heading">
          <div>
            <h3>Consulta integral del estudiante</h3>
            <p>El Profesor Guía consulta notas, ausentismo y reporte de monografía, pero no modifica esa información.</p>
          </div>
          <app-filter-select label="Seleccionar estudiante" [value]="student()" [options]="studentOptions" (selectionChange)="student.set($event)" />
        </div>

        <div class="split-grid">
          <article class="surface inset-surface">
            <h4>Datos generales</h4>
            <p><strong>Nombre:</strong> {{ detail().student.name }}</p>
            <p><strong>Cédula:</strong> {{ detail().student.id }}</p>
            <p><strong>Correo:</strong> {{ detail().student.email }}</p>
            <p><strong>Sección:</strong> {{ detail().student.section }}</p>
            <p><strong>Nivel:</strong> {{ detail().student.level }}</p>
          </article>

          <article class="surface inset-surface">
            <h4>Ausentismo</h4>
            <p><strong>Tardías:</strong> {{ detail().absenteeism.tardies }}</p>
            <p><strong>Ausencias justificadas:</strong> {{ detail().absenteeism.justifiedAbsences }}</p>
            <p><strong>Ausencias injustificadas:</strong> {{ detail().absenteeism.unjustifiedAbsences }}</p>
          </article>
        </div>
      </section>

      <app-data-table [columns]="performanceColumns" [rows]="performanceRows()" />

      <section class="split-grid">
        <article class="surface">
          <div class="section-heading">
            <h3>Monografía</h3>
            <span class="tag">Consulta</span>
          </div>

          @if (detail().monographReport; as report) {
            <p><strong>Título:</strong> {{ report.monograph }}</p>
            <p><strong>Área:</strong> {{ report.area }}</p>
            <p><strong>Supervisor:</strong> {{ report.supervisor }}</p>
            <p><strong>Observaciones:</strong></p>
            <p>{{ report.observations }}</p>
          } @else {
            <p>Este estudiante no tiene un reporte de monografía generado.</p>
          }
        </article>

        <article class="surface">
          <div class="section-heading">
            <h3>Reporte de monografía</h3>
            <span class="tag">Modo lectura</span>
          </div>

          @if (detail().monographReport; as report) {
            <div class="report-box">
              <h4>REPORTE DE MONOGRAFÍA</h4>
              <p><strong>Área:</strong> {{ report.area }}</p>
              <p><strong>Supervisor:</strong> {{ report.supervisor }}</p>
              <p><strong>Observaciones:</strong></p>
              <p>{{ report.observations }}</p>
            </div>
          } @else {
            <p>Sin reporte disponible.</p>
          }
        </article>
      </section>
    </section>
  `,
  styles: `
    .eyebrow { margin: 0 0 0.25rem; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.74rem; color: #2f6b9a; font-weight: 700; }
    .hero-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; }
    .report-box { display: grid; gap: 0.5rem; padding: 1rem; border-radius: 18px; background: linear-gradient(180deg, #fff, #f8fbfd); border: 1px solid #dfe7ef; }
    h4, p { margin: 0; }
  `,
})
export class GuideSectionPageComponent {
  private readonly data = inject(PrototypeDataService);
  private readonly location = inject(Location);

  protected readonly guide = computed(() => this.data.getGuideSectionData());
  protected readonly student = signal('Ana López');
  protected readonly studentOptions = this.guide().students.map((item) => ({ value: item.name, label: item.name }));
  protected readonly detail = computed(() => this.data.getStudentAcademicDetail(this.student())!);
  protected readonly cards = computed(() => [
    { label: 'Sección guía', value: this.guide().section, tone: 'primary' as const },
    { label: 'Estudiantes', value: this.guide().count, tone: 'success' as const },
    { label: 'Monografías con reporte', value: '3', tone: 'primary' as const },
    { label: 'Reportes disponibles', value: '3', tone: 'danger' as const },
  ]);
  protected readonly studentColumns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'cedula', label: 'Cédula' },
    { key: 'correo', label: 'Correo' },
    { key: 'monografia', label: 'Monografía' },
    { key: 'acciones', label: 'Acciones', type: 'actions' as const },
  ];
  protected readonly performanceColumns = [
    { key: 'asignatura', label: 'Asignatura' },
    { key: 'minimo', label: 'Valor mínimo' },
    { key: 'obtenido', label: 'Valor obtenido' },
    { key: 'observaciones', label: 'Observaciones' },
    { key: 'tardias', label: 'Tardías' },
    { key: 'justificadas', label: 'Ausencias justificadas' },
    { key: 'injustificadas', label: 'Ausencias injustificadas' },
  ];
  protected readonly studentRows = computed(() =>
    this.guide().students.map((student) => ({
      nombre: student.name,
      cedula: student.id,
      correo: student.email,
      monografia: student.monograph,
      acciones: ['Consultar detalle'],
    })),
  );

  protected performanceRows() {
    return this.detail().subjects.map((subject) => ({
      asignatura: subject.subject,
      minimo: subject.minimumValue,
      obtenido: subject.obtainedValue,
      observaciones: subject.observations,
      tardias: String(this.detail().absenteeism.tardies),
      justificadas: String(this.detail().absenteeism.justifiedAbsences),
      injustificadas: String(this.detail().absenteeism.unjustifiedAbsences),
    }));
  }

  protected goBack() {
    this.location.back();
  }
}
