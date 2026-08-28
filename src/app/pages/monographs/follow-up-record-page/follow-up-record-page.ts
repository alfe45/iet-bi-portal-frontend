import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrototypeDataService } from '../../../core/data/prototype-data.service';

@Component({
  selector: 'app-follow-up-record-page',
  imports: [RouterLink],
  template: `
    <section class="record-page" aria-labelledby="record-title">
      <header class="record-header">
        <div><p class="eyebrow">Monografías · Reportes</p><h2 id="record-title">Registrar reporte</h2><p>Documente el avance y los próximos pasos de una monografía asignada.</p></div>
        <button type="button" class="ghost-button" (click)="goBack()">← Volver</button>
      </header>

      <form class="record-form" (submit)="$event.preventDefault(); saved.set(true)" aria-describedby="form-help">
        <div class="form-intro"><span class="step">1</span><div><h3>Seleccione la monografía</h3><p id="form-help">Solo aparecen sus estudiantes asignados.</p></div></div>
        <label class="project-field"><span>Estudiante y monografía</span><select>@for(item of monographs;track item.id){<option>{{ item.student }} · {{ item.title }}</option>}</select></label>

        <div class="divider"></div>
        <div class="form-intro"><span class="step">2</span><div><h3>Registre el avance</h3><p>Indique el estado actual y deje una observación concreta.</p></div></div>
        <div class="form-grid">
          <label><span>Fecha</span><input type="date" value="2026-08-28" required /></label>
          <label><span>Estado</span><select required><option>Revisado</option><option>Pendiente</option><option>Aprobado</option></select></label>
          <label class="form-grid__full"><span>Observación</span><textarea rows="6" required placeholder="Describa los avances, acuerdos y próximos pasos"></textarea><small>Esta observación podrá incluirse posteriormente en el reporte de monografía.</small></label>
        </div>
          <div class="form-actions"><a class="ghost-button" routerLink="/monografias/reportes">Cancelar</a><button type="submit" class="primary-button">Guardar reporte</button></div>
        @if(saved()){<p class="success-message" role="status">Reporte registrado correctamente. Ya puede volver al historial.</p>}
      </form>
    </section>
  `,
  styles: `
    .record-page{display:grid;gap:1rem;max-width:980px}.record-header,.record-form{background:#fff;border:1px solid #dbe5ef;border-radius:12px;padding:1.35rem}.record-header{display:flex;justify-content:space-between;align-items:center;gap:1rem}h2,h3,p{margin:0}.record-header p,.form-intro p{color:#667085;margin-top:.3rem}.eyebrow{color:#2f6b9a!important;text-transform:uppercase;letter-spacing:.1em;font-size:.74rem;font-weight:800}.record-form{display:grid;gap:1.25rem;border-top:4px solid #2f6b9a}.form-intro{display:flex;align-items:flex-start;gap:.75rem}.step{width:30px;height:30px;display:grid;place-items:center;flex:none;border-radius:50%;background:#1e3a5f;color:#fff;font-weight:800}.project-field{max-width:680px}.record-form label{display:grid;gap:.45rem;font-weight:700}.divider{height:1px;background:#e1e8ee}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.form-grid__full{grid-column:1/-1}.form-grid small{color:#667085;font-weight:400}.form-actions{display:flex;justify-content:flex-end;gap:.75rem;padding-top:.4rem}.success-message{padding:.9rem;background:#eef7f0;color:#245d29;border:1px solid #c8e2cd;border-radius:9px}@media(max-width:650px){.record-header{align-items:flex-start;flex-direction:column}.form-grid{grid-template-columns:1fr}.form-grid__full{grid-column:auto}.form-actions{flex-direction:column}.form-actions>*{width:100%}}
  `,
})
export class FollowUpRecordPage {
  private readonly location=inject(Location);private readonly data=inject(PrototypeDataService);protected readonly saved=signal(false);protected readonly monographs=this.data.getMonographs();protected goBack(){this.location.back()}
}
