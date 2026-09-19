import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortalDatosService } from '../nucleo/datos/portal-datos.service';

@Component({
  selector: 'app-follow-ups-page',
  imports: [RouterLink],
  template: `
    <section class="page"><header class="surface section-heading"><div><p class="eyebrow">Monografías</p><h2>Historial de seguimientos</h2><p>Seleccione un proyecto para consultar su historial.</p></div><a class="primary-button" routerLink="/monografias">Volver a proyectos</a></header><div class="layout"><nav class="surface results" aria-label="Monografías">@for(item of monographs();track item.id){<button type="button" class="result" [class.selected]="item.id===selectedId()" (click)="selectedId.set(item.id)"><span class="avatar">{{ initials(item.estudiante) }}</span><span><strong>{{ item.estudiante }}</strong><small>{{ item.titulo }}</small><em>{{ item.seguimientos.length }} seguimientos</em></span></button>}</nav>@if(selected();as item){<section class="surface history"><div class="section-heading"><div><h3>{{ item.estudiante }}</h3><p>{{ item.titulo }} · {{ item.area }}</p></div><a class="ghost-button" [routerLink]="['/monografias',item.id]">Editar y registrar</a></div><ol>@for(followUp of item.seguimientos.slice().reverse();track followUp.id){<li><article><div><time>{{ followUp.fecha }}</time><span class="tag">{{ followUp.estado }}</span></div><p>{{ followUp.observacion }}</p><small>{{ followUp.profesor }}</small></article></li>}@empty{<li>Sin seguimientos registrados.</li>}</ol></section>}</div></section>
  `,
  styles: `
    .page{display:grid;gap:1rem}.eyebrow{color:#2f6b9a!important;text-transform:uppercase;letter-spacing:.12em;font-size:.74rem;font-weight:800}h2,h3,p{margin:0}.layout{display:grid;grid-template-columns:minmax(260px,340px) 1fr;gap:1rem;align-items:start}.results{display:grid;gap:.5rem}.result{display:grid;grid-template-columns:auto 1fr;gap:.7rem;align-items:center;padding:.8rem;border:1px solid transparent;border-radius:9px;background:#fff;text-align:left;cursor:pointer}.result.selected{background:#eaf3f8;border-color:#b9d3e5}.result strong,.result small,.result em{display:block}.result small{color:#667085}.result em{color:#2f6b9a;font-style:normal}.avatar{width:40px;height:40px;display:grid;place-items:center;border-radius:50%;background:#1e3a5f;color:#fff;font-weight:800}.history ol{display:grid;gap:1rem;padding-left:1.5rem}.history article{display:grid;gap:.5rem;padding:1rem;border:1px solid #dbe5ef;border-radius:10px}.history article>div{display:flex;justify-content:space-between}.history small{color:#667085}@media(max-width:800px){.layout{grid-template-columns:1fr}}
  `,
})
// Registra y consulta el seguimiento de estudiantes.
export class SeguimientosVista {
  private readonly datos = inject(PortalDatosService);
  protected readonly monographs = computed(() => this.datos.monografias());
  protected readonly selectedId = signal(this.datos.monografias()[0]?.id ?? '');
  protected readonly selected = computed(() => this.datos.monografia(this.selectedId()));
  protected initials(name: string): string { return name.split(' ').slice(0, 2).map((part) => part[0]).join(''); }
}
