import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { TarjetaEstadistica as StatCard } from '../../nucleo/modelos/modelos-prototipo';

@Component({
  selector: 'app-stat-grid',
  imports: [CommonModule],
  template: `
    <div class="row g-3 stat-grid">
      @for (card of cards(); track card.label) {
        <div class="col-12 col-sm-6 col-xl">
          <article class="card stat-card" [class.stat-card--success]="card.tone === 'success'" [class.stat-card--danger]="card.tone === 'danger'" [class.stat-card--primary]="card.tone === 'primary'">
            <span>{{ card.label }}</span><strong>{{ card.value }}</strong>@if (card.trend) { <small>{{ card.trend }}</small> }
          </article>
        </div>
      }
    </div>
  `,
  styles: `
    .stat-grid { --bs-gutter-x: .8rem; --bs-gutter-y: .8rem; }
    .stat-card { height:100%; min-height:92px; display:grid; gap:.2rem; padding:.9rem 1rem; color:#fff; background:linear-gradient(45deg,#8996a4,#a8b2bc); overflow:hidden; }
    .stat-card strong { font-size:1.55rem; line-height:1.15; color:#fff; }.stat-card span,.stat-card small{color:rgba(255,255,255,.85);font-size:.7rem}.stat-card--success{background:linear-gradient(45deg,#20b99a,#56e3c7)}.stat-card--danger{background:linear-gradient(45deg,#ef4765,#ff8298)}.stat-card--primary{background:linear-gradient(45deg,#4099ff,#73b4ff)}
  `,
})
// Presenta un conjunto de indicadores resumidos.
export class StatGridComponent {
  cards = input.required<StatCard[]>();
}
