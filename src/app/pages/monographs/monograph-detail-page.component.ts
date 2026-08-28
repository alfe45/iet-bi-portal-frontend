import { Location } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PrototypeDataService } from '../../core/data/prototype-data.service';
import { AuthService } from '../../core/auth/auth.service';
import { DataTableComponent } from '../../shared/components/ui-kit.component';

@Component({
  selector: 'app-monograph-detail-page',
  imports: [DataTableComponent, RouterLink],
  template: `
    <section class="page-grid">
      <section class="surface">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Detalle</p>
            <h2>{{ monograph()?.title ?? 'Monografía no encontrada' }}</h2>
            <p>Consulte el área, profesor guía, estado y los reportes registrados para esta monografía.</p>
          </div>
          <div class="pill-grid">
            <button type="button" class="ghost-button" (click)="goBack()">← Volver</button>
            @if (canManage()) {
              <a class="ghost-button" routerLink="/monografias/reportes/nuevo">Registrar reporte</a>
            }
          </div>
        </div>

        @if (monograph(); as item) {
          <div class="detail-grid">
            <div><strong>Estudiante:</strong> {{ item.student }}</div>
            <div><strong>Área:</strong> {{ item.area }}</div>
            <div><strong>Profesor Guía de Monografía:</strong> {{ item.supervisor }}</div>
            <div><strong>Estado:</strong> {{ item.status }}</div>
            <div><strong>Fecha de inicio:</strong> {{ item.startDate }}</div>
          </div>
          <p>{{ item.description }}</p>
        }
      </section>

      <section class="surface">
        <div class="section-heading">
          <h3>Reportes registrados</h3>
        </div>
        <app-data-table [columns]="columns" [rows]="rows()" />
      </section>
    </section>
  `,
  styles: `
    .eyebrow { margin: 0 0 0.25rem; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.74rem; color: #2f6b9a; font-weight: 700; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
  `,
})
export class MonographDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly data = inject(PrototypeDataService);
  private readonly auth = inject(AuthService);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly monograph = computed(() => this.data.getMonographById(this.id));
  protected readonly canManage = computed(() => this.auth.currentRole() === 'Profesor Guía de Monografía');
  protected readonly columns = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'profesor', label: 'Profesor' },
    { key: 'estado', label: 'Estado', type: 'badge' as const },
    { key: 'observacion', label: 'Observación' },
  ];
  protected readonly rows = computed(() =>
    (this.monograph()?.followUps ?? []).map((followUp) => ({
      fecha: followUp.date,
      profesor: followUp.professor,
      estado: followUp.status,
      observacion: followUp.note,
    })),
  );

  protected goBack() {
    this.location.back();
  }
}
