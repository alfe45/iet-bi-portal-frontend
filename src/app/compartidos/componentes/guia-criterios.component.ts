import { Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GuiaConsultaService } from '../../nucleo/datos/guia-consulta.service';

/** Criterios de las vistas del Profesor Guía: curso lectivo, sección guía y, si aplica, semestre (RD-054, RD-055, RD-056). */
@Component({
  selector: 'app-guia-criterios',
  imports: [FormsModule],
  template: `
    <section class="criteria no-print" aria-label="Criterios de consulta">
      <label><small>Curso lectivo</small><select [ngModel]="guia.anio()" (ngModelChange)="guia.cambiarAnio($event)" aria-label="Curso lectivo a consultar">@if (!guia.anio()) {<option [ngValue]="null" disabled>Elegir…</option>}@for (anio of guia.aniosDisponibles(); track anio) {<option [ngValue]="anio">{{ anio }}</option>}</select></label>
      <label><small>Sección guía</small><select [ngModel]="guia.clave(guia.seccionActual())" (ngModelChange)="guia.seleccionarSeccion($event)" [disabled]="!guia.secciones().length" aria-label="Sección guía">@for (section of guia.secciones(); track guia.clave(section)) {<option [value]="guia.clave(section)">{{ section.nombre }}</option>} @empty {<option value="">Sin sección</option>}</select></label>
      @if (conSemestre()) {<label><small>Semestre</small><select [ngModel]="guia.semestre()" (ngModelChange)="guia.cambiarSemestre($event)" aria-label="Semestre a consultar"><option value="I_SEMESTRE">Primer semestre</option><option value="II_SEMESTRE">Segundo semestre</option></select></label>}
    </section>
    @if (!guia.seccionActual()) {<p class="criteria-empty" [class.criteria-error]="guia.error()" role="status">{{ guia.mensajeSinSeccion() }}</p>}
  `,
  styles: `
    .criteria{display:flex;gap:.7rem;flex-wrap:wrap;align-items:flex-end;padding:.8rem 1.1rem;margin-bottom:1rem;background:#fff;border:1px solid #dbe5ef;border-radius:8px}
    .criteria label{display:grid;gap:.2rem;color:#667085;font-size:.75rem;font-weight:700}.criteria select{min-height:34px;min-width:120px;padding:.3rem .5rem;border:1px solid #cfd9e3;border-radius:6px}
    .criteria-empty{margin:0 0 1rem;padding:.8rem 1.1rem;background:#fff;border:1px solid #dbe5ef;border-radius:8px;color:#667085}.criteria-error{color:#b42318}
  `,
})
export class GuiaCriteriosComponent {
  protected readonly guia = inject(GuiaConsultaService);
  readonly conSemestre = input(true);
  constructor() { this.guia.iniciar(); }
}
