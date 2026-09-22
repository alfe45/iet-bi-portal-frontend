import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataTableComponent } from '../compartidos/componentes/tabla-datos.component';
import { StatGridComponent } from '../compartidos/componentes/cuadricula-estadisticas.component';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { FuncionalidadAdministrativa, PortalDatosService, RegistroPortal } from '../nucleo/datos/portal-datos.service';
import { ColumnaTabla } from '../nucleo/modelos/modelos-prototipo';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';
import { ProfesoresApiService, ProfesorRequest } from '../nucleo/api/profesores-api.service';
import { EstudiantesApiService, EstudianteApi, EstudianteRequest } from '../nucleo/api/estudiantes-api.service';
import { MatriculasApiService, MatriculaNivel10Request } from '../nucleo/api/matriculas-api.service';
import { SeccionesApiService, SeccionApi, SeccionRequest } from '../nucleo/api/secciones-api.service';
import { CursosLectivosApiService, CursoLectivoApi, CursoLectivoRequest } from '../nucleo/api/cursos-lectivos-api.service';
import { forkJoin } from 'rxjs';

interface CampoFormulario {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'password' | 'select';
  options?: string[];
  required?: boolean;
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
  profesores: { title: 'Profesores', singular: 'profesor', subtitle: 'Administre la información del personal docente.', columns: [{ key: 'nombreCompleto', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'correo', label: 'Correo' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'primerApellido', label: 'Primer apellido' }, { key: 'segundoApellido', label: 'Segundo apellido', required: false }, { key: 'cedula', label: 'Cédula' }, { key: 'numeroCelular', label: 'Número celular', required: false }, { key: 'correo', label: 'Correo', type: 'email' }, { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date' }, { key: 'password', label: 'Contraseña', type: 'password' }, { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS }] },
  estudiantes: { title: 'Estudiantes', singular: 'estudiante', subtitle: 'Consulte y administre los estudiantes registrados.', columns: [{ key: 'nombreCompleto', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'correo', label: 'Correo' }, { key: 'fechaNacimiento', label: 'Fecha de nacimiento' }], fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'primerApellido', label: 'Primer apellido' }, { key: 'segundoApellido', label: 'Segundo apellido', required: false }, { key: 'cedula', label: 'Cédula' }, { key: 'numeroCelular', label: 'Número celular', required: false }, { key: 'correo', label: 'Correo', type: 'email' }, { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date' }] },
  periodos: { title: 'Cursos lectivos', singular: 'curso lectivo', subtitle: 'Configure los cursos lectivos y sus semestres.', columns: [{ key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'fechaInicio', label: 'Inicio' }, { key: 'fechaFin', label: 'Fin' }], fields: [{ key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'fechaInicioI', label: 'Inicio del I semestre', type: 'date' }, { key: 'fechaFinI', label: 'Fin del I semestre', type: 'date' }, { key: 'fechaInicioII', label: 'Inicio del II semestre', type: 'date' }, { key: 'fechaFinII', label: 'Fin del II semestre', type: 'date' }] },
  secciones: { title: 'Secciones académicas', singular: 'sección', subtitle: 'Administre las secciones de cada curso lectivo.', columns: [{ key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'seccion', label: 'Sección' }], fields: [{ key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'nivel', label: 'Nivel' }, { key: 'numeroSeccion', label: 'Número de sección' }] },
  matriculas: { title: 'Matrículas', singular: 'matrícula', subtitle: 'Administre las matrículas de estudiantes en secciones.', columns: [{ key: 'estudiante', label: 'Estudiante' }, { key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'seccion', label: 'Sección' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'cedulaEstudiante', label: 'Estudiante' }, { key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'numeroSeccion', label: 'Número de sección' }] },
  escalas: { title: 'Tipos de escala', singular: 'escala', subtitle: 'Administre las escalas utilizadas en las asignaturas.', columns: [{ key: 'nombre', label: 'Nombre' }, { key: 'rango', label: 'Rango' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'rango', label: 'Rango' }, { key: 'estado', label: 'Estado', type: 'select', options: ['Activa', 'Inactiva'] }] },
  asignaturas: { title: 'Asignaturas', singular: 'asignatura', subtitle: 'Consulte y administre el catálogo de asignaturas.', columns: [{ key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción' }, { key: 'escala', label: 'Escala' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción' }, { key: 'escala', label: 'Escala', type: 'select', options: ['1-7', '1-100', 'A-E'] }, { key: 'estado', label: 'Estado', type: 'select', options: ['Activa', 'Inactiva'] }] },
  asignaciones: { title: 'Asignación académica', singular: 'asignación', subtitle: 'Administre la relación entre profesor, asignatura y sección.', columns: [{ key: 'profesor', label: 'Profesor' }, { key: 'asignatura', label: 'Asignatura' }, { key: 'seccion', label: 'Sección' }, { key: 'periodo', label: 'Periodo' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'profesor', label: 'Profesor' }, { key: 'asignatura', label: 'Asignatura' }, { key: 'seccion', label: 'Sección' }, { key: 'periodo', label: 'Periodo' }, { key: 'estado', label: 'Estado', type: 'select', options: ['Activa', 'Inactiva'] }] },
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
          <div class="modal-backdrop" role="presentation"><form class="surface editor" (ngSubmit)="guardar()" novalidate role="dialog" aria-modal="true" aria-labelledby="crud-editor-title">
           <div class="section-heading"><div><h3 id="crud-editor-title">{{ editorTitle }}</h3><p>Los cambios se guardan en este navegador.</p></div><button type="button" class="ghost-button" (click)="cerrarEditor()">Cerrar</button></div>
           <div class="editor-grid">
             @for (field of config.fields; track field.key) {
                <label [class.student-field]="key === 'matriculas' && field.key === 'cedulaEstudiante'" [class.course-field]="(key === 'matriculas' || key === 'secciones') && field.key === 'yearCiclo'"><span>{{ field.label }}</span>
                  @if (key === 'matriculas' && field.key === 'cedulaEstudiante') {
                    <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione un estudiante</option>@for (student of estudiantesDisponiblesMatricula(); track student.cedula) { <option [value]="student.cedula">{{ nombreCompletoEstudiante(student) }} · {{ student.cedula }}</option> }</select>
                  } @else if (key === 'matriculas' && field.key === 'yearCiclo') {
                    <select [name]="field.key" [(ngModel)]="draft[field.key]" (ngModelChange)="cambioCursoLectivo($event)" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione un curso lectivo</option>@for (course of cursosDisponiblesMatricula(); track course.idCursoLectivo) { <option [value]="course.yearCiclo">{{ cursoLectivoLabel(course) }}</option> }</select>
                  } @else if (key === 'secciones' && field.key === 'yearCiclo') {
                    <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione un curso lectivo</option>@for (course of cursosDisponiblesMatricula(); track course.idCursoLectivo) { <option [value]="course.yearCiclo">{{ cursoLectivoLabel(course) }}</option> }</select>
                  } @else if (key === 'secciones' && field.key === 'nivel') {
                    <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione un nivel</option><option value="10">Décimo</option><option value="11">Undécimo</option></select>
                  } @else if (key === 'matriculas' && field.key === 'numeroSeccion') {
                    <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione una sección</option>@for (section of seccionesDisponiblesMatricula(); track section.idSeccion) { <option [value]="numeroSeccion(section.seccion)">{{ section.seccion }}</option> }</select>
                  } @else if (field.type === 'select') {
                    <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="readOnly" [required]="field.required ?? true">@for (option of field.options ?? []; track option) { <option [value]="option">{{ option }}</option> }</select>
                  } @else {
                    @if (field.type === 'password') { <span class="password-input"><input [type]="showPassword() ? 'text' : 'password'" [name]="field.key" [(ngModel)]="draft[field.key]" [readonly]="readOnly" [required]="field.required ?? true" /><span class="password-visibility"><input type="checkbox" [checked]="showPassword()" (change)="showPassword.set($any($event.target).checked)" /> Mostrar contraseña</span></span> } @else { <input [type]="field.type ?? 'text'" [name]="field.key" [(ngModel)]="draft[field.key]" [readonly]="readOnly" [required]="field.required ?? true" /> }
                  }
                  @if (fieldError(field.key)) { <small class="field-error" role="alert">{{ fieldError(field.key) }}</small> }
                </label>
             }
           </div>
            @if (apiError && !readOnly) { <p class="api-error" role="alert">{{ apiError }}</p> }
            @if (!readOnly) { <div class="form-actions"><button type="button" class="ghost-button" (click)="cerrarEditor()">Cancelar</button><button type="submit" class="primary-button">Guardar</button></div> }
         </form></div>
       }

       <section class="surface">
         @if (isTeacher() && key === 'estudiantes') { <div class="group-filter"><label>Grupo<select [ngModel]="selectedGroupId()" (ngModelChange)="cambiarGrupo($event)">@for (group of grupos.grupos(); track group.id) {<option [value]="group.id">{{ grupos.etiqueta(group) }}</option>}</select></label><span>Periodo activo: {{ grupos.periodoActivo() }}</span></div> }
         <div class="section-heading"><div><h3>{{ pageTitle() }}</h3><p>{{ isTeacher() ? 'Información relacionada con tus asignaciones del periodo actual.' : 'Use las acciones para consultar o modificar registros.' }}</p></div></div>
           @if (apiError && !editorOpen()) { <p class="api-error" role="alert">{{ apiError }}</p> }
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
     .editor-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .7rem .85rem; }
     .student-field, .course-field { grid-column: span 2; }.student-field select, .course-field select { width: 100%; min-width: 0; }
     .group-filter { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1rem; padding:.7rem; background:#f2f7fa; border-radius:7px; }.group-filter label { display:flex; align-items:center; gap:.7rem; }.group-filter span { color:#667085; font-size:.82rem; }
     label { display: grid; gap: .25rem; font-weight: 700; }
     .form-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: 1rem; }
     .field-error { display: block; color: #b42318; font-size: .72rem; line-height: 1.2; font-weight: 600; }
     .password-input { display: grid; gap: .4rem; }.password-visibility { display: flex; align-items: center; gap: .4rem; color: #475467; font-size: .8rem; font-weight: 600; }.password-visibility input { width: auto; }
     @media (max-width: 900px) { .editor-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .student-field, .course-field { grid-column: span 2; } }
     @media (max-width: 700px) { .editor-grid { grid-template-columns: 1fr; } .student-field, .course-field { grid-column: span 1; } }
  `,
})
// Administra los formularios y tablas de las funcionalidades seleccionadas.
export class FuncionalidadVistaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AutenticacionService);
  private readonly datos = inject(PortalDatosService);
  private readonly profesoresApi = inject(ProfesoresApiService);
  private readonly estudiantesApi = inject(EstudiantesApiService);
    private readonly matriculasApi = inject(MatriculasApiService);
    private readonly seccionesApi = inject(SeccionesApiService);
    private readonly cursosLectivosApi = inject(CursosLectivosApiService);
  protected readonly grupos = inject(GruposProfesorService);
  protected readonly key = (this.route.snapshot.routeConfig?.path ?? 'estudiantes') as FuncionalidadAdministrativa;
  protected readonly config = CONFIGURACIONES[this.key];
   protected readonly isAdmin = computed(() => this.auth.currentRole() === 'Administrador');
    private readonly profesoresApiRows = signal<Array<Record<string, unknown>>>([]);
    private readonly estudiantesApiRows = signal<Array<Record<string, unknown>>>([]);
    private readonly matriculasApiRows = signal<Array<Record<string, unknown>>>([]);
    private readonly estudiantesMatricula = signal<EstudianteApi[]>([]);
    private readonly seccionesMatricula = signal<SeccionApi[]>([]);
    private readonly cursosLectivosMatricula = signal<CursoLectivoApi[]>([]);
    private readonly cursosApiRows = signal<Array<Record<string, unknown>>>([]);
    private readonly seccionesApiRows = signal<Array<Record<string, unknown>>>([]);
   protected apiError = '';
   protected readonly columns = computed(() => [...this.teacherColumns(), { key: 'acciones', label: 'Acciones', type: 'actions' as const }]);
   protected readonly rows = computed<Array<Record<string, unknown>>>(() => {
       if (this.isTeacher()) return this.teacherRows();
       if (this.key === 'profesores') return this.profesoresApiRows();
       if (this.key === 'estudiantes') return this.estudiantesApiRows();
       if (this.key === 'matriculas') return this.matriculasApiRows();
       if (this.key === 'periodos') return this.cursosApiRows();
       if (this.key === 'secciones') return this.seccionesApiRows();
      return this.datos.listar(this.key).map((registro) => ({ ...registro, acciones: this.isAdmin() ? [{ label: 'Ver', code: 'view' }, { label: 'Editar', code: 'edit' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }] : [{ label: 'Ver detalle', code: 'view' }] }));
   });
   protected readonly editorOpen = signal(false);
  protected readOnly = false;
   protected editorTitle = '';
   protected editingId: string | undefined;
   protected draft: Record<string, string> = {};
   protected validationAttempted = false;
   protected readonly showPassword = signal(false);
  protected readonly selectedGroupId = signal(this.grupos.grupoActual()?.id ?? '');
  protected readonly String = String;
  protected readonly isTeacher = computed(() => this.auth.currentRole() !== 'Administrador');
  protected readonly pageTitle = computed(() => this.isTeacher() && this.key === 'asignaturas' ? 'Mis asignaturas' : this.isTeacher() && this.key === 'secciones' ? 'Mis secciones' : this.config.title);
   protected readonly pageSubtitle = computed(() => this.isTeacher() && this.key === 'asignaturas' ? 'Consulta las asignaturas que tienes asignadas en el periodo actual.' : this.isTeacher() && this.key === 'secciones' ? 'Consulta las secciones donde impartes alguna asignatura.' : this.isTeacher() && this.key === 'estudiantes' ? 'Consulta los estudiantes de tus grupos.' : this.config.subtitle);

    constructor() {
      if (this.isAdmin() && this.key === 'profesores') this.cargarProfesores();
      if (this.isAdmin() && this.key === 'estudiantes') this.cargarEstudiantes();
      if (this.isAdmin() && this.key === 'matriculas') this.cargarMatriculas();
      if (this.isAdmin() && this.key === 'matriculas') this.cargarSecciones();
      if (this.isAdmin() && this.key === 'matriculas') this.cargarCursosLectivos();
      if (this.isAdmin() && this.key === 'secciones') this.cargarCursosLectivos();
      if (this.isAdmin() && this.key === 'periodos') this.cargarCursosAdministracion();
      if (this.isAdmin() && this.key === 'secciones') this.cargarSeccionesAdministracion();
    }

  protected abrirNuevo(): void {
    this.editingId = undefined;
    this.readOnly = false;
    this.validationAttempted = false;
    this.apiError = '';
    this.showPassword.set(false);
    this.editorTitle = `Registrar ${this.config.singular}`;
    this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, field.options?.[0] ?? '']));
    if (this.key === 'matriculas') this.draft['yearCiclo'] = String(new Date().getFullYear());
    if (this.key === 'secciones') this.draft['yearCiclo'] = String(new Date().getFullYear());
      this.editorOpen.set(true);
  }

  protected accion(event: { action: string; row: Record<string, unknown> }): void {
    const registro = event.row as RegistroPortal;
    if (this.isAdmin() && this.key === 'profesores') { this.accionProfesor(event.action, registro); return; }
    if (this.isAdmin() && this.key === 'estudiantes') { this.accionEstudiante(event.action, registro); return; }
    if (this.isAdmin() && this.key === 'matriculas') { this.accionMatricula(event.action, registro); return; }
    if (this.isAdmin() && this.key === 'periodos') { this.accionCursoLectivo(event.action, registro); return; }
    if (this.isAdmin() && this.key === 'secciones') { this.accionSeccion(event.action, registro); return; }
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
    if (this.isAdmin() && this.key === 'profesores') { this.guardarProfesor(); return; }
    if (this.isAdmin() && this.key === 'estudiantes') { this.guardarEstudiante(); return; }
    if (this.isAdmin() && this.key === 'matriculas') { this.guardarMatricula(); return; }
    if (this.isAdmin() && this.key === 'periodos') { this.guardarCursoLectivo(); return; }
    if (this.isAdmin() && this.key === 'secciones') { this.guardarSeccion(); return; }
    this.datos.guardarRegistro(this.key, this.draft, this.editingId);
    this.cerrarEditor();
  }

  protected cerrarEditor(): void {
     this.editorOpen.set(false);
  }

     private cargarProfesores(): void {
     this.apiError = '';
      this.profesoresApi.listar().subscribe({ next: (items) => this.profesoresApiRows.set(items.map((item) => ({ id: String(item.idProfesor), nombre: item.nombre, nombreCompleto: [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' '), cedula: item.cedula, correo: item.email, estado: item.activo ? 'Activo' : 'Inactivo', numeroCelular: item.numeroCelular ?? '', fechaNacimiento: item.fechaNacimiento, primerApellido: item.primerApellido, segundoApellido: item.segundoApellido ?? '', password: '', acciones: [{ label: 'Ver', code: 'view' }, { label: 'Editar', code: 'edit' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }] }))), error: () => this.apiError = 'No se pudo conectar con el backend de profesores.' });
   }

   private cargarEstudiantes(): void {
     this.apiError = '';
     this.estudiantesApi.listar().subscribe({ next: (items) => this.estudiantesApiRows.set(items.map((item) => ({ id: String(item.idEstudiante), nombre: item.nombre, nombreCompleto: [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' '), cedula: item.cedula, correo: item.email, numeroCelular: item.numeroCelular ?? '', fechaNacimiento: item.fechaNacimiento, primerApellido: item.primerApellido, segundoApellido: item.segundoApellido ?? '', acciones: [{ label: 'Ver', code: 'view' }, { label: 'Editar', code: 'edit' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }] }))), error: () => this.apiError = 'No se pudo conectar con el backend de estudiantes.' });
   }

   private cargarMatriculas(): void {
     this.apiError = '';
     this.estudiantesApi.listar().subscribe({ next: (students) => {
       this.estudiantesMatricula.set(students);
       if (!students.length) { this.matriculasApiRows.set([]); return; }
       forkJoin(students.map((student) => this.matriculasApi.listarPorCedula(student.cedula))).subscribe({
         next: (groups) => this.matriculasApiRows.set(groups.flatMap((items, index) => items.map((item) => ({ id: String(item.idMatricula), estudiante: [students[index].nombre, students[index].primerApellido, students[index].segundoApellido].filter(Boolean).join(' '), cedulaEstudiante: students[index].cedula, yearCiclo: item.yearCiclo, seccion: item.seccion, estado: item.estado, idMatricula: item.idMatricula, acciones: item.estado === 'FINALIZADA' ? [{ label: 'Eliminar', code: 'delete', tone: 'danger' }] : [{ label: 'Finalizar', code: 'finalize' }, { label: 'Subir a undécimo', code: 'promote' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }] })))),
         error: () => this.apiError = 'No se pudieron consultar las matrículas.'
       });
     }, error: () => this.apiError = 'No se pudo consultar la lista de estudiantes.' });
   }

   private cargarSecciones(): void {
     this.seccionesApi.listar().subscribe({ next: (sections) => this.seccionesMatricula.set(sections), error: () => this.apiError = 'No se pudieron consultar las secciones.' });
   }

   private cargarCursosLectivos(): void {
     this.cursosLectivosApi.listar().subscribe({ next: (courses) => this.cursosLectivosMatricula.set(courses), error: () => this.apiError = 'No se pudieron consultar los cursos lectivos.' });
   }

   private cargarCursosAdministracion(): void {
     this.cursosLectivosApi.listar().subscribe({ next: (courses) => this.cursosApiRows.set(courses.map((course) => ({ id: String(course.idCursoLectivo), yearCiclo: course.yearCiclo, fechaInicio: this.formatearFecha(course.fechaInicio), fechaFin: this.formatearFecha(course.fechaFin), fechaInicioI: '', fechaFinI: '', fechaInicioII: '', fechaFinII: '', acciones: [{ label: 'Ver', code: 'view' }, { label: 'Editar', code: 'edit' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }] }))), error: () => this.apiError = 'No se pudieron consultar los cursos lectivos.' });
   }

   private cargarSeccionesAdministracion(): void {
     this.seccionesApi.listar().subscribe({ next: (sections) => this.seccionesApiRows.set(sections.map((section) => { const parts = section.seccion.split('-'); return { id: String(section.idSeccion), yearCiclo: section.yearCiclo, seccion: section.seccion, nivel: parts[0], numeroSeccion: parts[1], acciones: [{ label: 'Ver', code: 'view' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }] }; })), error: () => this.apiError = 'No se pudieron consultar las secciones.' });
   }

  private accionProfesor(action: string, registro: RegistroPortal): void {
    if (action === 'view' || action === 'edit') {
      this.editingId = registro.id;
      this.readOnly = action === 'view';
      this.editorTitle = this.readOnly ? 'Detalle de profesor' : 'Editar profesor';
      this.validationAttempted = false;
      this.apiError = '';
      this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, registro[field.key] ?? '']));
      this.draft['cedulaOriginal'] = String(registro['cedula'] ?? '');
      this.editorOpen.set(true);
      return;
    }
     if (action === 'delete' && confirm(`¿Eliminar al profesor ${registro['nombre']}?`)) this.profesoresApi.borrar(String(registro['cedula'])).subscribe({ next: () => { this.datos.eliminarAsignacionesDeProfesor(String(registro['cedula'])); this.cargarProfesores(); }, error: () => this.apiError = 'No se pudo eliminar el profesor.' });
  }

  private guardarProfesor(): void {
    this.validationAttempted = true;
    const validation = this.validarProfesorDraft();
    if (validation) { this.apiError = validation; return; }
    const request = this.profesorRequest();
    const operation = this.editingId ? this.profesoresApi.actualizar(String(this.draft['cedulaOriginal'] ?? this.draft['cedula']), request) : this.profesoresApi.registrar(request);
    operation.subscribe({ next: () => this.sincronizarEstadoProfesor(request.cedula), error: () => this.apiError = 'No se pudo guardar el profesor.' });
   }

   private accionEstudiante(action: string, registro: RegistroPortal): void {
     if (action === 'view' || action === 'edit') {
       this.editingId = registro.id;
       this.readOnly = action === 'view';
       this.editorTitle = this.readOnly ? 'Detalle de estudiante' : 'Editar estudiante';
       this.validationAttempted = false;
       this.apiError = '';
       this.showPassword.set(false);
       this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, registro[field.key] ?? '']));
       this.draft['cedulaOriginal'] = String(registro['cedula'] ?? '');
       this.editorOpen.set(true);
       return;
     }
     if (action === 'delete' && confirm(`¿Eliminar al estudiante ${registro['nombreCompleto']}?`)) this.estudiantesApi.borrar(String(registro['cedula'])).subscribe({ next: () => this.cargarEstudiantes(), error: () => this.apiError = 'No se pudo eliminar el estudiante.' });
   }

   private guardarEstudiante(): void {
     this.validationAttempted = true;
     const validation = this.validarEstudianteDraft();
     if (validation) { this.apiError = validation; return; }
     const request = this.estudianteRequest();
     const operation = this.editingId ? this.estudiantesApi.actualizar(String(this.draft['cedulaOriginal'] ?? this.draft['cedula']), request) : this.estudiantesApi.registrar(request);
     operation.subscribe({ next: () => { this.cerrarEditor(); this.cargarEstudiantes(); }, error: () => this.apiError = 'No se pudo guardar el estudiante.' });
   }

   private estudianteRequest(): EstudianteRequest {
     return { nombre: String(this.draft['nombre'] ?? ''), primerApellido: String(this.draft['primerApellido'] ?? ''), segundoApellido: String(this.draft['segundoApellido'] ?? '') || null, cedula: String(this.draft['cedula'] ?? ''), numeroCelular: String(this.draft['numeroCelular'] ?? '') || null, email: String(this.draft['correo'] ?? ''), fechaNacimiento: String(this.draft['fechaNacimiento'] ?? '') };
   }

   protected fieldError(key: string): string {
       if (!this.validationAttempted || this.readOnly || !['profesores', 'estudiantes', 'matriculas', 'periodos', 'secciones'].includes(this.key)) return '';
       const value = String(this.draft[key] ?? '').trim();
       const required = new Set(this.key === 'profesores' ? ['nombre', 'primerApellido', 'cedula', 'correo', 'fechaNacimiento', 'password'] : this.key === 'estudiantes' ? ['nombre', 'primerApellido', 'cedula', 'correo', 'fechaNacimiento'] : this.key === 'matriculas' ? ['cedulaEstudiante', 'yearCiclo', 'numeroSeccion'] : this.key === 'periodos' ? ['yearCiclo', 'fechaInicioI', 'fechaFinI', 'fechaInicioII', 'fechaFinII'] : ['yearCiclo', 'nivel', 'numeroSeccion']);
       const labels: Record<string, string> = { nombre: 'Nombre', primerApellido: 'Primer apellido', cedula: 'Cédula', correo: 'Correo electrónico', fechaNacimiento: 'Fecha de nacimiento', password: 'Contraseña', cedulaEstudiante: 'Cédula del estudiante', yearCiclo: 'Curso lectivo', nivel: 'Nivel', numeroSeccion: 'Número de sección', fechaInicioI: 'Inicio del I semestre', fechaFinI: 'Fin del I semestre', fechaInicioII: 'Inicio del II semestre', fechaFinII: 'Fin del II semestre' };
      const label = labels[key] ?? key;
      if (required.has(key) && !value) return `El campo '${label}' es obligatorio y no puede estar vacío.`;
      if ((key === 'nombre' || key === 'primerApellido') && value.length > 0 && value.length < 2) return `El campo '${label}' debe tener al menos 2 caracteres.`;
      if ((key === 'cedula' || key === 'cedulaEstudiante') && value.length > 0 && value.length < 5) return `El campo '${label}' debe tener al menos 5 caracteres.`;
      if (this.key === 'matriculas' && (key === 'yearCiclo' || key === 'numeroSeccion') && value && (!Number.isInteger(Number(value)) || Number(value) <= 0)) return `El campo '${label}' debe ser un número válido mayor que cero.`;
      if (key === 'correo' && value && !/^\S+@\S+\.\S+$/.test(value)) return "El campo 'Correo electrónico' no tiene un formato válido.";
     if (key === 'fechaNacimiento' && value) {
       const today = new Date();
       const minDate = this.key === 'estudiantes' ? new Date(today.getFullYear() - 19, today.getMonth(), today.getDate()) : new Date('1900-01-01T00:00:00');
       const maxDate = this.key === 'estudiantes' ? new Date(today.getFullYear() - 16, today.getMonth(), today.getDate()) : today;
       const date = new Date(`${value}T00:00:00`);
       if (this.key === 'estudiantes' && (date < minDate || date > maxDate)) return "El campo 'fechaNacimiento' debe corresponder a una edad entre 16 y 19 años.";
       if (this.key === 'profesores' && (value < '1900-01-01' || date > maxDate)) return "El campo 'fechaNacimiento' debe estar entre 1900-01-01 y hoy.";
     }
     return '';
   }

   private validarEstudianteDraft(): string | null {
     if (!String(this.draft['nombre'] ?? '').trim()) return "El campo 'nombre' es obligatorio y no puede estar vacío.";
     if (!String(this.draft['primerApellido'] ?? '').trim()) return "El campo 'primerApellido' es obligatorio y no puede estar vacío.";
     if (!String(this.draft['cedula'] ?? '').trim()) return "El campo 'cedula' es obligatorio y no puede estar vacío.";
     if (!String(this.draft['correo'] ?? '').trim()) return "El campo 'correo' es obligatorio y no puede estar vacío.";
     if (!String(this.draft['fechaNacimiento'] ?? '').trim()) return "El campo 'fechaNacimiento' es obligatorio y no puede estar vacío.";
     if (String(this.draft['nombre'] ?? '').trim().length < 2 || String(this.draft['primerApellido'] ?? '').trim().length < 2) return 'El nombre y el primer apellido deben tener al menos 2 caracteres.';
     if (String(this.draft['cedula'] ?? '').trim().length < 5) return 'La cédula debe tener al menos 5 caracteres.';
     if (!/^\S+@\S+\.\S+$/.test(String(this.draft['correo'] ?? '').trim())) return 'Escriba un correo electrónico válido.';
     const birthDate = String(this.draft['fechaNacimiento'] ?? '');
     const today = new Date();
     const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
     const minDate = new Date(today.getFullYear() - 19, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
     if (!birthDate || birthDate < minDate || birthDate > maxDate) return 'El estudiante debe tener entre 16 y 19 años.';
     return null;
   }

   private sincronizarEstadoProfesor(cedula: string): void {
     const operation = this.draft['estado'] === 'Inactivo' ? this.profesoresApi.desactivar(cedula) : this.profesoresApi.activar(cedula);
     operation.subscribe({ next: () => { this.cerrarEditor(); this.cargarProfesores(); }, error: () => this.apiError = 'El profesor se guardó, pero no se pudo actualizar su estado.' });
   }

  private profesorRequest(): ProfesorRequest {
     return { nombre: String(this.draft['nombre'] ?? ''), primerApellido: String(this.draft['primerApellido'] ?? ''), segundoApellido: String(this.draft['segundoApellido'] ?? '') || null, cedula: String(this.draft['cedula'] ?? ''), numeroCelular: String(this.draft['numeroCelular'] ?? '') || null, email: String(this.draft['correo'] ?? ''), fechaNacimiento: String(this.draft['fechaNacimiento'] ?? ''), password: String(this.draft['password'] ?? '') };
  }

   private validarProfesorDraft(): string | null {
    if (!String(this.draft['nombre'] ?? '').trim()) return "El campo 'nombre' es obligatorio y no puede estar vacío.";
    if (!String(this.draft['primerApellido'] ?? '').trim()) return "El campo 'primerApellido' es obligatorio y no puede estar vacío.";
    if (!String(this.draft['cedula'] ?? '').trim()) return "El campo 'cedula' es obligatorio y no puede estar vacío.";
    if (!String(this.draft['correo'] ?? '').trim()) return "El campo 'correo' es obligatorio y no puede estar vacío.";
    if (!String(this.draft['fechaNacimiento'] ?? '').trim()) return "El campo 'fechaNacimiento' es obligatorio y no puede estar vacío.";
    if (!String(this.draft['password'] ?? '').trim()) return "El campo 'password' es obligatorio y no puede estar vacío.";
    if (String(this.draft['nombre'] ?? '').trim().length < 2 || String(this.draft['primerApellido'] ?? '').trim().length < 2) return 'El nombre y el primer apellido deben tener al menos 2 caracteres.';
    if (String(this.draft['cedula'] ?? '').trim().length < 5) return 'La cédula debe tener al menos 5 caracteres.';
    if (!/^\S+@\S+\.\S+$/.test(String(this.draft['correo'] ?? '').trim())) return 'Escriba un correo electrónico válido.';
    const birthDate = String(this.draft['fechaNacimiento'] ?? '');
    if (!birthDate || birthDate < '1900-01-01' || birthDate > new Date().toISOString().slice(0, 10)) return 'La fecha de nacimiento debe estar entre 1900-01-01 y hoy.';
    if (!String(this.draft['password'] ?? '').trim()) return 'La contraseña es obligatoria.';
    return null;
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

   private accionMatricula(action: string, registro: RegistroPortal): void {
     const id = Number(registro['idMatricula']);
     if (action === 'finalize' && confirm('¿Finalizar esta matrícula?')) this.matriculasApi.finalizar(id).subscribe({ next: () => this.cargarMatriculas(), error: () => this.apiError = 'No se pudo finalizar la matrícula.' });
     if (action === 'promote' && confirm('¿Subir este estudiante a undécimo?')) this.matriculasApi.registrarNivel11(String(registro['cedulaEstudiante'])).subscribe({ next: () => this.cargarMatriculas(), error: () => this.apiError = 'No se pudo subir el estudiante a undécimo.' });
     if (action === 'delete' && confirm('¿Eliminar esta matrícula?')) this.matriculasApi.borrar(id).subscribe({ next: () => this.cargarMatriculas(), error: () => this.apiError = 'No se pudo eliminar la matrícula.' });
   }

   private guardarMatricula(): void {
     this.validationAttempted = true;
     const error = this.validarMatriculaDraft();
     if (error) { this.apiError = error; return; }
     const request: MatriculaNivel10Request = { cedulaEstudiante: String(this.draft['cedulaEstudiante'] ?? '').trim(), yearCiclo: Number(this.draft['yearCiclo']), numeroSeccion: Number(this.draft['numeroSeccion']) };
     this.matriculasApi.registrarNivel10(request).subscribe({ next: () => { this.cerrarEditor(); this.cargarMatriculas(); }, error: () => this.apiError = 'No se pudo registrar la matrícula.' });
   }

   private validarMatriculaDraft(): string | null {
     const cedula = String(this.draft['cedulaEstudiante'] ?? '').trim();
     if (!cedula) return "El campo 'Cédula del estudiante' es obligatorio y no puede estar vacío.";
     if (cedula.length < 5) return "El campo 'Cédula del estudiante' debe tener al menos 5 caracteres.";
     const year = String(this.draft['yearCiclo'] ?? '').trim();
      if (!year) return "El campo 'Curso lectivo' es obligatorio y no puede estar vacío.";
      if (!Number.isInteger(Number(year)) || Number(year) <= 0) return "El campo 'Curso lectivo' debe ser válido.";
     const section = String(this.draft['numeroSeccion'] ?? '').trim();
     if (!section) return "El campo 'Número de sección' es obligatorio y no puede estar vacío.";
     if (!Number.isInteger(Number(section)) || Number(section) <= 0) return "El campo 'Número de sección' debe ser mayor que cero.";
     return null;
   }

   private accionCursoLectivo(action: string, registro: RegistroPortal): void {
     if (action === 'view' || action === 'edit') {
       this.editingId = registro.id;
       this.readOnly = action === 'view';
       this.editorTitle = this.readOnly ? 'Detalle de curso lectivo' : 'Editar curso lectivo';
       this.validationAttempted = false;
       this.apiError = '';
       this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, String(registro[field.key] ?? '')]));
       this.editorOpen.set(true);
       return;
     }
     if (action === 'delete' && confirm(`¿Eliminar el curso lectivo ${registro['yearCiclo']}?`)) this.cursosLectivosApi.borrar(Number(registro['yearCiclo'])).subscribe({ next: () => this.cargarCursosAdministracion(), error: () => this.apiError = 'No se pudo eliminar el curso lectivo.' });
   }

   private guardarCursoLectivo(): void {
     this.validationAttempted = true;
     const error = this.validarCursoLectivoDraft();
     if (error) { this.apiError = error; return; }
     const request: CursoLectivoRequest = { yearCiclo: Number(this.draft['yearCiclo']), fechaInicioI: this.draft['fechaInicioI'], fechaFinI: this.draft['fechaFinI'], fechaInicioII: this.draft['fechaInicioII'], fechaFinII: this.draft['fechaFinII'] };
     const operation = this.editingId ? this.cursosLectivosApi.actualizar(request) : this.cursosLectivosApi.abrir(request);
     operation.subscribe({ next: () => { this.cerrarEditor(); this.cargarCursosAdministracion(); this.cargarCursosLectivos(); }, error: () => this.apiError = 'No se pudo guardar el curso lectivo.' });
   }

   private validarCursoLectivoDraft(): string | null {
     const fields: Array<[string, string]> = [['yearCiclo', 'Curso lectivo'], ['fechaInicioI', 'Inicio del I semestre'], ['fechaFinI', 'Fin del I semestre'], ['fechaInicioII', 'Inicio del II semestre'], ['fechaFinII', 'Fin del II semestre']];
     for (const [key, label] of fields) if (!String(this.draft[key] ?? '').trim()) return `El campo '${label}' es obligatorio y no puede estar vacío.`;
     const year = Number(this.draft['yearCiclo']);
     const dates = ['fechaInicioI', 'fechaFinI', 'fechaInicioII', 'fechaFinII'].map((key) => String(this.draft[key]));
     if (!Number.isInteger(year) || year <= 0) return "El campo 'Curso lectivo' debe ser válido.";
     if (dates.some((date) => new Date(`${date}T00:00:00`).getFullYear() !== year)) return 'Todas las fechas deben pertenecer al curso lectivo seleccionado.';
     if (dates[1] <= dates[0]) return 'El fin del I semestre debe ser posterior a su inicio.';
     if (dates[3] <= dates[2]) return 'El fin del II semestre debe ser posterior a su inicio.';
     if (dates[2] <= dates[1]) return 'El II semestre debe iniciar después del I semestre.';
     return null;
   }

   private accionSeccion(action: string, registro: RegistroPortal): void {
     if (action === 'view') {
       this.readOnly = true;
       this.editorTitle = 'Detalle de sección';
       this.validationAttempted = false;
       this.apiError = '';
       this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, String(registro[field.key] ?? '')]));
       this.editorOpen.set(true);
       return;
     }
     if (action === 'delete' && confirm(`¿Eliminar la sección ${registro['seccion']} del curso ${registro['yearCiclo']}?`)) this.seccionesApi.borrar(Number(registro['yearCiclo']), Number(registro['nivel']), Number(registro['numeroSeccion'])).subscribe({ next: () => this.cargarSeccionesAdministracion(), error: () => this.apiError = 'No se pudo eliminar la sección.' });
   }

   private guardarSeccion(): void {
     this.validationAttempted = true;
     const error = this.validarSeccionDraft();
     if (error) { this.apiError = error; return; }
     const request: SeccionRequest = { yearCiclo: Number(this.draft['yearCiclo']), nivel: Number(this.draft['nivel']), numeroSeccion: Number(this.draft['numeroSeccion']) };
     this.seccionesApi.registrar(request).subscribe({ next: () => { this.cerrarEditor(); this.cargarSeccionesAdministracion(); }, error: (error) => this.apiError = error.error?.mensaje ?? 'No se pudo registrar la sección.' });
   }

   private validarSeccionDraft(): string | null {
     if (!String(this.draft['yearCiclo'] ?? '').trim()) return "El campo 'Curso lectivo' es obligatorio y no puede estar vacío.";
     if (!String(this.draft['nivel'] ?? '').trim()) return "El campo 'Nivel' es obligatorio y no puede estar vacío.";
     if (!String(this.draft['numeroSeccion'] ?? '').trim()) return "El campo 'Número de sección' es obligatorio y no puede estar vacío.";
     if (Number(this.draft['yearCiclo']) <= 0) return "El campo 'Curso lectivo' debe ser válido.";
     if (![10, 11].includes(Number(this.draft['nivel']))) return "El campo 'Nivel' debe ser 10 u 11.";
     if (!Number.isInteger(Number(this.draft['numeroSeccion'])) || Number(this.draft['numeroSeccion']) <= 0) return "El campo 'Número de sección' debe ser mayor que cero.";
     return null;
   }

   protected estudiantesDisponiblesMatricula(): EstudianteApi[] {
     const year = String(this.draft['yearCiclo'] ?? '').trim();
     if (!year) return [];
     const matriculados = new Set(this.matriculasApiRows().filter((row) => String(row['yearCiclo']) === year).map((row) => String(row['cedulaEstudiante'])));
     return this.estudiantesMatricula().filter((student) => !matriculados.has(student.cedula));
   }

   protected nombreCompletoEstudiante(student: EstudianteApi): string {
     return [student.nombre, student.primerApellido, student.segundoApellido].filter(Boolean).join(' ');
   }

   protected seccionesDisponiblesMatricula(): SeccionApi[] {
     const year = Number(this.draft['yearCiclo']);
     return this.seccionesMatricula().filter((section) => section.yearCiclo === year);
   }

   protected cursosDisponiblesMatricula(): CursoLectivoApi[] {
     return this.cursosLectivosMatricula();
   }

   protected cambioCursoLectivo(year: string): void {
     this.draft['yearCiclo'] = year;
     this.draft['numeroSeccion'] = '';
     this.draft['cedulaEstudiante'] = '';
   }

   protected cursoLectivoLabel(course: CursoLectivoApi): string {
     return `${course.yearCiclo} · ${this.formatearFecha(course.fechaInicio)} - ${this.formatearFecha(course.fechaFin)}`;
   }

   private formatearFecha(value: string): string {
     const [year, month, day] = value.slice(0, 10).split('-');
     return `${day}/${month}/${year}`;
   }

   protected numeroSeccion(value: string): string {
     return value.split('-').at(-1) ?? value;
   }

  protected cambiarGrupo(id: string): void { this.selectedGroupId.set(id); this.grupos.seleccionar(id); }
}
