import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { AccionTabla as TableAction, ColumnaTabla as TableColumn } from '../../nucleo/modelos/modelos-prototipo';

@Component({
  selector: 'app-data-table',
  imports: [CommonModule],
  template: `
    <section class="card table-card">
      <div class="table-responsive table-wrapper" tabindex="0">
        <table class="table table-hover align-middle mb-0">
          <caption class="visually-hidden">Tabla de resultados</caption>
          <thead><tr>@for (column of columns(); track column.key) { <th scope="col">{{ column.label }}</th> }</tr></thead>
          <tbody>
            @if (!rows().length) { <tr><td class="empty-cell" [attr.colspan]="columns().length">No se encontraron registros.</td></tr> }
            @for (row of rows(); track row['id'] ?? $index) {
              <tr>@for (column of columns(); track column.key) { <td>
                @switch (column.type ?? 'text') {
                  @case ('badge') { <span class="badge" [class.badge--success]="isPositive(row[column.key])" [class.badge--danger]="isNegative(row[column.key])">{{ row[column.key] }}</span> }
                  @case ('badge-periodo') { <span class="badge" [class]="badgePeriodoClass(row[column.key])">{{ row[column.key] }}</span> }
                    @case ('actions') { <div class="action-list">@for (action of asActionArray(row[column.key]); track action.label) { <button type="button" class="btn btn-sm table-action" [class.btn-outline-danger]="action.tone === 'danger'" [class.btn-outline-primary]="action.tone !== 'danger'" (click)="actionSelected.emit({ action: action.code ?? action.label, row })">{{ action.label }}</button> }</div> }
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
     .table-card { padding:0; overflow:hidden; }.table-wrapper{max-width:100%;overflow:auto;-webkit-overflow-scrolling:touch}.table{width:100%;font-size:.72rem;table-layout:fixed}.table>:not(caption)>*>*{padding:.52rem .65rem;border-bottom-color:#edf0f2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.table thead th{color:#5b6b79;background:#f8f9fa;font-size:.64rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
    .badge { display:inline-flex;padding:.26rem .5rem;border-radius:3px;background:rgba(64,153,255,.1);color:#287edc;font-size:.66rem;font-weight:600}.badge--success{background:rgba(46,216,182,.13);color:#168d76}.badge--danger{background:rgba(255,83,112,.12);color:#d63854}.badge--warning{background:rgba(255,182,77,.14);color:#9e6b06}.badge--info{background:rgba(64,153,255,.1);color:#287edc}.badge--neutral{background:rgba(137,150,164,.12);color:#5b6b79}
    .action-list, .list-cell { display: flex; flex-wrap: wrap; gap: 0.45rem; }
     .table-action{padding:.22rem .48rem;border-radius:3px;font-size:.66rem}
    .avatar-cell { display: flex; align-items: center; gap: 0.8rem; }
    .avatar-dot { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: #eaf3f8; color: #1e3a5f; font-weight: 700; }
    .avatar-cell strong, .avatar-cell small { display: block; }
    .avatar-cell small { color: #6b7280; }
    .empty-cell{text-align:center;color:#8996a4;padding:2rem!important}
  `,
})
// Presenta tablas reutilizables con sus acciones y estados.
export class DataTableComponent {
  columns = input.required<TableColumn[]>();
  rows = input.required<Array<Record<string, unknown>>>();
  actionSelected = output<{ action: string; row: Record<string, unknown> }>();

  protected asStringArray(value: unknown): string[] { return Array.isArray(value) ? value.map(String) : []; }
  protected asActionArray(value: unknown): TableAction[] {
    if (!Array.isArray(value)) return [];
    return value.map((item) => (typeof item === 'string' ? { label: item } : (item as TableAction)));
  }
  protected badgePeriodoClass(value: unknown): string {
    const estado = String(value ?? '');
    switch (estado) {
      case 'PROGRAMADO':
        return 'badge badge--warning';
      case 'EN_CURSO':
        return 'badge badge--success';
      case 'FINALIZADO':
        return 'badge badge--danger';
      default:
        return 'badge badge--neutral';
    }
  }
  protected isPositive(value: unknown) { return ['Activo', 'Activa', 'Aprobada', 'Aprobado', 'Revisado', 'En desarrollo'].includes(String(value)); }
  protected isNegative(value: unknown) { return ['Inactivo', 'Pendiente', 'Retirada'].includes(String(value)); }
  protected getAvatarTitle(value: unknown) { return typeof value === 'object' && value !== null ? String((value as Record<string, unknown>)['title'] ?? '') : ''; }
  protected getAvatarSubtitle(value: unknown) { return typeof value === 'object' && value !== null ? String((value as Record<string, unknown>)['subtitle'] ?? '') : ''; }
  protected getInitials(value: unknown) { return this.getAvatarTitle(value).split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join(''); }
}
