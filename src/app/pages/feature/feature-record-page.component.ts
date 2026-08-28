import { Location } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PrototypeDataService } from '../../core/data/prototype-data.service';
import { PageAction } from '../../core/models/prototype.models';
import { DataTableComponent, FormPreviewComponent } from '../../shared/components/ui-kit.component';

@Component({
  selector: 'app-feature-record-page',
  imports: [FormPreviewComponent, DataTableComponent, RouterLink],
  template: `
    <section class="page-grid">
      <section class="surface page-hero">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Gestión</p>
            <h2>{{ page().title }}</h2>
            <p>{{ page().subtitle }}</p>
          </div>
          <div class="pill-grid">
            <button type="button" class="ghost-button" (click)="goBack()">← Volver</button>
            @for (action of actions(); track action.label) {
              @if (action.path) {
                <a [routerLink]="action.path" [class]="action.tone === 'primary' ? 'primary-button' : 'ghost-button'">{{ action.label }}</a>
              } @else {
                <button type="button" [class]="action.tone === 'primary' ? 'primary-button' : 'ghost-button'">{{ action.label }}</button>
              }
            }
          </div>
        </div>
      </section>

      <app-form-preview
        [title]="page().formTitle"
        [fields]="page().formFields"
        [submitLabel]="page().formSubmitLabel ?? 'Guardar'"
        [showSubmit]="!page().readOnly"
        [readOnly]="page().readOnly ?? false"
      />

      @if (page().tableTitle && page().rows.length) {
        <section class="surface section-card">
          <div class="section-heading">
            <div>
              <h3>{{ page().tableTitle }}</h3>
              @if (page().tableDescription) {
                <p>{{ page().tableDescription }}</p>
              }
            </div>
          </div>

          <app-data-table [columns]="page().columns" [rows]="page().rows" />
        </section>
      }
    </section>
  `,
  styles: `
    .eyebrow { margin: 0 0 0.25rem; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.74rem; color: #2f6b9a; font-weight: 700; }
    .page-hero p, h2 { margin: 0; }
    .section-card p { margin: 0; color: #667085; }
  `,
})
export class FeatureRecordPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly auth = inject(AuthService);
  private readonly data = inject(PrototypeDataService);

  protected readonly page = computed(() => {
    const entity = String(this.route.snapshot.data['entity'] ?? 'estudiantes');
    const mode = String(this.route.snapshot.data['mode'] ?? 'detail') as 'create' | 'detail' | 'edit' | 'history';
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    return this.data.getRecordPage(entity, mode, this.auth.currentRole() ?? 'Administrador', id);
  });
  protected readonly actions = computed<PageAction[]>(() =>
    this.page().actions.map((item, index) => (typeof item === 'string' ? { label: item, tone: index === 0 ? 'primary' : 'ghost' } : item)),
  );

  protected goBack() {
    this.location.back();
  }
}
