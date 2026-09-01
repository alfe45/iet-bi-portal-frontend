import { Component, computed, inject } from '@angular/core';
import { DataTableComponent } from '../compartidos/componentes/tabla-datos.component';
import { StatGridComponent } from '../compartidos/componentes/cuadricula-estadisticas.component';

@Component({
  selector: 'app-vista-seccion-guia',
  imports: [StatGridComponent, DataTableComponent],
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
             <button type="button" class="ghost-button" disabled>← Volver</button>
             <button type="button" class="primary-button" disabled>Vista previa</button>
          </div>
        </div>

        <div class="hero-summary">
           <div><strong>Periodo:</strong> {{ guide.period }}</div>
           <div><strong>Sección:</strong> {{ guide.section }}</div>
           <div><strong>Nivel:</strong> {{ guide.level }}</div>
           <div><strong>Profesor guía:</strong> {{ guide.guideTeacher }}</div>
           <div><strong>Cantidad de estudiantes:</strong> {{ guide.count }}</div>
        </div>
      </section>

      <app-stat-grid [cards]="cards()" />

      <app-data-table [columns]="studentColumns" [rows]="studentRows()" />

      <section class="surface">
        <div class="section-heading">
          <div>
            <h3>Consulta integral del estudiante</h3>
            <p>El Profesor Guía consulta notas, ausentismo y reporte de monografía.</p>
          </div>
          <span class="tag">José Luis Rodríguez Mora</span>
        </div>

        <div class="split-grid">
          <article class="surface inset-surface">
            <h4>Datos generales</h4>
             <p><strong>Nombre:</strong> {{ detail.student.name }}</p>
             <p><strong>Cédula:</strong> {{ detail.student.id }}</p>
             <p><strong>Correo:</strong> {{ detail.student.email }}</p>
             <p><strong>Sección:</strong> {{ detail.student.section }}</p>
             <p><strong>Nivel:</strong> {{ detail.student.level }}</p>
          </article>

          <article class="surface inset-surface">
            <h4>Ausentismo</h4>
             <p><strong>Tardías:</strong> {{ detail.absenteeism.tardies }}</p>
             <p><strong>Ausencias justificadas:</strong> {{ detail.absenteeism.justifiedAbsences }}</p>
             <p><strong>Ausencias injustificadas:</strong> {{ detail.absenteeism.unjustifiedAbsences }}</p>
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

           @if (detail.monographReport; as report) {
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

           @if (detail.monographReport; as report) {
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
export class SeccionGuiaVistaComponent {
  protected readonly guide = { period: '2026 | Segundo semestre', section: '11-1', level: 'Undécimo', guideTeacher: 'Laura Vanessa Quirós Brenes', count: '29 estudiantes', students: [{ name: 'José Luis Rodríguez Mora', id: '8-734-401', email: 'jose.rodriguez@estudiante.edu', monograph: 'Lectura crítica y escritura argumentativa' }, { name: 'María Fernanda Jiménez Vargas', id: '8-811-109', email: 'maria.jimenez@estudiante.edu', monograph: 'Modelos de reciclaje escolar' }] };
  protected readonly student = 'José Luis Rodríguez Mora';
  protected readonly detail = { student: { name: 'José Luis Rodríguez Mora', id: '8-734-401', email: 'jose.rodriguez@estudiante.edu', section: '11-1', level: 'Undécimo' }, absenteeism: { tardies: 1, justifiedAbsences: 0, unjustifiedAbsences: 0 }, subjects: [{ subject: 'Matemática', minimumValue: '4', obtainedValue: '6', observations: 'Buen razonamiento y constancia.' }, { subject: 'Historia', minimumValue: '4', obtainedValue: '5', observations: 'Participa y relaciona hechos con criterio.' }], monographReport: { area: 'Lengua A', supervisor: 'Ana Lucía Solano Castro', monograph: 'Lectura crítica y escritura argumentativa', observations: 'Se presenta a las secciones de supervisión con puntualidad.' } };
  protected readonly cards = computed(() => [
     { label: 'Sección guía', value: this.guide.section, tone: 'primary' as const },
     { label: 'Estudiantes', value: this.guide.count, tone: 'success' as const },
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
     this.guide.students.map((student) => ({
      nombre: student.name,
      cedula: student.id,
      correo: student.email,
      monografia: student.monograph,
      acciones: ['Consultar detalle'],
    })),
  );

  protected performanceRows() {
     return this.detail.subjects.map((subject) => ({
      asignatura: subject.subject,
      minimo: subject.minimumValue,
      obtenido: subject.obtainedValue,
      observaciones: subject.observations,
       tardias: String(this.detail.absenteeism.tardies),
       justificadas: String(this.detail.absenteeism.justifiedAbsences),
       injustificadas: String(this.detail.absenteeism.unjustifiedAbsences),
    }));
  }

}
