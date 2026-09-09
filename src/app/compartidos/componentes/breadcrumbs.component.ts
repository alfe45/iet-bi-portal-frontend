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
          <span class="breadcrumbs__separator">/</span>
        }
      }
    </nav>
  `,
  styles: `
    .breadcrumbs { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; color: #8996a4; font-size: .72rem; }
    .breadcrumbs__current { color: #29344a; font-weight: 600; }
    .breadcrumbs__separator { color: #bec8d0; }
  `,
})
export class BreadcrumbsComponent {
  items = input.required<string[]>();
}
