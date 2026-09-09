import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FilaReporteBandas {
  asignatura: string;
  bandaMinima: string;
  bandaAlcanzada: string;
  tardias: string;
  injustificadas: string;
  justificadas: string;
  observaciones: string;
}

export interface FilaReporteNumerico {
  asignatura: string;
  notaMinima: string;
  notaAlcanzada: string;
  tardias: string;
  injustificadas: string;
  justificadas: string;
  observaciones: string;
}

export interface DocumentoReporteBandas {
  estudiante: string;
  identificacion: string;
  seccion: string;
  nivel: string;
  periodo: string;
  anio: string;
  filas: FilaReporteBandas[];
  teoriaConocimiento: { bandaAlcanzada: string; tardias: string; injustificadas: string; justificadas: string; observaciones: string };
  reporteMonografia: { area: string; coordinador: string; observaciones: string };
  filasNumericas: FilaReporteNumerico[];
}

@Component({
  selector: 'app-reporte-bandas-estudiante',
  imports: [CommonModule],
  template: `
    <article class="report-page" aria-label="Reporte de bandas del estudiante">
      <header class="institution-header">
        <img class="logo logo-mep" src="/assets/logos/mep.png" alt="Ministerio de Educación Pública" />
        <div class="institution-copy">
          <strong>MINISTERIO DE EDUCACIÓN PÚBLICA</strong>
          <span>DIRECCIÓN REGIONAL DE EDUCACIÓN TURRIALBA</span>
          <span>INSTITUTO DE EDUCACIÓN DR. CLODOMIRO PICADO TWIGHT</span>
          <b>REPORTE DE BANDAS DEL {{ report().periodo | uppercase }} {{ report().anio }} {{ report().nivel | uppercase }}</b>
        </div>
        <div class="institution-logos">
          <img class="logo logo-clodomiro" src="/assets/logos/clodomiro-picado.png" alt="Instituto de Educación Dr. Clodomiro Picado" />
          <img class="logo logo-ib" src="/assets/logos/ib.png" alt="International Baccalaureate" />
        </div>
      </header>

      <table class="student-meta">
         <colgroup><col /><col /><col /><col /><col /><col /></colgroup>
        <tbody>
          <tr><th>Nombre del estudiante</th><td>{{ report().estudiante }}</td><th>Identificación</th><td>{{ report().identificacion }}</td><th>Sección</th><td>{{ report().seccion }}</td></tr>
        </tbody>
       </table>
       <table class="bands-table">
        <caption>Reporte general de notas por asignatura</caption>
        <colgroup><col class="col-subject" /><col class="col-min" /><col class="col-achieved" /><col class="col-absence" /><col class="col-absence" /><col class="col-absence" /><col class="col-observations" /></colgroup>
        <thead>
          <tr>
            <th rowspan="2">Asignatura</th>
            <th rowspan="2">Banda<br />mínima</th>
            <th rowspan="2">Banda alcanzada</th>
            <th colspan="3">Ausentismo</th>
            <th rowspan="2" class="observations-heading">Observaciones del profesor</th>
          </tr>
          <tr class="vertical-headings"><th>Tardías</th><th>Injustificadas</th><th>Justificadas</th></tr>
        </thead>
        <tbody>
          @for (row of report().filas; track row.asignatura) {
            <tr>
              <td>{{ row.asignatura }}</td>
              <td class="center">{{ row.bandaMinima }}</td>
              <td class="center">{{ row.bandaAlcanzada }}</td>
              <td class="center">{{ row.tardias }}</td>
              <td class="center">{{ row.injustificadas }}</td>
              <td class="center">{{ row.justificadas }}</td>
              <td class="observations">{{ row.observaciones }}</td>
            </tr>
          } @empty {
            <tr><td class="empty" colspan="7">No hay asignaturas registradas para este estudiante.</td></tr>
          }
        </tbody>
       </table>

       <section class="continuation-block theory-block">
         <h2>TEORÍA DEL CONOCIMIENTO</h2>
         <p class="scale-note">Bandas posibles: A (más alta), B, C, D, E (la más baja)</p>
         <table><thead><tr><th>Banda alcanzada</th><th colspan="3">Ausentismo</th><th>Observaciones</th></tr><tr><th></th><th>Tardías</th><th>Injustificadas</th><th>Justificadas</th><th></th></tr></thead><tbody><tr><td class="center">{{ report().teoriaConocimiento.bandaAlcanzada }}</td><td class="center">{{ report().teoriaConocimiento.tardias }}</td><td class="center">{{ report().teoriaConocimiento.injustificadas }}</td><td class="center">{{ report().teoriaConocimiento.justificadas }}</td><td class="observations">{{ report().teoriaConocimiento.observaciones }}</td></tr></tbody></table>
       </section>

       <section class="continuation-block monograph-block">
         <h2>REPORTE DE MONOGRAFÍA</h2>
         <table><thead><tr><th>Área</th><th>Profesor Coordinador de Monografía</th><th>Observaciones</th></tr></thead><tbody><tr><td>{{ report().reporteMonografia.area }}</td><td>{{ report().reporteMonografia.coordinador }}</td><td class="observations">{{ report().reporteMonografia.observaciones }}</td></tr></tbody></table>
       </section>

       <section class="continuation-block numeric-block">
         <h2>ASIGNATURAS DEL MEP</h2>
         <table><thead><tr><th>Asignatura</th><th>Nota mínima</th><th>Nota alcanzada</th><th colspan="3">Ausentismo</th><th>Observaciones del profesor</th></tr><tr><th></th><th></th><th></th><th>Tardías</th><th>Injustificadas</th><th>Justificadas</th><th></th></tr></thead><tbody>@for (row of report().filasNumericas; track row.asignatura) {<tr><td>{{ row.asignatura }}</td><td class="center">{{ row.notaMinima }}</td><td class="center">{{ row.notaAlcanzada }}</td><td class="center">{{ row.tardias }}</td><td class="center">{{ row.injustificadas }}</td><td class="center">{{ row.justificadas }}</td><td class="observations">{{ row.observaciones }}</td></tr>} @empty {<tr><td class="empty" colspan="7">No hay asignaturas con escala numérica registradas.</td></tr>}</tbody></table>
       </section>
    </article>
  `,
  styles: `
    :host { display: block; color: #111; font-family: Arial, Helvetica, sans-serif; }
    .report-page { width: 100%; max-width: 190mm; margin: 0 auto; padding: 0; background: #fff; color: #111; }
    .institution-header { display: grid; grid-template-columns: 27mm 1fr 38mm; align-items: center; min-height: 28mm; border: 1px solid #222; border-bottom: 0; }
    .logo { display: block; object-fit: contain; }
    .logo-mep { width: 23mm; max-height: 22mm; margin: auto; }
    .institution-copy { display: grid; align-content: center; text-align: center; border-left: 1px solid #222; border-right: 1px solid #222; min-height: 28mm; line-height: 1.2; font-size: 9pt; }
    .institution-copy strong { font-size: 10pt; }.institution-copy span { font-weight: 700; }.institution-copy b { margin-top: 1mm; font-size: 10pt; }
    .institution-logos { display: grid; grid-template-columns: 1fr 1fr; align-items: center; justify-items: center; height: 100%; padding: 1mm 2mm; }
    .logo-clodomiro { width: 14mm; height: 22mm; }.logo-ib { width: 14mm; height: 22mm; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 8.5pt; }
    th, td { border: 1px solid #222; padding: 2.2mm 1.5mm; vertical-align: middle; }
    .student-meta { border: 1px solid #222; }.student-meta col:nth-child(1) { width: calc(27mm + 1px); }.student-meta col:nth-child(2) { width: 34mm; }.student-meta col:nth-child(3) { width: 29mm; }.student-meta col:nth-child(4) { width: 34mm; }.student-meta col:nth-child(5) { width: calc(28mm - 2px); }.student-meta col:nth-child(6) { width: 38mm; }.student-meta th { text-align: left; font-weight: 700; }.student-meta td { font-weight: 600; overflow-wrap: anywhere; }
    .bands-table { margin-top: 0; }.bands-table caption { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
    .bands-table th { text-align: center; font-weight: 700; }.bands-table thead tr:first-child th { height: 13mm; }.col-subject { width: calc(27mm + 1px); }.col-min { width: 19mm; }.col-achieved { width: 30.4mm; }.col-absence { width: 11.4mm; }.col-observations { width: calc(79.4mm - 1px); }
    .vertical-headings th { height: 17mm; padding: 0; vertical-align: middle; }.vertical-headings th { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; font-size: 7pt; line-height: 1; }
     .center { text-align: center; }.observations { text-align: left; white-space: normal; overflow-wrap: anywhere; line-height: 1.2; }.empty { text-align: center; padding: 7mm; }
     .continuation-block { margin-top: 8mm; }.continuation-block h2 { margin: 0; padding: 3mm; border: 1px solid #222; border-bottom: 0; text-align: center; font-size: 10pt; }.continuation-block table th { text-align: left; }.continuation-block table td { vertical-align: top; }.continuation-block table th:not(:last-child),.continuation-block table td:not(:last-child) { text-align: left; }.continuation-block .center { text-align: center; }.scale-note { margin: 0; padding: 2mm 3mm; border-left: 1px solid #222; border-right: 1px solid #222; font-size: 8pt; font-style: italic; }.theory-block table th,.numeric-block table th { text-align: center; }
    @media print {
      .report-page { max-width: none; margin: 0; padding: 0; break-after: page; page-break-after: always; }
      :host:last-child .report-page, .report-page:last-child { break-after: auto; page-break-after: auto; }
      .reports-preview--all app-reporte-bandas-estudiante:last-child .report-page { break-after: auto; page-break-after: auto; }
      .bands-table tr { break-inside: avoid; page-break-inside: avoid; }
    }
  `,
})
export class ReporteBandasEstudianteComponent {
  report = input.required<DocumentoReporteBandas>();
}
