import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { AccionTabla as TableAction, ColumnaTabla as TableColumn } from '../../nucleo/modelos/modelos-prototipo';

@Component({
  selector: 'app-data-table',
  imports: [CommonModule],
  template: `
    <section class="surface table-surface">
      <div class="table-wrapper">
        <table>
          <caption class="visually-hidden">Tabla de resultados</caption>
          <thead><tr>@for (column of columns(); track column.key) { <th>{{ column.label }}</th> }</tr></thead>
          <tbody>
            @if (!rows().length) { <tr><td class="empty-cell" [attr.colspan]="columns().length">No se encontraron registros.</td></tr> }
            @for (row of rows(); track $index) {
              <tr>@for (column of columns(); track column.key) { <td>
                @switch (column.type ?? 'text') {
                  @case ('badge') { <span class="badge" [class.badge--success]="isPositive(row[column.key])" [class.badge--danger]="isNegative(row[column.key])">{{ row[column.key] }}</span> }
                   @case ('actions') { <div class="action-list">@for (action of asActionArray(row[column.key]); track action.label) { <button type="button" class="table-action" title="Acción visual sin operación">{{ action.label }}</button> }</div> }
                  @case ('avatar') { <div class="avatar-cell"><div class="avatar-dot">{{ getInitials(row[column.key]) }}</div><div><strong>{{ getAvatarTitle(row[column.key]) }}</strong><small>{{ getAvatarSubtitle(row[column.key]) }}</small></div></div> }
                  @case ('list') { <div class="list-cell">@for (item of asStringArray(row[column.key]); track item) { <span>{{ item }}</span> }</div> }
                  @default { {{ row[column.key] }} }
                }
              </td> }</tr>
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
     .table-action { display: inline-flex; align-items: center; border: 1px solid #cfd8e3; background: #fff; border-radius: 999px; padding: 0.35rem 0.7rem; cursor: default; text-decoration: none; }
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

  protected asStringArray(value: unknown): string[] { return Array.isArray(value) ? value.map(String) : []; }
  protected asActionArray(value: unknown): TableAction[] {
    if (!Array.isArray(value)) return [];
    return value.map((item) => (typeof item === 'string' ? { label: item } : (item as TableAction)));
  }
  protected isPositive(value: unknown) { return ['Activo', 'Activa', 'Aprobada', 'Aprobado', 'Revisado', 'En desarrollo'].includes(String(value)); }
  protected isNegative(value: unknown) { return ['Inactivo', 'Pendiente', 'Retirada'].includes(String(value)); }
  protected getAvatarTitle(value: unknown) { return typeof value === 'object' && value !== null ? String((value as Record<string, unknown>)['title'] ?? '') : ''; }
  protected getAvatarSubtitle(value: unknown) { return typeof value === 'object' && value !== null ? String((value as Record<string, unknown>)['subtitle'] ?? '') : ''; }
  protected getInitials(value: unknown) { return this.getAvatarTitle(value).split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join(''); }
}
