import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataTableComponent } from '../compartidos/componentes/tabla-datos.component';
import { StatGridComponent } from '../compartidos/componentes/cuadricula-estadisticas.component';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { FuncionalidadAdministrativa, PortalDatosService, RegistroPortal } from '../nucleo/datos/portal-datos.service';
import { ColumnaTabla } from '../nucleo/modelos/modelos-prototipo';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';

interface CampoFormulario {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'select';
  options?: string[];
}

interface ConfiguracionCrud {
  title: string;
  singular: string;
  subtitle: string;
  columns: ColumnaTabla[];
  fields: CampoFormulario[];
}

const ESTADOS = ['Activo', 'Inactivo'];
const CONFIGURACIONES: Record<FuncionalidadAdministrativa, ConfiguracionCrud> = {
  usuarios: { title: 'Usuarios', singular: 'usuario', subtitle: 'Administre las cuentas y roles del portal.', columns: [{ key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Rol o descripción' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Rol o descripción' }, { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS }] },
  profesores: { title: 'Profesores', singular: 'profesor', subtitle: 'Administre la información del personal docente.', columns: [{ key: 'nombre', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'correo', label: 'Correo' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'nombre', label: 'Nombre completo' }, { key: 'cedula', label: 'Cédula' }, { key: 'correo', label: 'Correo', type: 'email' }, { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS }] },
  estudiantes: { title: 'Estudiantes', singular: 'estudiante', subtitle: 'Consulte y administre los estudiantes registrados.', columns: [{ key: 'nombre', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'seccion', label: 'Sección' }, { key: 'correo', label: 'Correo' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'nombre', label: 'Nombre completo' }, { key: 'cedula', label: 'Cédula' }, { key: 'seccion', label: 'Sección' }, { key: 'correo', label: 'Correo', type: 'email' }, { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS }] },
  periodos: { title: 'Periodos académicos', singular: 'periodo', subtitle: 'Configure los periodos académicos.', columns: [{ key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción' }, { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS }] },
  secciones: { title: 'Secciones académicas', singular: 'sección', subtitle: 'Consulte y administre las secciones.', columns: [{ key: 'nombre', label: 'Sección' }, { key: 'nivel', label: 'Nivel' }, { key: 'guia', label: 'Profesor Guía' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'nombre', label: 'Sección' }, { key: 'nivel', label: 'Nivel' }, { key: 'guia', label: 'Profesor Guía' }, { key: 'estado', label: 'Estado', type: 'select', options: ['Activa', 'Inactiva'] }] },
  matriculas: { title: 'Matrículas', singular: 'matrícula', subtitle: 'Administre la relación entre estudiante, sección y periodo.', columns: [{ key: 'estudiante', label: 'Estudiante' }, { key: 'seccion', label: 'Sección' }, { key: 'periodo', label: 'Periodo' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'estudiante', label: 'Estudiante' }, { key: 'seccion', label: 'Sección' }, { key: 'periodo', label: 'Periodo' }, { key: 'estado', label: 'Estado', type: 'select', options: ['Activa', 'Retirada'] }] },
  escalas: { title: 'Tipos de escala', singular: 'escala', subtitle: 'Administre las escalas utilizadas en las asignaturas.', columns: [{ key: 'nombre', label: 'Nombre' }, { key: 'rango', label: 'Rango' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'rango', label: 'Rango' }, { key: 'estado', label: 'Estado', type: 'select', options: ['Activa', 'Inactiva'] }] },
  asignaturas: { title: 'Asignaturas', singular: 'asignatura', subtitle: 'Consulte y administre el catálogo de asignaturas.', columns: [{ key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción' }, { key: 'escala', label: 'Escala' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción' }, { key: 'escala', label: 'Escala', type: 'select', options: ['1-7', '1-100', 'A-E'] }, { key: 'estado', label: 'Estado', type: 'select', options: ['Activa', 'Inactiva'] }] },
  asignaciones: { title: 'Asignaciones académicas', singular: 'asignación', subtitle: 'Administre la relación entre profesor, asignatura y sección.', columns: [{ key: 'profesor', label: 'Profesor' }, { key: 'asignatura', label: 'Asignatura' }, { key: 'seccion', label: 'Sección' }, { key: 'periodo', label: 'Periodo' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'profesor', label: 'Profesor' }, { key: 'asignatura', label: 'Asignatura' }, { key: 'seccion', label: 'Sección' }, { key: 'periodo', label: 'Periodo' }, { key: 'estado', label: 'Estado', type: 'select', options: ['Activa', 'Inactiva'] }] },
};

@Component({
  selector: 'app-vista-funcionalidad',
  imports: [FormsModule, StatGridComponent, DataTableComponent],
  template: `
    <section class="page-grid">
      <section class="surface">
        <div class="section-heading">
          <div><p class="eyebrow">{{ isTeacher() ? 'Mi trabajo' : 'Gestión' }}</p><h2>{{ pageTitle() }}</h2><p>{{ pageSubtitle() }}</p></div>
           @if (isAdmin()) { <button type="button" class="primary-button" (click)="abrirNuevo()">Registrar {{ config.singular }}</button> }
        </div>
      </section>

      <app-stat-grid [cards]="[{ label: 'Registros', value: String(rows().length), tone: 'primary' }]" />

       @if (editorOpen()) {
         <div class="modal-backdrop" role="presentation"><form class="surface editor" (ngSubmit)="guardar()" role="dialog" aria-modal="true" aria-labelledby="crud-editor-title">
           <div class="section-heading"><div><h3 id="crud-editor-title">{{ editorTitle }}</h3><p>Los cambios se guardan en este navegador.</p></div><button type="button" class="ghost-button" (click)="cerrarEditor()">Cerrar</button></div>
           <div class="editor-grid">
             @for (field of config.fields; track field.key) {
               <label><span>{{ field.label }}</span>
                 @if (field.type === 'select') {
                   <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="readOnly" required>@for (option of field.options ?? []; track option) { <option [value]="option">{{ option }}</option> }</select>
                 } @else {
                   <input [type]="field.type ?? 'text'" [name]="field.key" [(ngModel)]="draft[field.key]" [readonly]="readOnly" required />
                 }
               </label>
             }
           </div>
           @if (!readOnly) { <div class="form-actions"><button type="button" class="ghost-button" (click)="cerrarEditor()">Cancelar</button><button type="submit" class="primary-button">Guardar</button></div> }
         </form></div>
       }

       <section class="surface">
         @if (isTeacher() && key === 'estudiantes') { <div class="group-filter"><label>Grupo<select [ngModel]="selectedGroupId()" (ngModelChange)="cambiarGrupo($event)">@for (group of grupos.grupos(); track group.id) {<option [value]="group.id">{{ grupos.etiqueta(group) }}</option>}</select></label><span>Periodo activo: {{ grupos.periodoActivo() }}</span></div> }
         <div class="section-heading"><div><h3>{{ pageTitle() }}</h3><p>{{ isTeacher() ? 'Información relacionada con tus asignaciones del periodo actual.' : 'Use las acciones para consultar o modificar registros.' }}</p></div></div>
         <app-data-table [columns]="columns()" [rows]="rows()" (actionSelected)="accion($event)" />
      </section>
    </section>
  `,
  styles: `
     .page-grid { height: 100%; grid-template-rows: auto auto minmax(0, 1fr); }
     .eyebrow { margin: 0 0 .25rem; text-transform: uppercase; letter-spacing: .12em; font-size: .74rem; color: #2f6b9a; font-weight: 700; }
    .section-heading p { margin: .35rem 0 0; color: #667085; }
      .modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:1rem;background:rgba(13,25,39,.52)}
      .editor { width:min(100%,760px);max-height:calc(100vh - 2rem);overflow:auto;border-left:5px solid #2f6b9a; }
     .editor-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
     .group-filter { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1rem; padding:.7rem; background:#f2f7fa; border-radius:7px; }.group-filter label { display:flex; align-items:center; gap:.7rem; }.group-filter span { color:#667085; font-size:.82rem; }
    label { display: grid; gap: .4rem; font-weight: 700; }
    .form-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: 1rem; }
    @media (max-width: 700px) { .editor-grid { grid-template-columns: 1fr; } }
  `,
})
export class FuncionalidadVistaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AutenticacionService);
  private readonly datos = inject(PortalDatosService);
  protected readonly grupos = inject(GruposProfesorService);
  protected readonly key = (this.route.snapshot.routeConfig?.path ?? 'estudiantes') as FuncionalidadAdministrativa;
  protected readonly config = CONFIGURACIONES[this.key];
  protected readonly isAdmin = computed(() => this.auth.currentRole() === 'Administrador');
   protected readonly columns = computed(() => [...this.teacherColumns(), { key: 'acciones', label: 'Acciones', type: 'actions' as const }]);
   protected readonly rows = computed<Array<Record<string, unknown>>>(() => {
     if (this.isTeacher()) return this.teacherRows();
     return this.datos.listar(this.key).map((registro) => ({ ...registro, acciones: this.isAdmin() ? [{ label: 'Ver', code: 'view' }, { label: 'Editar', code: 'edit' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }] : [{ label: 'Ver detalle', code: 'view' }] }));
   });
   protected readonly editorOpen = signal(false);
  protected readOnly = false;
  protected editorTitle = '';
  protected editingId: string | undefined;
  protected draft: Record<string, string> = {};
  protected readonly selectedGroupId = signal(this.grupos.grupoActual()?.id ?? '');
  protected readonly String = String;
  protected readonly isTeacher = computed(() => this.auth.currentRole() !== 'Administrador');
  protected readonly pageTitle = computed(() => this.isTeacher() && this.key === 'asignaturas' ? 'Mis asignaturas' : this.isTeacher() && this.key === 'secciones' ? 'Mis secciones' : this.config.title);
  protected readonly pageSubtitle = computed(() => this.isTeacher() && this.key === 'asignaturas' ? 'Consulta las asignaturas que tienes asignadas en el periodo actual.' : this.isTeacher() && this.key === 'secciones' ? 'Consulta las secciones donde impartes alguna asignatura.' : this.isTeacher() && this.key === 'estudiantes' ? 'Consulta los estudiantes de tus grupos.' : this.config.subtitle);

  protected abrirNuevo(): void {
    this.editingId = undefined;
    this.readOnly = false;
    this.editorTitle = `Registrar ${this.config.singular}`;
    this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, field.options?.[0] ?? '']));
     this.editorOpen.set(true);
  }

  protected accion(event: { action: string; row: Record<string, unknown> }): void {
    const registro = event.row as RegistroPortal;
    if (event.action === 'delete' && this.isAdmin()) {
      if (confirm(`¿Eliminar ${registro['nombre'] ?? this.config.singular}?`)) this.datos.eliminarRegistro(this.key, registro.id);
      return;
    }
    this.editingId = registro.id;
    this.readOnly = event.action === 'view' || !this.isAdmin();
    this.editorTitle = this.readOnly ? `Detalle de ${this.config.singular}` : `Editar ${this.config.singular}`;
    this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, registro[field.key] ?? '']));
     this.editorOpen.set(true);
  }

  protected guardar(): void {
    this.datos.guardarRegistro(this.key, this.draft, this.editingId);
    this.cerrarEditor();
  }

  protected cerrarEditor(): void {
     this.editorOpen.set(false);
  }

  private teacherName(): string {
    const username = this.auth.currentUsername();
    return this.datos.listar('profesores').find((item) => item['nombre'] === username)?.['nombre'] ?? this.datos.listar('asignaciones').find((item) => item['estado'] === 'Activa')?.['profesor'] ?? username;
  }

  private activeAssignments(): RegistroPortal[] {
    const period = this.datos.listar('periodos').find((item) => item['estado'] === 'Activo')?.['nombre'];
    return this.datos.listar('asignaciones').filter((item) => item['profesor'] === this.teacherName() && item['periodo'] === period && item['estado'] === 'Activa');
  }

  private teacherColumns(): ColumnaTabla[] {
    if (!this.isTeacher()) return this.config.columns;
    if (this.key === 'asignaturas') return [{ key: 'nombre', label: 'Asignatura' }, { key: 'escala', label: 'Escala' }, { key: 'secciones', label: 'Secciones' }];
    if (this.key === 'secciones') return [{ key: 'nombre', label: 'Sección' }, { key: 'nivel', label: 'Nivel' }, { key: 'asignaturas', label: 'Asignaturas' }, { key: 'estudiantes', label: 'Estudiantes' }];
    if (this.key === 'estudiantes') return [{ key: 'nombre', label: 'Estudiante' }, { key: 'cedula', label: 'Identificación' }];
    return this.config.columns;
  }

  private teacherRows(): Array<Record<string, unknown>> {
    const assignments = this.activeAssignments();
    if (this.key === 'asignaturas') {
      return [...new Set(assignments.map((item) => item['asignatura']))].map((name) => {
        const subject = this.datos.listar('asignaturas').find((item) => item['nombre'] === name);
        return { id: `subject-${name}`, nombre: name, escala: subject?.['escala'] === '1-100' ? '1–100' : subject?.['escala'] === 'A-E' ? 'A–E' : '1–7', secciones: assignments.filter((item) => item['asignatura'] === name).length, acciones: [{ label: 'Ver grupos', code: 'view' }] };
      });
    }
    if (this.key === 'secciones') {
      return [...new Set(assignments.map((item) => item['seccion']))].map((name) => ({ id: `section-${name}`, nombre: name, nivel: this.datos.listar('secciones').find((item) => item['nombre'] === name)?.['nivel'] ?? '-', asignaturas: assignments.filter((item) => item['seccion'] === name).map((item) => item['asignatura']).join(', '), estudiantes: this.datos.estudiantes().filter((item) => item['seccion'] === name).length, acciones: [{ label: 'Abrir', code: 'view' }] }));
    }
    if (this.key === 'estudiantes') {
      const selected = this.grupos.grupos().find((group) => group.id === this.selectedGroupId());
      const sections = new Set(selected ? [selected.seccion] : assignments.map((item) => item['seccion']));
      return this.datos.estudiantes().filter((item) => sections.has(item['seccion'])).map((item) => ({ ...item, acciones: [{ label: 'Ver', code: 'view' }] }));
    }
    return this.datos.listar(this.key).map((item) => ({ ...item, acciones: [{ label: 'Ver', code: 'view' }] }));
  }

  protected cambiarGrupo(id: string): void { this.selectedGroupId.set(id); this.grupos.seleccionar(id); }
}
