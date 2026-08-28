import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, SelectOption, StatCard, TableAction, TableColumn } from '../../core/models/prototype.models';

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

@Component({
  selector: 'app-filter-select',
  imports: [CommonModule],
  template: `
    <label class="filter-select">
      <span>{{ label() }}</span>
      <select [value]="value()" (change)="onChange($event)">
        @for (option of options(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </label>
  `,
  styles: `
    .filter-select { display: grid; gap: 0.45rem; color: #374151; font-weight: 600; }
    .filter-select select { min-height: 44px; }
  `,
})
export class FilterSelectComponent {
  label = input.required<string>();
  value = input('');
  options = input.required<SelectOption[]>();
  selectionChange = output<string>();

  protected onChange(event: Event) {
    this.selectionChange.emit((event.target as HTMLSelectElement).value);
  }
}

@Component({
  selector: 'app-search-box',
  template: `
    <label class="search-box">
      <span>{{ label() }}</span>
      <input type="search" [placeholder]="placeholder()" [value]="value()" (input)="onInput($event)" />
    </label>
  `,
  styles: `
    .search-box { display: grid; gap: 0.45rem; color: #374151; font-weight: 600; }
    .search-box input { min-height: 44px; }
  `,
})
export class SearchBoxComponent {
  label = input('Buscar');
  placeholder = input('Escriba para buscar');
  value = input('');
  valueChange = output<string>();

  protected onInput(event: Event) {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}

@Component({
  selector: 'app-data-table',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="surface table-surface">
      <div class="table-wrapper">
        <table>
          <caption class="visually-hidden">Tabla de resultados</caption>
          <thead>
            <tr>
              @for (column of columns(); track column.key) {
                <th>{{ column.label }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @if (!rows().length) {
              <tr><td class="empty-cell" [attr.colspan]="columns().length">No se encontraron registros.</td></tr>
            }
            @for (row of rows(); track $index) {
              <tr>
                @for (column of columns(); track column.key) {
                  <td>
                    @switch (column.type ?? 'text') {
                      @case ('badge') {
                        <span class="badge" [class.badge--success]="isPositive(row[column.key])" [class.badge--danger]="isNegative(row[column.key])">{{ row[column.key] }}</span>
                      }
                      @case ('actions') {
                        <div class="action-list">
                          @for (action of asActionArray(row[column.key]); track action.label) {
                            @if (action.path) {
                              <a class="table-action" [routerLink]="action.path">{{ action.label }}</a>
                            } @else {
                              <button type="button" class="table-action">{{ action.label }}</button>
                            }
                          }
                        </div>
                      }
                      @case ('avatar') {
                        <div class="avatar-cell">
                          <div class="avatar-dot">{{ getInitials(row[column.key]) }}</div>
                          <div>
                            <strong>{{ getAvatarTitle(row[column.key]) }}</strong>
                            <small>{{ getAvatarSubtitle(row[column.key]) }}</small>
                          </div>
                        </div>
                      }
                      @case ('list') {
                        <div class="list-cell">
                          @for (item of asStringArray(row[column.key]); track item) {
                            <span>{{ item }}</span>
                          }
                        </div>
                      }
                      @default {
                        {{ row[column.key] }}
                      }
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: `
    .table-surface { overflow: hidden; }
    .table-wrapper { overflow: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 760px; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    th { color: #1e3a5f; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .badge { display: inline-flex; padding: 0.35rem 0.7rem; border-radius: 999px; background: #eaf3f8; color: #1e3a5f; font-size: 0.82rem; font-weight: 700; }
    .badge--success { background: rgba(46, 125, 50, 0.1); color: #2e7d32; }
    .badge--danger { background: rgba(198, 40, 40, 0.1); color: #c62828; }
    .action-list, .list-cell { display: flex; flex-wrap: wrap; gap: 0.45rem; }
    .table-action { display: inline-flex; align-items: center; border: 1px solid #cfd8e3; background: #fff; border-radius: 999px; padding: 0.35rem 0.7rem; cursor: pointer; text-decoration: none; }
    .avatar-cell { display: flex; align-items: center; gap: 0.8rem; }
    .avatar-dot { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: #eaf3f8; color: #1e3a5f; font-weight: 700; }
    .avatar-cell strong, .avatar-cell small { display: block; }
    .avatar-cell small { color: #6b7280; }
    .empty-cell { text-align: center; color: #667085; padding: 2rem; }
  `,
})
export class DataTableComponent {
  columns = input.required<TableColumn[]>();
  rows = input.required<Array<Record<string, unknown>>>();

  protected asStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.map(String) : [];
  }

  protected asActionArray(value: unknown): TableAction[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => (typeof item === 'string' ? { label: item } : (item as TableAction)));
  }

  protected isPositive(value: unknown) {
    return ['Activo', 'Activa', 'Aprobada', 'Aprobado', 'Revisado', 'En desarrollo'].includes(String(value));
  }

  protected isNegative(value: unknown) {
    return ['Inactivo', 'Pendiente', 'Retirada'].includes(String(value));
  }

  protected getAvatarTitle(value: unknown) {
    return typeof value === 'object' && value !== null ? String((value as Record<string, unknown>)['title'] ?? '') : '';
  }

  protected getAvatarSubtitle(value: unknown) {
    return typeof value === 'object' && value !== null ? String((value as Record<string, unknown>)['subtitle'] ?? '') : '';
  }

  protected getInitials(value: unknown) {
    return this.getAvatarTitle(value)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('');
  }
}

@Component({
  selector: 'app-form-preview',
  imports: [CommonModule],
  template: `
    <section class="surface form-preview">
      <div class="section-heading">
        <h3>{{ title() }}</h3>
        @if (showSubmit()) {
          <button type="button" class="primary-button">{{ submitLabel() }}</button>
        }
      </div>

      @for (section of sections(); track section.title) {
        <div class="form-section">
          <div class="form-section__header">
            <h4>{{ section.title }}</h4>
          </div>

          <div class="form-grid">
            @for (field of section.fields; track field.key) {
              <label class="field" [class.field--full]="field.type === 'textarea'">
                <span>{{ field.label }}</span>

                @switch (field.type) {
                  @case ('select') {
                    <select [disabled]="readOnly()">
                      @for (option of field.options ?? []; track option) {
                        <option [selected]="option === field.value">{{ option }}</option>
                      }
                    </select>
                  }
                  @case ('textarea') {
                    <textarea rows="4" [readOnly]="readOnly()">{{ field.value }}</textarea>
                  }
                  @default {
                    <input [type]="field.type" [value]="field.value ?? ''" [readOnly]="readOnly()" />
                  }
                }
              </label>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .form-preview { display: grid; gap: 1rem; }
    .form-section { display: grid; gap: 0.9rem; }
    .form-section__header { padding-bottom: 0.3rem; border-bottom: 1px solid #e5edf5; }
    .form-section__header h4 { margin: 0; color: #1e3a5f; font-size: 0.96rem; }
    .form-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .field { display: grid; gap: 0.45rem; }
    .field--full { grid-column: 1 / -1; }
    .field span { font-weight: 600; }
    @media (max-width: 700px) { .form-grid { grid-template-columns: 1fr; } }
  `,
})
export class FormPreviewComponent {
  title = input.required<string>();
  fields = input.required<FormField[]>();
  submitLabel = input('Guardar');
  showSubmit = input(true);
  readOnly = input(false);

  protected readonly sections = computed(() => {
    const groups = new Map<string, FormField[]>();

    for (const field of this.fields()) {
      const section = field.section ?? 'Datos generales';
      groups.set(section, [...(groups.get(section) ?? []), field]);
    }

    return Array.from(groups.entries()).map(([title, fields]) => ({ title, fields }));
  });
}

@Component({
  selector: 'app-modal-preview',
  template: `
    <section class="surface modal-preview">
      <div class="section-heading">
        <h3>{{ title() }}</h3>
        <span class="tag">Confirmación</span>
      </div>
      <p>{{ description() }}</p>
      <div class="modal-actions">
        <button type="button" class="ghost-button">Cancelar</button>
        <button type="button" class="primary-button">Confirmar</button>
      </div>
    </section>
  `,
  styles: `
    .modal-preview { display: grid; gap: 1rem; }
    .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
  `,
})
export class ModalPreviewComponent {
  title = input.required<string>();
  description = input.required<string>();
}

@Component({
  selector: 'app-confirmation-box',
  template: `
    <section class="surface confirmation-box">
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      <div class="confirmation-actions">
        <button type="button" class="ghost-button">Volver</button>
        <button type="button" class="danger-button">Aceptar</button>
      </div>
    </section>
  `,
  styles: `
    .confirmation-box { display: grid; gap: 0.8rem; }
    .confirmation-box h3, .confirmation-box p { margin: 0; }
    .confirmation-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
  `,
})
export class ConfirmationBoxComponent {
  title = input.required<string>();
  description = input.required<string>();
}
