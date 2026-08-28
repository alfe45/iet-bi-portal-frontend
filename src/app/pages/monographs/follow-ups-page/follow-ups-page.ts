import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrototypeDataService } from '../../../core/data/prototype-data.service';

@Component({
  selector: 'app-follow-ups-page',
  imports: [RouterLink],
  template: `
    <section class="follow-up-page" aria-labelledby="follow-up-title">
      <header class="page-header"><div><p class="eyebrow">Monografías</p><h2 id="follow-up-title">Reportes</h2><p>Encuentre un estudiante y consulte todo su historial de reportes.</p></div><a class="primary-button" routerLink="/monografias/reportes/nuevo">Registrar reporte</a></header>

      <section class="search-panel" aria-labelledby="search-title">
        <div><h3 id="search-title">¿Qué reporte desea consultar?</h3><p>Busque por estudiante, título, área o contenido de una observación.</p></div>
        <label class="search-field"><span class="visually-hidden">Buscar reporte</span><span aria-hidden="true">⌕</span><input type="search" placeholder="Ej. Ana López, reciclaje o introducción" [value]="query()" (input)="setQuery($event)" /><kbd>Buscar</kbd></label>
        <p class="result-count" role="status">{{ filtered().length }} {{ filtered().length === 1 ? 'monografía encontrada' : 'monografías encontradas' }}</p>
      </section>

      <div class="follow-up-layout">
        <nav class="student-results" aria-label="Resultados de búsqueda">
          @for (item of filtered(); track item.id) {
            <button type="button" class="result-card" [class.result-card--active]="selectedId() === item.id" [attr.aria-current]="selectedId() === item.id ? 'true' : null" (click)="select(item.id)">
              <span class="avatar">{{ initials(item.student) }}</span><span><strong>{{ item.student }}</strong><small>{{ item.title }}</small><em>{{ item.followUps.length }} reportes</em></span><span aria-hidden="true">›</span>
            </button>
          } @empty { <p class="empty-state">No encontramos resultados. Pruebe con otro nombre o palabra clave.</p> }
        </nav>

        @if (selected(); as item) {
          <section class="history-panel" aria-labelledby="history-title">
            <div class="history-header"><div><p class="eyebrow">Historial seleccionado</p><h3 id="history-title">{{ item.student }}</h3><p>{{ item.title }} · {{ item.area }}</p></div><span class="status">{{ item.status }}</span></div>
            <ol class="timeline">
              @for (followUp of item.followUps.slice().reverse(); track followUp.date) {
                <li><span class="timeline__marker" aria-hidden="true"></span><article><div><time>{{ followUp.date }}</time><span>{{ followUp.status }}</span></div><p>{{ followUp.note }}</p><small>{{ followUp.professor }}</small><button type="button">Editar reporte</button></article></li>
              } @empty { <li class="empty-state">Todavía no hay reportes registrados.</li> }
            </ol>
          </section>
        }
      </div>

    </section>
  `,
  styles: `
    .follow-up-page{display:grid;gap:1rem}.page-header,.search-panel,.student-results,.history-panel,.new-follow-up{background:#fff;border:1px solid #dbe5ef;border-radius:12px;padding:1.25rem}.page-header,.history-header,.form-header,.form-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem}h2,h3,p{margin:0}.page-header p,.search-panel p,.history-header p{color:#667085;margin-top:.3rem}.eyebrow{color:#2f6b9a!important;text-transform:uppercase;letter-spacing:.12em;font-size:.74rem;font-weight:800}.search-panel{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(320px,1fr) auto;align-items:center;gap:1rem;background:#f5f9fc}.search-field{display:flex;align-items:center;gap:.65rem;padding:.3rem .4rem .3rem .8rem;border:2px solid #b9cad8;border-radius:10px;background:#fff}.search-field:focus-within{border-color:#2f6b9a;box-shadow:0 0 0 3px rgba(47,107,154,.12)}.search-field input{border:0;padding:.65rem 0;outline:0}.search-field kbd{padding:.35rem .5rem;border:1px solid #dbe5ef;border-radius:6px;color:#667085;background:#f7f9fb}.result-count{white-space:nowrap}.follow-up-layout{display:grid;grid-template-columns:minmax(260px,340px) minmax(0,1fr);gap:1rem;align-items:start}.student-results{display:grid;gap:.55rem;padding:.7rem;max-height:650px;overflow:auto}.result-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.7rem;width:100%;padding:.8rem;border:1px solid transparent;border-radius:9px;background:#fff;color:#374151;text-align:left;cursor:pointer}.result-card:hover,.result-card--active{background:#eaf3f8;border-color:#b9d3e5}.avatar{width:40px;height:40px;display:grid;place-items:center;border-radius:50%;background:#1e3a5f;color:#fff;font-weight:800}.result-card strong,.result-card small,.result-card em{display:block}.result-card small{margin:.2rem 0;color:#667085;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:205px}.result-card em{color:#2f6b9a;font-size:.78rem;font-style:normal}.status{padding:.4rem .7rem;border-radius:999px;background:#eef7f0;color:#2e6b34;font-weight:700}.timeline{list-style:none;margin:1.5rem 0 0;padding:0;display:grid}.timeline li{position:relative;display:grid;grid-template-columns:28px 1fr;gap:.7rem;padding-bottom:1.1rem}.timeline li:not(:last-child)::before{content:'';position:absolute;left:6px;top:14px;bottom:0;border-left:2px solid #cbdce8}.timeline__marker{width:14px;height:14px;margin-top:.35rem;border-radius:50%;background:#2f6b9a;border:3px solid #eaf3f8;z-index:1}.timeline article{display:grid;gap:.65rem;padding:1rem;border:1px solid #e0e7ee;border-radius:10px}.timeline article>div{display:flex;justify-content:space-between}.timeline time{font-weight:800;color:#1e3a5f}.timeline article>div span,.timeline article small{color:#667085}.timeline article button{justify-self:start;border:0;background:transparent;color:#2f6b9a;font-weight:700;cursor:pointer;padding:.35rem 0}.empty-state{padding:1.5rem;color:#667085;text-align:center}.new-follow-up{border-top:4px solid #2f6b9a}.form-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1rem}.form-grid label{display:grid;gap:.45rem;font-weight:700}.form-grid__full{grid-column:1/-1}.form-actions{margin-top:1rem;justify-content:flex-end}.success-message{padding:.9rem;background:#eef7f0;color:#245d29;border:1px solid #c8e2cd;border-radius:9px}@media(max-width:900px){.search-panel,.follow-up-layout{grid-template-columns:1fr}.student-results{max-height:none}.form-grid{grid-template-columns:1fr}.form-grid__full{grid-column:auto}}@media(max-width:620px){.page-header,.history-header{align-items:flex-start;flex-direction:column}.search-field kbd{display:none}}
  `,
})
export class FollowUpsPage {
  private readonly data = inject(PrototypeDataService); protected readonly query = signal(''); protected readonly selectedId = signal('M-301'); protected readonly monographs = computed(() => this.data.getMonographs());
  protected readonly filtered = computed(() => { const query=this.query().trim().toLocaleLowerCase('es'); return query ? this.monographs().filter((item)=>`${item.student} ${item.title} ${item.area} ${item.followUps.map((follow)=>follow.note).join(' ')}`.toLocaleLowerCase('es').includes(query)) : this.monographs(); });
  protected readonly selected = computed(() => this.monographs().find((item)=>item.id===this.selectedId()) ?? this.filtered()[0]);
  protected setQuery(event:Event){this.query.set((event.target as HTMLInputElement).value);const first=this.filtered()[0];if(first)this.selectedId.set(first.id)} protected select(id:string){this.selectedId.set(id)} protected initials(name:string){return name.split(' ').slice(0,2).map((part)=>part[0]).join('')}
}
