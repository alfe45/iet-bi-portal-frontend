import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PrototypeDataService } from '../../core/data/prototype-data.service';
import {
  AlertBannerComponent,
  DataTableComponent,
  FilterSelectComponent,
  SearchBoxComponent,
  StatGridComponent,
} from '../../shared/components/ui-kit.component';
import { PageAction } from '../../core/models/prototype.models';

@Component({
  selector: 'app-feature-page',
  imports: [AlertBannerComponent, StatGridComponent, DataTableComponent, SearchBoxComponent, FilterSelectComponent, RouterLink],
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

      @if (page().alert) {
        <app-alert-banner [message]="page().alert!" title="Información" />
      }

      @if (page().stats?.length) {
        <app-stat-grid [cards]="page().stats!" />
      }

      <section class="surface section-card">
        <div class="section-heading">
          <div>
            <h3>{{ tableTitle() }}</h3>
            <p>{{ page().tableDescription ?? 'Consulta la información principal y utiliza las acciones de cada fila al final de la tabla.' }}</p>
          </div>
        </div>

        <div class="filters-row">
          <app-search-box [label]="page().searchLabel ?? 'Buscador'" [placeholder]="page().searchPlaceholder ?? 'Escriba un nombre, cédula o referencia'" [value]="search()" (valueChange)="search.set($event)" />
          @for (filter of page().filters ?? []; track filter.label) {
            <app-filter-select [label]="filter.label" [value]="filter.value" [options]="toOptions(filter.options)" />
          }
        </div>

        <app-data-table [columns]="page().columns" [rows]="filteredRows()" />
      </section>
    </section>
  `,
  styles: `
    .eyebrow { margin: 0 0 0.25rem; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.74rem; color: #2f6b9a; font-weight: 700; }
    .page-hero p, h2 { margin: 0; }
    .section-card p { margin: 0; color: #667085; }
  `,
})
export class FeaturePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly auth = inject(AuthService);
  private readonly data = inject(PrototypeDataService);
  private readonly key = this.route.snapshot.routeConfig?.path ?? '';
  protected readonly search = signal('');

  protected readonly page = computed(() => this.data.getFeaturePage(this.key, this.auth.currentRole() ?? 'Administrador'));
  protected readonly tableTitle = computed(() => this.page().tableTitle ?? `Lista de ${this.page().title.toLowerCase()}`);
  protected readonly filteredRows = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('es');
    if (!query) return this.page().rows;
    return this.page().rows.filter((row) =>
      Object.entries(row).some(([key, value]) => key !== 'acciones' && String(value).toLocaleLowerCase('es').includes(query)),
    );
  });
  protected readonly actions = computed<PageAction[]>(() =>
    this.page().actions.map((item, index) => (typeof item === 'string' ? { label: item, tone: index === 0 ? 'primary' : 'ghost' } : item)),
  );

  protected goBack() {
    this.location.back();
  }

  protected toOptions(options: string[]) {
    return options.map((option) => ({ value: option, label: option }));
  }
}
