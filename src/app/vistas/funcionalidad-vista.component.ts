import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { AlertBannerComponent } from '../compartidos/componentes/banner-alerta.component';
import { DataTableComponent } from '../compartidos/componentes/tabla-datos.component';
import { StatGridComponent } from '../compartidos/componentes/cuadricula-estadisticas.component';

@Component({
  selector: 'app-vista-funcionalidad',
    imports: [AlertBannerComponent, StatGridComponent, DataTableComponent],
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
             <button type="button" class="ghost-button" disabled>← Volver</button>
            @for (action of actions(); track action.label) {
               <button type="button" [class]="action.tone === 'primary' ? 'primary-button' : 'ghost-button'">{{ action.label }}</button>
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
           <p>{{ page().tableDescription ?? 'Vista previa de la información principal y de las acciones disponibles.' }}</p>
          </div>
        </div>

        <app-data-table [columns]="page().columns" [rows]="page().rows" />
      </section>
    </section>
  `,
  styles: `
    .eyebrow { margin: 0 0 0.25rem; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.74rem; color: #2f6b9a; font-weight: 700; }
    .page-hero p, h2 { margin: 0; }
    .section-card p { margin: 0; color: #667085; }
  `,
})
export class FuncionalidadVistaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AutenticacionService);
  private readonly key = this.route.snapshot.routeConfig?.path ?? '';

  protected readonly page = computed(() => {
    const role = this.auth.currentRole() ?? 'Administrador';
    const titles: Record<string, string> = { usuarios: 'Usuarios', profesores: 'Profesores', estudiantes: role === 'Administrador' ? 'Estudiantes' : 'Mis estudiantes', periodos: 'Periodos académicos', secciones: role === 'Administrador' ? 'Secciones académicas' : 'Mis secciones', matriculas: 'Matrículas', escalas: 'Tipos de escala', asignaturas: role === 'Administrador' ? 'Asignaturas' : 'Mis asignaturas', asignaciones: 'Asignaciones académicas' };
    const columns = this.key === 'estudiantes' ? [{ key: 'nombre', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'seccion', label: 'Sección' }, { key: 'correo', label: 'Correo' }, { key: 'estado', label: 'Estado', type: 'badge' as const }, { key: 'acciones', label: 'Acciones', type: 'actions' as const }] : [{ key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción' }, { key: 'estado', label: 'Estado', type: 'badge' as const }, { key: 'acciones', label: 'Acciones', type: 'actions' as const }];
    const rows = this.key === 'estudiantes' ? [{ nombre: 'José Luis Rodríguez Mora', cedula: '8-734-401', seccion: '11-1', correo: 'jose.rodriguez@estudiante.edu', estado: 'Activo', acciones: ['Ver detalle'] }, { nombre: 'María Fernanda Jiménez Vargas', cedula: '8-811-109', seccion: '11-1', correo: 'maria.jimenez@estudiante.edu', estado: 'Activo', acciones: ['Ver detalle'] }, { nombre: 'Carlos Eduardo Araya Rojas', cedula: '8-744-002', seccion: '11-1', correo: 'carlos.araya@estudiante.edu', estado: 'Activo', acciones: ['Ver detalle'] }] : [{ nombre: titles[this.key] ?? 'Gestión académica', descripcion: 'Información de ejemplo del portal institucional', estado: 'Activo', acciones: ['Ver', ...(role === 'Administrador' ? ['Editar'] : [])] }, { nombre: 'Registro 2026', descripcion: 'Periodo académico vigente', estado: 'Activo', acciones: ['Ver detalle'] }];
    return { title: titles[this.key] ?? 'Gestión académica', subtitle: 'Consulta y administra la información de ejemplo del portal.', alert: undefined, stats: [{ label: 'Registros de ejemplo', value: String(rows.length), tone: 'primary' as const }], tableDescription: undefined, columns, rows, actions: role === 'Administrador' ? [{ label: `Registrar ${titles[this.key]?.toLowerCase() ?? 'registro'}`, tone: 'primary' as const }] : [], tableTitle: `Lista de ${titles[this.key]?.toLowerCase() ?? 'registros'}` };
  });
  protected readonly tableTitle = computed(() => this.page().tableTitle ?? `Lista de ${this.page().title.toLowerCase()}`);
  protected readonly actions = computed(() => this.page().actions);
}
