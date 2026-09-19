import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MonografiaLocal, PortalDatosService, SeguimientoLocal } from '../nucleo/datos/portal-datos.service';

type MonographTab = 'information' | 'follow-ups' | 'report';

@Component({
  selector: 'app-vista-detalle-monografia',
  imports: [FormsModule, RouterLink],
  template: `
    @if(monograph(); as item){
      <section class="page-grid">
        <header class="surface detail-header"><div><p class="eyebrow">Monografía del estudiante</p><h2>{{ item.estudiante }}</h2><h3>{{ item.titulo }}</h3><p>{{ item.area }} · Segundo semestre 2026</p></div><div class="header-actions"><span class="tag">{{ item.estado }}</span><a class="ghost-button" routerLink="/monografias">Volver</a></div></header>
        <nav class="surface tabs" aria-label="Secciones de la monografía"><button type="button" [class.active]="tab() === 'information'" (click)="tab.set('information')">Información</button><button type="button" [class.active]="tab() === 'follow-ups'" (click)="tab.set('follow-ups')">Seguimientos</button><button type="button" [class.active]="tab() === 'report'" (click)="tab.set('report')">Reporte</button></nav>

        @if(tab() === 'information') {
          <section class="surface content"><div class="section-heading"><div><h3>Información de la monografía</h3><p>Datos del estudiante y del proyecto asignado.</p></div><button type="button" class="primary-button" (click)="editingInfo = !editingInfo">{{ editingInfo ? 'Cancelar edición' : 'Editar información' }}</button></div>
            @if(editingInfo){<form (ngSubmit)="guardarMonografia()"><div class="form-grid"><label>Estudiante<input name="estudiante" [(ngModel)]="draft.estudiante" required /></label><label>Título<input name="titulo" [(ngModel)]="draft.titulo" required /></label><label>Área<input name="area" [(ngModel)]="draft.area" required /></label><label>Estado<select name="estado" [(ngModel)]="draft.estado"><option>En desarrollo</option><option>Aprobada</option></select></label><label>Fecha de inicio<input name="fechaInicio" type="date" [(ngModel)]="draft.fechaInicio" required /></label><label>Profesor Coordinador de Monografía<input name="coordinador" [(ngModel)]="draft.coordinador" required /></label><label class="full">Descripción<textarea name="descripcion" rows="3" [(ngModel)]="draft.descripcion" required></textarea></label><label class="full">Observación del reporte<textarea name="observacionReporte" rows="3" [(ngModel)]="draft.observacionReporte" required></textarea></label></div><div class="actions"><button type="submit" class="primary-button">Guardar información</button></div></form>}
            @else {<dl class="information-grid"><div><dt>Estudiante</dt><dd>{{ item.estudiante }}</dd></div><div><dt>Título</dt><dd>{{ item.titulo }}</dd></div><div><dt>Área</dt><dd>{{ item.area }}</dd></div><div><dt>Estado</dt><dd>{{ item.estado }}</dd></div><div><dt>Fecha de inicio</dt><dd>{{ item.fechaInicio }}</dd></div><div><dt>Profesor Coordinador de Monografía</dt><dd>{{ item.coordinador }}</dd></div><div class="full"><dt>Descripción</dt><dd>{{ item.descripcion }}</dd></div></dl>}
          </section>
        }

        @if(tab() === 'follow-ups') {
          <section class="surface content"><div class="section-heading"><div><h3>Seguimientos</h3><p>Historial cronológico de acompañamiento para {{ item.estudiante }}.</p></div><button type="button" class="primary-button" (click)="showFollowUp = true">Registrar seguimiento</button></div>
            @if(showFollowUp){<form class="follow-up-form" (ngSubmit)="guardarSeguimiento()"><h4>Nuevo seguimiento</h4><div class="form-grid"><label>Fecha<input name="fecha" type="date" [(ngModel)]="followUp.fecha" required /></label><label>Estado<select name="estadoSeguimiento" [(ngModel)]="followUp.estado"><option>Revisado</option><option>Pendiente</option><option>Con correcciones</option></select></label><label class="full">Observación<textarea name="observacion" rows="3" [(ngModel)]="followUp.observacion" required></textarea></label></div><div class="actions"><button type="button" class="ghost-button" (click)="cancelarSeguimiento()">Cancelar</button><button type="submit" class="primary-button">Guardar seguimiento</button></div></form>}
            <ol class="timeline">@for(followUp of item.seguimientos.slice().sort(byDateDescending); track followUp.id){<li><article><div class="follow-up-meta"><time>{{ followUp.fecha }}</time><span class="tag">{{ followUp.estado }}</span></div><p>“{{ followUp.observacion }}”</p><small>Profesor Coordinador: {{ followUp.profesor }}</small></article></li>} @empty {<li class="empty">Sin seguimientos registrados.</li>}</ol>
          </section>
        }

        @if(tab() === 'report') {
          <section class="surface content"><div class="section-heading"><div><h3>Reporte de monografía</h3><p>Vista previa del bloque que estará disponible para el Profesor Guía.</p></div><button type="button" class="ghost-button" (click)="print()">Imprimir</button></div><article class="monograph-report"><h4>REPORTE DE MONOGRAFÍA</h4><dl><div><dt>Estudiante</dt><dd>{{ item.estudiante }}</dd></div><div><dt>Área</dt><dd>{{ item.area }}</dd></div><div><dt>Profesor Coordinador de Monografía</dt><dd>{{ item.coordinador }}</dd></div><div><dt>Observaciones</dt><dd>{{ item.observacionReporte || 'Sin observaciones de reporte registradas.' }}</dd></div></dl></article></section>
        }
      </section>
    } @else {<section class="surface"><h2>Monografía no encontrada</h2><a class="ghost-button" routerLink="/monografias">Volver a estudiantes</a></section>}
  `,
  styles: `
    .eyebrow{margin:0 0 .25rem;text-transform:uppercase;letter-spacing:.12em;font-size:.74rem;color:#2f6b9a;font-weight:700}.detail-header{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;border-left:5px solid #2f6b9a}.detail-header h2,.detail-header h3,.detail-header p{margin:0}.detail-header h3{margin-top:.3rem;color:#2f6b9a}.detail-header p:last-child{margin-top:.35rem;color:#667085}.header-actions{display:flex;align-items:center;gap:.6rem}.tabs{display:flex;gap:.4rem;padding:.45rem}.tabs button{padding:.7rem 1rem;border:0;border-radius:6px;background:transparent;color:#667085;font-weight:700;cursor:pointer}.tabs button.active{background:#e8f1f7;color:#1e3a5f}.content{display:grid;gap:1rem}.section-heading{margin:0}.information-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin:0}.information-grid>div{padding:.8rem;border:1px solid #dbe5ef;border-radius:8px}.information-grid .full{grid-column:1/-1}.information-grid dt,.monograph-report dt{font-size:.74rem;color:#667085}.information-grid dd,.monograph-report dd{margin:.25rem 0 0;color:#1e3a5f;font-weight:600}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.form-grid label{display:grid;gap:.4rem;font-weight:700}.form-grid .full{grid-column:1/-1}.actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem}.follow-up-form{padding:1rem;border:1px solid #b9d3e5;border-radius:9px;background:#f8fbfd}.timeline{display:grid;gap:1rem;margin:0;padding-left:1.5rem}.timeline article{display:grid;gap:.5rem;padding:1rem;border:1px solid #dbe5ef;border-radius:9px}.follow-up-meta{display:flex;justify-content:space-between;align-items:center}.timeline p{margin:0}.timeline small{color:#667085}.monograph-report{display:grid;gap:1rem;padding:1.25rem;border:1px solid #222;border-top:5px solid #2f6b9a;background:#fff}.monograph-report h4{margin:0;text-align:center;letter-spacing:.08em}.monograph-report dl{display:grid;gap:.9rem;margin:0}.empty{color:#667085}@media(max-width:700px){.detail-header,.header-actions,.section-heading{align-items:flex-start;flex-direction:column}.information-grid,.form-grid{grid-template-columns:1fr}.information-grid .full,.form-grid .full{grid-column:auto}.tabs{overflow:auto}.tabs button{white-space:nowrap}}
  `,
})
// Muestra el detalle de una monografía seleccionada.
export class DetalleMonografiaVistaComponent {
  private readonly datos = inject(PortalDatosService);
  private readonly location = inject(Location);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly monograph = computed(() => this.datos.monografia(this.id));
  protected readonly tab = signal<MonographTab>('information');
  protected editingInfo = false;
  protected showFollowUp = false;
  protected draft = { ...(this.monograph() ?? { id: '', estudiante: '', titulo: '', area: '', coordinador: '', estado: 'En desarrollo', fechaInicio: '', descripcion: '', observacionReporte: '', seguimientos: [] }) };
  protected followUp = this.emptyFollowUp();
  protected readonly byDateDescending = (a: SeguimientoLocal, b: SeguimientoLocal): number => b.fecha.localeCompare(a.fecha);

  protected guardarMonografia(): void { const current = this.monograph(); if (!current) return; this.datos.guardarMonografia({ ...current, ...this.draft, seguimientos: current.seguimientos }); this.editingInfo = false; }
  protected guardarSeguimiento(): void { if (!this.followUp.observacion.trim()) return; const item = this.monograph(); if (!item) return; this.datos.agregarSeguimiento(item.id, { ...this.followUp, profesor: item.coordinador }); this.showFollowUp = false; this.followUp = this.emptyFollowUp(); }
  protected cancelarSeguimiento(): void { this.showFollowUp = false; this.followUp = this.emptyFollowUp(); }
  protected print(): void { window.print(); }
  private emptyFollowUp(): { fecha: string; estado: string; observacion: string } { return { fecha: new Date().toISOString().slice(0, 10), estado: 'Revisado', observacion: '' }; }
}
