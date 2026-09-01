import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataTableComponent } from '../compartidos/componentes/tabla-datos.component';

@Component({
  selector: 'app-vista-detalle-monografia',
   imports: [DataTableComponent],
  template: `
    <section class="page-grid">
      <section class="surface">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Detalle</p>
            <h2>{{ monograph()?.title ?? 'Monografía no encontrada' }}</h2>
            <p>Consulte el área, profesor guía, estado y los reportes registrados para esta monografía.</p>
          </div>
           <div class="pill-grid"><button type="button" class="ghost-button">← Volver</button><button type="button" class="ghost-button">Registrar reporte</button></div>
        </div>

        @if (monograph(); as item) {
          <div class="detail-grid">
            <div><strong>Estudiante:</strong> {{ item.student }}</div>
            <div><strong>Área:</strong> {{ item.area }}</div>
            <div><strong>Coordinador de monografía:</strong> {{ item.supervisor }}</div>
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
export class DetalleMonografiaVistaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  private readonly monographs = [{ id: 'M-301', student: 'José Luis Rodríguez Mora', title: 'Lectura crítica y escritura argumentativa', area: 'Lengua A', supervisor: 'Ana Lucía Solano Castro', status: 'En desarrollo', startDate: '2026-08-05', description: 'Monografía enfocada en los procesos de construcción de la pregunta de investigación y la introducción del trabajo escrito.', followUps: [{ date: '2026-08-22', professor: 'Ana Lucía Solano Castro', status: 'Revisado', note: 'Se presenta a las secciones de supervisión con puntualidad.' }] }];
  protected readonly monograph = computed(() => this.monographs.find((item) => item.id === this.id) ?? this.monographs[0]);
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

}
