import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-alert-banner',
  imports: [CommonModule],
  template: `
    <section class="alert portal-alert mb-0" [class.alert-success]="tone() === 'success'" [class.alert-danger]="tone() === 'danger'" [class.alert-info]="tone() === 'neutral'" role="status">
      <strong>{{ title() }}</strong>
      <p>{{ message() }}</p>
    </section>
  `,
  styles: `
    .portal-alert{display:grid;gap:.2rem;padding:.7rem .85rem;border:0;border-left:4px solid currentColor;border-radius:4px;font-size:.74rem}.portal-alert strong,.portal-alert p{margin:0}
  `,
})
export class AlertBannerComponent {
  title = input('Aviso');
  message = input.required<string>();
  tone = input<'neutral' | 'success' | 'danger'>('neutral');
}
