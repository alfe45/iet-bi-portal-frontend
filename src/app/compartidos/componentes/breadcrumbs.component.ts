import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-breadcrumbs',
  imports: [CommonModule],
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      @for (item of items(); track item; let last = $last) {
        <span [class.breadcrumbs__current]="last">{{ item }}</span>
        @if (!last) {
          <span class="breadcrumbs__separator">></span>
        }
      }
    </nav>
  `,
  styles: `
    .breadcrumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 0.55rem; color: #6b7280; font-size: 0.92rem; }
    .breadcrumbs__current { color: #1e3a5f; font-weight: 700; }
    .breadcrumbs__separator { color: #9aa6b2; }
  `,
})
export class BreadcrumbsComponent {
  items = input.required<string[]>();
}
