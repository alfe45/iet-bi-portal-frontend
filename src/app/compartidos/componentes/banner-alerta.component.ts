import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-alert-banner',
  imports: [CommonModule],
  template: `
    <section class="surface alert" [class.alert--success]="tone() === 'success'" [class.alert--danger]="tone() === 'danger'">
      <strong>{{ title() }}</strong>
      <p>{{ message() }}</p>
    </section>
  `,
  styles: `
    .alert { display: grid; gap: 0.3rem; }
    .alert strong, .alert p { margin: 0; }
    .alert--success { border-left: 5px solid #2e7d32; }
    .alert--danger { border-left: 5px solid #c62828; }
  `,
})
export class AlertBannerComponent {
  title = input('Aviso');
  message = input.required<string>();
  tone = input<'neutral' | 'success' | 'danger'>('neutral');
}
