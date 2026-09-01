import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { TarjetaEstadistica as StatCard } from '../../nucleo/modelos/modelos-prototipo';

@Component({
  selector: 'app-stat-grid',
  imports: [CommonModule],
  template: `
    <div class="stat-grid">
      @for (card of cards(); track card.label) {
        <article class="surface stat-card" [class.stat-card--success]="card.tone === 'success'" [class.stat-card--danger]="card.tone === 'danger'" [class.stat-card--primary]="card.tone === 'primary'">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          @if (card.trend) {
            <small>{{ card.trend }}</small>
          }
        </article>
      }
    </div>
  `,
  styles: `
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
    .stat-card { display: grid; gap: 0.45rem; }
    .stat-card strong { font-size: 1.7rem; color: #1e3a5f; }
    .stat-card span, .stat-card small { color: #6b7280; }
    .stat-card--success { border-top: 4px solid #2e7d32; }
    .stat-card--danger { border-top: 4px solid #c62828; }
    .stat-card--primary { border-top: 4px solid #2f6b9a; }
  `,
})
export class StatGridComponent {
  cards = input.required<StatCard[]>();
}
