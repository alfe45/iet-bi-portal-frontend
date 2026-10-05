import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataTableComponent } from '../compartidos/componentes/tabla-datos.component';
import { StatGridComponent } from '../compartidos/componentes/cuadricula-estadisticas.component';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { FuncionalidadAdministrativa, PortalDatosService, RegistroPortal } from '../nucleo/datos/portal-datos.service';
import { ColumnaTabla } from '../nucleo/modelos/modelos-prototipo';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';
import { ProfesoresApiService, RegistrarProfesorRequest } from '../nucleo/api/profesores-api.service';
import { EstudiantesApiService, EstudianteApi, EstudianteRequest } from '../nucleo/api/estudiantes-api.service';
import { MatriculasApiService, RegistrarMatriculaRequest } from '../nucleo/api/matriculas-api.service';
import { SeccionesApiService, SeccionApi, SeccionRequest } from '../nucleo/api/secciones-api.service';
import { CursosLectivosApiService, CursoLectivoApi, CursoLectivoRequest } from '../nucleo/api/cursos-lectivos-api.service';
import { UsuariosApiService, UsuarioAdminApi } from '../nucleo/api/usuarios-api.service';
import { AsignaturasApiService, AsignaturaApi, AsignaturaRequest } from '../nucleo/api/asignaturas-api.service';
import { AsignacionesApiService, AsignacionApi, RegistrarAsignacionRequest } from '../nucleo/api/asignaciones-api.service';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FeedbackService } from '../compartidos/servicios/feedback.service';

interface CampoFormulario {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'password' | 'select';
  options?: string[];
  required?: boolean;
  readOnly?: boolean;
}

interface ConfiguracionCrud {
  title: string;
  singular: string;
  subtitle: string;
  columns: ColumnaTabla[];
  fields: CampoFormulario[];
}

interface PromotionTarget {
  estudiante: string;
  cedula: string;
  seccion: string;
  cursoActual: number;
  cursoDestino: number;
  numeroSeccion: number;
}

const ESTADOS = ['Activo', 'Inactivo'];
const ROLES_USUARIO = ['Administrador', 'Profesor regular', 'Profesor Guía', 'Profesor Coordinador de Monografía', 'Profesor CAS', 'Profesor Coordinador de CAS'];
const ROLES_BACKEND: Record<string, string> = { 'Administrador': 'ADMIN', 'Profesor regular': 'PROFESOR_REGULAR', 'Profesor Guía': 'GUIA', 'Profesor Coordinador de Monografía': 'COORD_MONOGRAFIA', 'Profesor CAS': 'PROFESOR_CAS', 'Profesor Coordinador de CAS': 'COORD_CAS' };
const ROLES_FRONTEND: Record<string, string> = Object.fromEntries(Object.entries(ROLES_BACKEND).map(([label, role]) => [role, label]));
const ESCALAS_FIJAS: Array<Record<string, unknown>> = [
  { id: 'SUPERIOR', nombre: 'Superior', rango: 'Bandas 1 a 7' },
  { id: 'MEDIO', nombre: 'Medio', rango: 'Bandas 1 a 7' },
  { id: 'TRONCAL', nombre: 'Troncal', rango: 'Letras A a E' },
  { id: 'MEP', nombre: 'MEP', rango: 'Valores 0 a 100' },
];
const CONFIGURACIONES: Record<FuncionalidadAdministrativa, ConfiguracionCrud> = {
  usuarios: { title: 'Usuarios', singular: 'usuario', subtitle: 'Administre las cuentas y roles del portal.', columns: [{ key: 'correo', label: 'Correo' }, { key: 'roles', label: 'Roles' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'correo', label: 'Correo', type: 'email' }, { key: 'password', label: 'Contraseña', type: 'password' }, { key: 'roles', label: 'Roles', options: ROLES_USUARIO }, { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS }, { key: 'ultimoLogin', label: 'Último login', readOnly: true, required: false }, { key: 'creadoEn', label: 'Creado en', readOnly: true, required: false }, { key: 'intentosFallidosLogin', label: 'Intentos fallidos de login', readOnly: true, required: false }, { key: 'bloqueadoHasta', label: 'Bloqueado hasta', readOnly: true, required: false }, { key: 'contrasenaCambiadaEn', label: 'Contraseña cambiada en', readOnly: true, required: false }, { key: 'actualizadoEn', label: 'Actualizado en', readOnly: true, required: false }, { key: 'tokensInvalidadosDesde', label: 'Tokens invalidados desde', readOnly: true, required: false }] },
  profesores: { title: 'Profesores', singular: 'profesor', subtitle: 'Administre la información del personal docente.', columns: [{ key: 'nombreCompleto', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'correo', label: 'Correo' }], fields: [{ key: 'usuarioId', label: 'Usuario disponible', type: 'select' }, { key: 'nombre', label: 'Nombre' }, { key: 'primerApellido', label: 'Primer apellido' }, { key: 'segundoApellido', label: 'Segundo apellido', required: false }, { key: 'cedula', label: 'Cédula' }, { key: 'numeroCelular', label: 'Número celular', required: false }, { key: 'correo', label: 'Correo', type: 'email', readOnly: true }, { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date' }] },
  estudiantes: { title: 'Estudiantes', singular: 'estudiante', subtitle: 'Consulte y administre los estudiantes registrados.', columns: [{ key: 'nombreCompleto', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'correo', label: 'Correo' }, { key: 'fechaNacimiento', label: 'Fecha de nacimiento' }], fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'primerApellido', label: 'Primer apellido' }, { key: 'segundoApellido', label: 'Segundo apellido', required: false }, { key: 'cedula', label: 'Cédula' }, { key: 'numeroCelular', label: 'Número celular', required: false }, { key: 'correo', label: 'Correo', type: 'email' }, { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date' }, { key: 'fechaRegistro', label: 'Fecha de registro', readOnly: true, required: false }] },
  periodos: { title: 'Cursos lectivos', singular: 'curso lectivo', subtitle: 'Configure los cursos lectivos y sus semestres.', columns: [{ key: 'yearCiclo', label: 'Año' }, { key: 'fechaInicio', label: 'Inicio' }, { key: 'fechaFin', label: 'Fin' }], fields: [{ key: 'yearCiclo', label: 'Año' }, { key: 'fechaInicioI', label: 'Inicio del I semestre', type: 'date' }, { key: 'fechaFinI', label: 'Fin del I semestre', type: 'date' }, { key: 'fechaInicioII', label: 'Inicio del II semestre', type: 'date' }, { key: 'fechaFinII', label: 'Fin del II semestre', type: 'date' }] },
  secciones: { title: 'Secciones', singular: 'sección', subtitle: 'Administre las secciones de cada curso lectivo.', columns: [{ key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'seccion', label: 'Sección' }], fields: [{ key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'nivel', label: 'Nivel' }, { key: 'numeroSeccion', label: 'Número de sección' }] },
  matriculas: { title: 'Matrículas', singular: 'matrícula', subtitle: 'Administre las matrículas de estudiantes en secciones.', columns: [{ key: 'estudiante', label: 'Estudiante' }, { key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'seccion', label: 'Sección' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'cedulaEstudiante', label: 'Estudiante' }, { key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'nivel', label: 'Nivel' }, { key: 'numeroSeccion', label: 'Número de sección' }] },
  escalas: { title: 'Tipos de escala', singular: 'escala', subtitle: 'Las escalas están definidas por el tipo de asignatura y son informativas.', columns: [{ key: 'nombre', label: 'Tipo' }, { key: 'rango', label: 'Rango permitido' }], fields: [] },
  asignaturas: { title: 'Asignaturas', singular: 'asignatura', subtitle: 'Administre código, tipo, descripción y niveles donde se imparte cada asignatura.', columns: [{ key: 'codigo', label: 'Código' }, { key: 'tipoAsignatura', label: 'Tipo' }, { key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción' }], fields: [{ key: 'codigo', label: 'Código (3 letras)' }, { key: 'tipoAsignatura', label: 'Tipo de asignatura', type: 'select', options: ['MEP', 'Troncal', 'Superior', 'Medio'] }, { key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción', required: false }, { key: 'imparteNivel10', label: 'Imparte en nivel 10', type: 'select', options: ['Sí', 'No'] }, { key: 'imparteNivel11', label: 'Imparte en nivel 11', type: 'select', options: ['Sí', 'No'] }] },
  asignaciones: { title: 'Asignación profesores', singular: 'asignación de profesor', subtitle: 'Administre las asignaciones de profesores por asignatura y sección.', columns: [{ key: 'profesor', label: 'Profesor' }, { key: 'codigoAsignatura', label: 'Código / asignatura' }, { key: 'seccion', label: 'Sección' }], fields: [{ key: 'profesor', label: 'Profesor' }, { key: 'codigo', label: 'Código / asignatura' }, { key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'seccion', label: 'Sección' }] },
};

@Component({
  selector: 'app-vista-funcionalidad',
  imports: [FormsModule, StatGridComponent, DataTableComponent],
  template: `
    <section class="page-grid">
      <section class="surface">
        <div class="section-heading">
          <div><p class="eyebrow">{{ isTeacher() ? 'Mi trabajo' : 'Gestión' }}</p><h2>{{ pageTitle() }}</h2><p>{{ pageSubtitle() }}</p></div>
           @if (isAdmin() && key !== 'escalas') { <button type="button" class="primary-button" (click)="abrirNuevo()">Registrar {{ config.singular }}</button> }
        </div>
      </section>

   <app-stat-grid [cards]="[{ label: 'Registros', value: cantidadRegistros(), tone: 'primary' }]" />

       @if (editorOpen()) {
           <div class="modal-backdrop" role="presentation"><form class="surface editor" [class.user-editor]="key === 'usuarios'" (ngSubmit)="guardar()" novalidate role="dialog" aria-modal="true" aria-labelledby="crud-editor-title">
           <div class="section-heading modal-header"><div><p class="modal-kicker">{{ readOnly ? 'Consulta' : editingId ? 'Edición' : 'Nuevo registro' }}</p><h3 id="crud-editor-title">{{ editorTitle }}</h3><p>{{ readOnly ? 'Información de solo lectura.' : 'Complete los campos requeridos.' }}</p></div><button type="button" class="modal-close" aria-label="Cerrar modal" (click)="cerrarEditor()">×</button></div>
            <div class="editor-grid">
              @for (field of camposFormulario(); track field.key) {
                  <label [class.student-field]="key === 'matriculas' && field.key === 'cedulaEstudiante'" [class.course-field]="(key === 'matriculas' || key === 'secciones' || key === 'asignaciones') && field.key === 'yearCiclo'" [class.registration-field]="key === 'estudiantes' && field.key === 'fechaRegistro'" [class.roles-field]="key === 'usuarios' && field.key === 'roles'"><span>{{ field.label }}</span>
                    @if (key === 'profesores' && field.key === 'usuarioId') {
                       <select [name]="field.key" [(ngModel)]="draft[field.key]" (ngModelChange)="seleccionarUsuarioProfesor($event)" [disabled]="readOnly || !!editingId" [required]="field.required ?? true"><option value="">Seleccione un usuario</option>@for (user of usuariosDisponibles(); track user['id']) { <option [value]="user['id']">{{ user['correo'] }}</option> }</select>
                    } @else if (key === 'asignaciones' && field.key === 'profesor') {
                       <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="readOnly || campoSoloLectura(field)" [required]="field.required ?? true"><option value="">Seleccione un profesor</option>@for (teacher of profesoresDisponiblesAsignacion(); track teacher.id) { <option [value]="teacher.nombre">{{ teacher.cedula }} · {{ teacher.nombre }}</option> }</select>
                    } @else if (key === 'asignaciones' && field.key === 'codigo') {
                       <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="readOnly || campoSoloLectura(field)" [required]="field.required ?? true"><option value="">Seleccione una asignatura</option>@for (subject of asignaturasDisponiblesAsignacion(); track subject.codigo) { <option [value]="subject.codigo">{{ subject.codigo }} · {{ subject.nombre }}</option> }</select>
                     } @else if (key === 'asignaciones' && field.key === 'seccion') {
                       <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="readOnly || campoSoloLectura(field)" [required]="field.required ?? true"><option value="">Seleccione una sección</option>@for (section of seccionesAsignacion(); track section) { <option [value]="section">{{ section }}</option> }</select>
                     } @else if (key === 'asignaciones' && field.key === 'yearCiclo') {
                       <select [name]="field.key" [(ngModel)]="draft[field.key]" (ngModelChange)="cambioCursoLectivo($event)" [disabled]="readOnly || !!editingId" [required]="field.required ?? true"><option value="">Seleccione un curso lectivo</option>@for (course of cursosDisponiblesMatricula(); track course.idCursoLectivo) { <option [value]="course.yearCiclo">{{ cursoLectivoLabel(course) }}</option> }</select>
                     } @else if (key === 'matriculas' && field.key === 'cedulaEstudiante') {
                       @if (editingId) {
                         <div class="selected-student"><strong>{{ estudianteSeleccionadoMatricula() }}</strong><span>{{ draft[field.key] }}</span><small>El estudiante no se puede cambiar al editar una matrícula.</small></div>
                       } @else {
                          <div class="student-picker"><div class="student-search"><span class="search-label">Buscar estudiante</span><input type="search" name="buscarEstudiante" [(ngModel)]="studentSearch" (ngModelChange)="buscarEstudiantesMatricula($event)" placeholder="Nombre completo o número de cédula" autocomplete="off" [readonly]="readOnly" /><small>{{ estudiantesDisponiblesMatricula().length }} estudiantes disponibles</small></div><div class="student-results" role="listbox" aria-label="Resultados de estudiantes">@for (student of estudiantesResultadosMatricula(); track student.cedula) { <button type="button" class="student-result" [class.selected]="draft[field.key] === student.cedula" (click)="seleccionarEstudianteMatricula(student)"><span class="student-avatar">{{ inicialesEstudiante(student) }}</span><span class="student-result-copy"><strong>{{ nombreCompletoEstudiante(student) }}</strong><small>{{ student.cedula }}{{ student.email ? ' · ' + student.email : '' }}</small></span><span class="student-check" aria-hidden="true">{{ draft[field.key] === student.cedula ? 'Seleccionado' : 'Elegir' }}</span></button>} @empty { <p class="student-empty">No encontramos estudiantes con esa búsqueda.</p> }</div>@if (draft[field.key]) { <p class="student-selection">Estudiante seleccionado: <strong>{{ estudianteSeleccionadoMatricula() }}</strong></p> }</div>
        }

                   } @else if (key === 'matriculas' && field.key === 'yearCiclo') {
                     <select [name]="field.key" [(ngModel)]="draft[field.key]" (ngModelChange)="cambioCursoLectivo($event)" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione un curso lectivo</option>@for (course of cursosDisponiblesMatricula(); track course.idCursoLectivo) { <option [value]="course.yearCiclo">{{ cursoLectivoLabel(course) }}</option> }</select>
                   } @else if (key === 'matriculas' && field.key === 'nivel') {
                     <select [name]="field.key" [(ngModel)]="draft[field.key]" (ngModelChange)="draft['numeroSeccion'] = ''" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione un nivel</option><option value="10">Décimo</option><option value="11">Undécimo</option></select>
                  } @else if (key === 'secciones' && field.key === 'yearCiclo') {
                    <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione un curso lectivo</option>@for (course of cursosDisponiblesMatricula(); track course.idCursoLectivo) { <option [value]="course.yearCiclo">{{ cursoLectivoLabel(course) }}</option> }</select>
                  } @else if (key === 'secciones' && field.key === 'nivel') {
                    <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione un nivel</option><option value="10">Décimo</option><option value="11">Undécimo</option></select>
                  } @else if (key === 'matriculas' && field.key === 'numeroSeccion') {
                    <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione una sección</option>@for (section of seccionesDisponiblesMatricula(); track section.idSeccion) { <option [value]="numeroSeccion(section.seccion)">{{ section.seccion }}</option> }</select>
                    } @else if (key === 'usuarios' && field.key === 'roles') {
                      <span class="roles-grid">@for (option of rolesDisponibles(); track option) { <label class="role-option"><input type="checkbox" [checked]="rolesSeleccionados().includes(option)" [disabled]="readOnly" (change)="cambiarRol(option, $any($event.target).checked)" /> {{ option }}</label> }</span>
                    } @else if (key === 'asignaturas' && field.key === 'codigo') {
                      <input type="text" [name]="field.key" [(ngModel)]="draft[field.key]" (ngModelChange)="normalizarCodigoAsignatura($event)" maxlength="3" minlength="3" pattern="[A-Z]{3}" placeholder="Ej. MAT" [readonly]="campoSoloLectura(field)" [required]="field.required ?? true" />
                    } @else if (key === 'asignaturas' && (field.key === 'imparteNivel10' || field.key === 'imparteNivel11')) {
                      <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="campoSoloLectura(field)" [required]="field.required ?? true"><option value="true">Sí</option><option value="false">No</option></select>
                    } @else if (field.type === 'select') {
                     <select [name]="field.key" [(ngModel)]="draft[field.key]" [disabled]="campoSoloLectura(field)" [required]="field.required ?? true">@for (option of field.options ?? []; track option) { <option [value]="option">{{ option }}</option> }</select>
                   } @else {
                     @if (field.type === 'password') { <span class="password-input"><input [type]="showPassword() ? 'text' : 'password'" [name]="field.key" [(ngModel)]="draft[field.key]" [readonly]="campoSoloLectura(field)" [required]="field.required ?? true" /><span class="password-visibility"><input type="checkbox" [checked]="showPassword()" (change)="showPassword.set($any($event.target).checked)" /> Mostrar contraseña</span></span> } @else { <input [type]="field.type ?? 'text'" [name]="field.key" [(ngModel)]="draft[field.key]" [readonly]="campoSoloLectura(field)" [required]="field.required ?? true" /> }
                  }
                  @if (fieldError(field.key)) { <small class="field-error" role="alert">{{ fieldError(field.key) }}</small> }
                </label>
             }
           </div>
            @if (apiError && !readOnly) { <p class="api-error" role="alert">{{ apiError }}</p> }
            @if (!readOnly) { <div class="form-actions"><button type="button" class="ghost-button" (click)="cerrarEditor()">Cancelar</button><button type="submit" class="primary-button">Guardar</button></div> }
          </form></div>
        }

        @if (promotionTarget(); as target) {
          <div class="modal-backdrop" role="presentation" (click)="cancelarPromocion()">
            <section class="promotion-modal" role="dialog" aria-modal="true" aria-labelledby="promotion-title" (click)="$event.stopPropagation()">
              <div class="promotion-icon" aria-hidden="true">↑</div>
              <div class="promotion-copy"><p class="modal-kicker">Cambio académico</p><h3 id="promotion-title">Confirmar subida de nivel</h3><p>Esta acción trasladará la matrícula de <strong>{{ target.estudiante }}</strong> a undécimo.</p></div>
              <dl class="promotion-summary"><div><dt>Identificación</dt><dd>{{ target.cedula }}</dd></div><div><dt>Sección actual</dt><dd>{{ target.cursoActual }} · {{ target.seccion }}</dd></div><div><dt>Nuevo curso</dt><dd>{{ target.cursoDestino }} · Sección {{ target.numeroSeccion }}</dd></div></dl>
              <p class="promotion-warning">La operación actualizará la sección académica de esta matrícula.</p>
              <div class="modal-actions"><button type="button" class="ghost-button" (click)="cancelarPromocion()">Cancelar</button><button type="button" class="primary-button" (click)="confirmarPromocion()">Subir a undécimo</button></div>
            </section>
          </div>
        }

        <section class="surface">
          @if (isTeacher() && key === 'estudiantes') { <div class="group-filter"><label>Grupo<select [ngModel]="selectedGroupId()" (ngModelChange)="cambiarGrupo($event)">@for (group of grupos.grupos(); track group.id) {<option [value]="group.id">{{ grupos.etiqueta(group) }}</option>}</select></label><span>Periodo activo: {{ grupos.periodoActivo() }}</span></div> }
          <div class="section-heading"><div><h3>{{ pageTitle() }}</h3><p>{{ isTeacher() ? 'Información relacionada con tus asignaciones del periodo actual.' : 'Use las acciones para consultar o modificar registros.' }}</p></div></div>
          @if (busquedaDisponible()) {
            <div class="table-tools">
              <label class="table-search"><span>{{ etiquetaBusqueda() }}</span><input type="search" [(ngModel)]="adminSearch" (keydown.enter)="buscarRegistros()" [placeholder]="placeholderBusqueda()" /></label>
              <div class="table-search-actions"><button type="button" class="primary-button" (click)="buscarRegistros()">Buscar</button>@if (adminSearch) { <button type="button" class="ghost-button" (click)="limpiarBusqueda()">Limpiar</button> }</div>
            </div>
          }
           @if (apiError && !editorOpen()) { <p class="api-error" role="alert">{{ apiError }}</p> }
           <app-data-table [columns]="columns()" [rows]="rows()" (actionSelected)="accion($event)" />
           @if (paginacionVisible()) {
             <nav class="pagination-bar" aria-label="Paginación de registros"><span>Mostrando {{ rangoInicio() }}-{{ rangoFin() }} de {{ totalRegistros() }}</span><div class="pagination-actions"><button type="button" class="ghost-button" [disabled]="paginaActual() === 1" (click)="cambiarPagina(paginaActual() - 1)">Anterior</button><span>Página {{ paginaActual() }} de {{ totalPaginas() }}</span><button type="button" class="ghost-button" [disabled]="paginaActual() >= totalPaginas()" (click)="cambiarPagina(paginaActual() + 1)">Siguiente</button></div></nav>
           }
       </section>
    </section>
  `,
  styles: `
     .page-grid { min-height: 100%; grid-template-rows: auto auto auto; }
     .eyebrow { margin: 0 0 .25rem; text-transform: uppercase; letter-spacing: .12em; font-size: .74rem; color: #2f6b9a; font-weight: 700; }
    .section-heading p { margin: .35rem 0 0; color: #667085; }
      .modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:1rem;background:rgba(18,32,49,.58);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:modal-fade-in .18s ease-out}
       .editor { width:min(100%,760px);max-height:calc(100vh - 2rem);overflow:auto;padding:0;border:1px solid #dbe5ef;border-left:5px solid #2f6b9a;border-radius:14px;box-shadow:0 24px 70px rgba(18,32,49,.26); }
      .editor .modal-header{align-items:flex-start;margin:0;padding:1.5rem 1.75rem .95rem;border-bottom:1px solid #edf1f4}.editor .modal-header h3{margin:0;color:#29344a;font-size:1.2rem}.editor .modal-header p:last-child{margin:.3rem 0 0;color:#667085;font-size:.8rem}.editor .modal-close{flex:0 0 auto;width:36px;height:36px;padding:0;border:1px solid #d7e0e8;border-radius:8px;color:#475467;background:#f8fafc;font-size:1.45rem;line-height:1;cursor:pointer}.editor .modal-close:hover{border-color:#9bb6c9;background:#eef5f8;color:#1e5578}
      .user-editor { width:min(100%,700px); border-left-color:#1e7a68; }
      .modal-kicker { margin:0 0 .2rem; color:#1e7a68; font-size:.72rem; font-weight:800; letter-spacing:.11em; text-transform:uppercase; }
       .editor-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; padding:1.35rem 1.75rem 0; }
       .student-field { grid-column: 1 / -1; }.course-field, .registration-field { grid-column: span 2; }.student-field select, .course-field select, .registration-field input { width: 100%; min-width: 0; }.student-field .student-picker{width:100%}.registration-field input { min-width: 240px; }
       .user-editor .editor-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap:1rem; margin-top:0; }.user-editor .editor-grid>label{align-content:start}.user-editor .editor-grid>label>input:not([type="checkbox"]),.user-editor .editor-grid>label>select,.user-editor .password-input>input{height:50px;min-height:50px;align-self:start}
      .user-editor .roles-field { grid-column:1 / -1; }
       .user-editor .roles-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:.7rem .9rem; padding:.95rem 1rem; border:1px solid #c9dbe5; border-radius:10px; background:#f5fafc; }
       .group-filter { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1rem; padding:.7rem; background:#f2f7fa; border-radius:7px; }.group-filter label { display:flex; align-items:center; gap:.7rem; }.group-filter span { color:#667085; font-size:.82rem; }
        .table-tools{display:flex;align-items:end;justify-content:space-between;gap:.8rem;margin:0 0 1rem;padding:.75rem;background:#f8fafc;border:1px solid #e6edf3;border-radius:8px}.table-search{display:grid;gap:.25rem;flex:1;max-width:520px}.table-search span{color:#475467;font-size:.72rem;font-weight:800}.table-search input{width:100%;box-sizing:border-box}.table-search-actions{display:flex;gap:.5rem}.table-search-actions button{white-space:nowrap}
        .pagination-bar{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem .2rem 0;color:#667085;font-size:.76rem}.pagination-actions{display:flex;align-items:center;gap:.7rem}.pagination-actions button{padding:.35rem .65rem;font-size:.72rem}.pagination-actions button:disabled{opacity:.45;cursor:not-allowed}
       label { display: grid; gap: .25rem; font-weight: 700; }.student-picker{display:grid;gap:.55rem;padding:.7rem;border:1px solid #cfdbe5;border-radius:9px;background:#f8fbfd}.student-search{display:grid;gap:.3rem}.search-label{color:#1e3a5f;font-size:.76rem;font-weight:800}.student-search input{width:100%;box-sizing:border-box}.student-search small{color:#667085;font-size:.72rem;font-weight:500}.student-results{display:grid;gap:.35rem;max-height:220px;overflow:auto;padding-right:.15rem}.student-result{display:grid;grid-template-columns:2rem minmax(0,1fr) auto;align-items:center;gap:.55rem;width:100%;padding:.55rem;border:1px solid #dbe5ef;border-radius:7px;background:#fff;color:#25364a;text-align:left;cursor:pointer}.student-result:hover,.student-result.selected{border-color:#2f6b9a;background:#eaf3f8}.student-avatar{display:grid;place-items:center;width:2rem;height:2rem;border-radius:50%;background:#d9eaf3;color:#1e5a78;font-size:.68rem;font-weight:800}.student-result-copy{display:grid;min-width:0;gap:.12rem}.student-result-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.78rem}.student-result-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#667085;font-size:.7rem}.student-check{color:#2f6b9a;font-size:.65rem;font-weight:800}.student-empty{margin:0;padding:.8rem;color:#667085;font-size:.78rem;text-align:center}.selected-student{display:grid;gap:.2rem;padding:.75rem;border:1px solid #b9d3e5;border-radius:9px;background:#f0f8fc}.selected-student strong{color:#1e3a5f}.selected-student span,.selected-student small{color:#667085;font-size:.75rem}.student-selection{margin:0;color:#1e5a78;font-size:.75rem}
      .form-actions { display: flex; justify-content: flex-end; gap: .75rem; margin:1.4rem 0 0; padding:1rem 1.75rem 1.35rem; border-top:1px solid #edf1f4; background:#fbfcfd; }
     .field-error { display: block; color: #b42318; font-size: .72rem; line-height: 1.2; font-weight: 600; }
       .password-input { display: grid; gap: .4rem; }.password-visibility { display: flex; align-items: center; gap: .4rem; color: #475467; font-size: .8rem; font-weight: 600; }.password-visibility input { width: auto; min-height: 0; padding: 0; }.roles-grid{display:grid;gap:.45rem;padding:.55rem;border:1px solid #cfdbe5;border-radius:5px;background:#f8fafc}.role-option{display:flex;grid-template-columns:none;align-items:center;gap:.4rem;font-size:.8rem;font-weight:500}.role-option input{width:auto;min-height:0;padding:0}
        @media (max-width: 900px) { .editor-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .student-field, .course-field, .registration-field { grid-column: 1 / -1; } }
        @media (max-width: 700px) { .editor-grid { grid-template-columns: 1fr; } .student-field, .course-field, .registration-field { grid-column: span 1; } }
       .promotion-modal{width:min(100%,500px);padding:1.7rem;border:1px solid #cfe0e6;border-top:5px solid #238d78;border-radius:16px;background:#fff;box-shadow:0 24px 70px rgba(18,32,49,.28)}.promotion-icon{display:grid;place-items:center;width:3rem;height:3rem;margin-bottom:1rem;border-radius:12px;color:#13775f;background:#e7f5ef;font-size:1.7rem;font-weight:800}.promotion-copy h3{margin:0;color:#29344a;font-size:1.25rem}.promotion-copy p:last-child{margin:.45rem 0 0;color:#667085;line-height:1.5}.promotion-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin:1.35rem 0 1rem}.promotion-summary div{padding:.75rem;border:1px solid #e1ebef;border-radius:9px;background:#f8fbfc}.promotion-summary dt{color:#667085;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.promotion-summary dd{margin:.25rem 0 0;color:#1e3a5f;font-size:.82rem;font-weight:700;overflow-wrap:anywhere}.promotion-warning{margin:0;padding:.75rem .85rem;border-left:3px solid #f0a33a;border-radius:6px;color:#7a4b08;background:#fff8eb;font-size:.78rem}.modal-actions{display:flex;justify-content:flex-end;gap:.65rem;margin-top:1.35rem}@keyframes modal-fade-in{from{opacity:0}to{opacity:1}}
       @media (max-width: 700px) { .user-editor .editor-grid,.editor-grid { grid-template-columns:1fr; } .student-field, .course-field, .registration-field { grid-column: span 1; } .user-editor .roles-field { grid-column:auto; } .user-editor .roles-grid { grid-template-columns:1fr; } .editor .modal-header,.editor-grid,.form-actions{padding-left:1rem;padding-right:1rem}.promotion-summary{grid-template-columns:1fr} }
  `,
})
// Administra los formularios y tablas de las funcionalidades seleccionadas.
export class FuncionalidadVistaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AutenticacionService);
  private readonly datos = inject(PortalDatosService);
  private readonly profesoresApi = inject(ProfesoresApiService);
  private readonly estudiantesApi = inject(EstudiantesApiService);
    private readonly matriculasApi = inject(MatriculasApiService);
    private readonly seccionesApi = inject(SeccionesApiService);
     private readonly cursosLectivosApi = inject(CursosLectivosApiService);
     private readonly usuariosApi = inject(UsuariosApiService);
     private readonly asignaturasApi = inject(AsignaturasApiService);
     private readonly asignacionesApi = inject(AsignacionesApiService);
     private readonly feedback = inject(FeedbackService);
  protected readonly grupos = inject(GruposProfesorService);
  protected readonly key = (this.route.snapshot.routeConfig?.path ?? 'estudiantes') as FuncionalidadAdministrativa;
  protected readonly config = CONFIGURACIONES[this.key];
   protected readonly isAdmin = computed(() => this.auth.hasRole('Administrador'));
    private readonly profesoresApiRows = signal<Array<Record<string, unknown>>>([]);
    private readonly estudiantesApiRows = signal<Array<Record<string, unknown>>>([]);
    private readonly matriculasApiRows = signal<Array<Record<string, unknown>>>([]);
    private readonly estudiantesMatricula = signal<EstudianteApi[]>([]);
    private readonly seccionesMatricula = signal<SeccionApi[]>([]);
    private readonly cursosLectivosMatricula = signal<CursoLectivoApi[]>([]);
    private readonly cursosApiRows = signal<Array<Record<string, unknown>>>([]);
     private readonly seccionesApiRows = signal<Array<Record<string, unknown>>>([]);
     private readonly usuariosApiRows = signal<Array<Record<string, unknown>>>([]);
     private readonly asignaturasApiRows = signal<Array<Record<string, unknown>>>([]);
     private readonly asignacionesApiRows = signal<Array<Record<string, unknown>>>([]);
     protected apiError = '';
     protected adminSearch = '';
     protected readonly paginaActual = signal(1);
      protected readonly totalRegistros = signal(0);
      protected readonly tamanoPagina = 10;
      protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalRegistros() / this.tamanoPagina)));
    protected readonly promotionTarget = signal<PromotionTarget | null>(null);
    protected readonly columns = computed(() => this.key === 'escalas' ? this.config.columns : [...this.teacherColumns(), { key: 'acciones', label: 'Acciones', type: 'actions' as const }]);
   protected readonly rows = computed<Array<Record<string, unknown>>>(() => {
       if (this.isTeacher()) return this.teacherRows();
       if (this.key === 'profesores') return this.profesoresApiRows();
       if (this.key === 'estudiantes') return this.estudiantesApiRows();
       if (this.key === 'matriculas') return this.matriculasApiRows();
       if (this.key === 'periodos') return this.cursosApiRows();
        if (this.key === 'secciones') return this.seccionesApiRows();
        if (this.key === 'usuarios') return this.usuariosApiRows();
        if (this.key === 'asignaturas') return this.asignaturasApiRows();
        if (this.key === 'asignaciones') return this.asignacionesRows();
        if (this.key === 'escalas') return ESCALAS_FIJAS;
         return this.datos.listar(this.key).map((registro) => ({ ...registro, acciones: this.isAdmin() ? [{ label: 'Editar', code: 'edit' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }] : [{ label: 'Ver detalle', code: 'view' }] }));
   });
   protected readonly editorOpen = signal(false);
  protected readOnly = false;
   protected editorTitle = '';
   protected editingId: string | undefined;
   protected draft: Record<string, string> = {};
   protected validationAttempted = false;
   protected readonly showPassword = signal(false);
   protected studentSearch = '';
   protected readonly selectedGroupId = signal(this.grupos.grupoActual()?.id ?? '');
  protected readonly String = String;
   protected readonly isTeacher = computed(() => !this.auth.hasRole('Administrador'));
  protected readonly pageTitle = computed(() => this.isTeacher() && this.key === 'asignaturas' ? 'Mis asignaturas' : this.isTeacher() && this.key === 'secciones' ? 'Mis secciones' : this.config.title);
    protected readonly pageSubtitle = computed(() => this.isTeacher() && this.key === 'asignaturas' ? 'Consulta las asignaturas que tienes asignadas en el periodo actual.' : this.isTeacher() && this.key === 'secciones' ? 'Consulta las secciones donde impartes alguna asignatura.' : this.isTeacher() && this.key === 'estudiantes' ? 'Consulta los estudiantes de tus grupos.' : this.config.subtitle);

    protected busquedaDisponible(): boolean { return this.isAdmin() && ['usuarios', 'profesores', 'estudiantes', 'matriculas'].includes(this.key); }
    protected etiquetaBusqueda(): string { return this.key === 'matriculas' ? 'Buscar matrícula' : `Buscar ${this.config.title.toLowerCase()}`; }
     protected placeholderBusqueda(): string { return this.key === 'matriculas' ? 'Nombre o cédula del estudiante' : 'Correo, nombre o cédula'; }

     protected cantidadRegistros(): string { return this.paginacionAdministrativa() ? String(this.totalRegistros()) : String(this.rows().length); }
     protected paginacionAdministrativa(): boolean { return this.isAdmin() && ['usuarios', 'profesores', 'estudiantes', 'periodos', 'secciones', 'matriculas', 'asignaturas', 'asignaciones'].includes(this.key); }
     protected paginacionVisible(): boolean { return this.paginacionAdministrativa() && this.totalRegistros() > this.tamanoPagina; }
     protected rangoInicio(): number { return this.totalRegistros() ? (this.paginaActual() - 1) * this.tamanoPagina + 1 : 0; }
     protected rangoFin(): number { return Math.min(this.paginaActual() * this.tamanoPagina, this.totalRegistros()); }

     protected cambiarPagina(page: number): void {
       if (page < 1 || page > this.totalPaginas() || page === this.paginaActual()) return;
       this.paginaActual.set(page);
       this.cargarPaginaActual();
     }

     protected buscarRegistros(): void {
       this.apiError = '';
       this.paginaActual.set(1);
       if (this.key === 'usuarios') this.cargarUsuarios(this.adminSearch);
      if (this.key === 'profesores') this.cargarProfesores(this.adminSearch);
      if (this.key === 'estudiantes') this.cargarEstudiantes(this.adminSearch);
      if (this.key === 'matriculas') this.cargarMatriculas(this.adminSearch);
    }

     protected limpiarBusqueda(): void { this.adminSearch = ''; this.buscarRegistros(); }

     private cargarPaginaActual(): void {
       const pagina = this.paginaActual();
       if (this.key === 'usuarios') this.cargarUsuarios(this.adminSearch, pagina);
       if (this.key === 'profesores') this.cargarProfesores(this.adminSearch, pagina);
       if (this.key === 'estudiantes') this.cargarEstudiantes(this.adminSearch, pagina);
       if (this.key === 'periodos') this.cargarCursosAdministracion(pagina);
       if (this.key === 'secciones') this.cargarSeccionesAdministracion(pagina);
       if (this.key === 'matriculas') this.cargarMatriculas(this.adminSearch, pagina);
       if (this.key === 'asignaturas') this.cargarAsignaturas(pagina);
       if (this.key === 'asignaciones') this.cargarAsignaciones(pagina);
     }

     private actualizarPaginacion<T>(response: { pagina: number; total: number; elementos: T[] }): void {
       this.totalRegistros.set(response.total);
       if (response.pagina !== this.paginaActual()) this.paginaActual.set(response.pagina);
       const lastPage = Math.max(1, Math.ceil(response.total / this.tamanoPagina));
       if (!response.elementos.length && response.total > 0 && this.paginaActual() > lastPage) {
         this.paginaActual.set(lastPage);
         this.cargarPaginaActual();
       }
     }

    protected camposFormulario(): CampoFormulario[] {
      if (this.key === 'estudiantes') return this.config.fields.filter((field) => field.key !== 'fechaRegistro' || Boolean(this.editingId));
      if (this.key !== 'usuarios') return this.config.fields;
     if (!this.readOnly) return this.config.fields.filter((field) => !field.readOnly);
     return this.config.fields.filter((field) => field.key !== 'password');
   }

   protected rolesDisponibles(): string[] {
     const roles = this.config.fields.find((field) => field.key === 'roles')?.options ?? [];
     return this.editingId || this.readOnly ? roles : roles.filter((role) => role !== 'Administrador');
   }

    protected profesoresDisponiblesAsignacion(): Array<{ id: string; cedula: string; nombre: string }> {
      return this.profesoresApiRows().map((teacher) => ({ id: String(teacher['id'] ?? ''), cedula: String(teacher['cedula'] ?? ''), nombre: String(teacher['nombreCompleto'] ?? teacher['nombre'] ?? '') }));
    }

    protected asignaturasDisponiblesAsignacion(): Array<{ codigo: string; nombre: string }> {
      return this.asignaturasApiRows().map((subject) => ({ codigo: String(subject['codigo'] ?? ''), nombre: String(subject['nombre'] ?? '') }));
    }

     protected seccionesAsignacion(): string[] {
       const year = String(this.draft['yearCiclo'] ?? '').trim();
       return [...new Set(this.seccionesApiRows().filter((section) => !year || String(section['yearCiclo']) === year).map((section) => String(section['nombre'] ?? section['seccion'] ?? '')).filter(Boolean))];
   }

   private codigoAsignatura(subject: RegistroPortal, index = 0): string {
     const code = String(subject['codigo'] ?? '').trim();
     if (/^[A-Z]{3}$/.test(code)) return code;
     const fromId = String(subject.id).replace(/^ASG-/, '').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
     return fromId.padEnd(3, String(index + 1).slice(-1));
   }

    private asignacionesRows(): Array<Record<string, unknown>> {
      return this.asignacionesApiRows();
    }

    constructor() {
       if (this.isAdmin() && this.key === 'profesores') { this.cargarProfesores(); this.cargarUsuarios('', 1, false, 100); }
      if (this.isAdmin() && this.key === 'estudiantes') this.cargarEstudiantes();
      if (this.isAdmin() && this.key === 'matriculas') this.cargarMatriculas();
      if (this.isAdmin() && this.key === 'matriculas') this.cargarSecciones();
      if (this.isAdmin() && this.key === 'matriculas') this.cargarCursosLectivos();
      if (this.isAdmin() && this.key === 'secciones') this.cargarCursosLectivos();
      if (this.isAdmin() && this.key === 'periodos') this.cargarCursosAdministracion();
       if (this.isAdmin() && this.key === 'secciones') this.cargarSeccionesAdministracion();
       if (this.isAdmin() && this.key === 'usuarios') this.cargarUsuarios();
       if (this.isAdmin() && this.key === 'asignaturas') this.cargarAsignaturas();
        if (this.isAdmin() && this.key === 'asignaciones') { this.cargarAsignaciones(); this.cargarProfesores('', 1, false); this.cargarAsignaturas(1, false); this.cargarSeccionesAdministracion(1, false); this.cargarCursosLectivos(); }
    }

  protected abrirNuevo(): void {
    this.editingId = undefined;
    this.readOnly = false;
    this.validationAttempted = false;
    this.apiError = '';
    this.showPassword.set(false);
    this.studentSearch = '';
    this.editorTitle = `Registrar ${this.config.singular}`;
     this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, field.options?.[0] ?? '']));
      if (this.key === 'usuarios') { this.draft['roles'] = ''; this.draft['estado'] = 'Activo'; }
      if (this.key === 'asignaturas') { this.draft['imparteNivel10'] = 'true'; this.draft['imparteNivel11'] = 'true'; }
      if (this.key === 'asignaciones') { this.draft['profesor'] = this.profesoresDisponiblesAsignacion()[0]?.nombre ?? ''; this.draft['codigo'] = this.asignaturasDisponiblesAsignacion()[0]?.codigo ?? ''; this.draft['yearCiclo'] = String(new Date().getFullYear()); this.draft['seccion'] = this.seccionesAsignacion()[0] ?? ''; }
      if (this.key === 'matriculas') { this.draft['yearCiclo'] = String(new Date().getFullYear()); this.draft['nivel'] = '10'; }
    if (this.key === 'secciones') this.draft['yearCiclo'] = String(new Date().getFullYear());
      this.editorOpen.set(true);
  }

  protected accion(event: { action: string; row: Record<string, unknown> }): void {
    const registro = event.row as RegistroPortal;
    if (this.isAdmin() && this.key === 'profesores') { this.accionProfesor(event.action, registro); return; }
    if (this.isAdmin() && this.key === 'estudiantes') { this.accionEstudiante(event.action, registro); return; }
     if (this.isAdmin() && this.key === 'matriculas') { this.accionMatricula(event.action, registro); return; }
     if (this.isAdmin() && this.key === 'usuarios') { this.accionUsuario(event.action, registro); return; }
     if (this.isAdmin() && this.key === 'asignaturas') { this.accionAsignatura(event.action, registro); return; }
     if (this.isAdmin() && this.key === 'asignaciones') { this.accionAsignacion(event.action, registro); return; }
    if (this.isAdmin() && this.key === 'periodos') { this.accionCursoLectivo(event.action, registro); return; }
    if (this.isAdmin() && this.key === 'secciones') { this.accionSeccion(event.action, registro); return; }
    if (event.action === 'delete' && this.isAdmin()) {
      const deletion = this.datos.validarEliminacion(this.key, registro.id);
      if (!deletion.permitido) { this.apiError = deletion.motivo; return; }
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
     if (this.isAdmin() && this.key === 'usuarios') {
       const validation = this.validarUsuarioDraft();
       if (validation) { this.validationAttempted = true; this.apiError = validation; this.feedback.error(validation, 'Revise los datos del formulario'); return; }
       this.guardarUsuario();
       return;
     }
      if (this.isAdmin() && (this.key === 'asignaturas' || this.key === 'asignaciones')) {
       const validation = this.validarCatalogoAdministrativo();
        if (validation) { this.validationAttempted = true; this.apiError = validation; this.feedback.error(validation, 'Revise los datos del formulario'); return; }
      }
      if (this.isAdmin() && this.key === 'asignaciones') { this.guardarAsignacion(); return; }
     if (this.isAdmin() && this.key === 'asignaturas') { this.guardarAsignatura(); return; }
    if (this.isAdmin() && this.key === 'profesores') { this.guardarProfesor(); return; }
    if (this.isAdmin() && this.key === 'estudiantes') { this.guardarEstudiante(); return; }
    if (this.isAdmin() && this.key === 'matriculas') { this.guardarMatricula(); return; }
    if (this.isAdmin() && this.key === 'periodos') { this.guardarCursoLectivo(); return; }
    if (this.isAdmin() && this.key === 'secciones') { this.guardarSeccion(); return; }
    this.datos.guardarRegistro(this.key, this.draft, this.editingId);
    this.cerrarEditor();
  }

  protected rolesSeleccionados(): string[] { return String(this.draft['roles'] ?? '').split('|').map((role) => role.trim()).filter(Boolean); }

    protected cambiarRol(role: string, selected: boolean): void {
    const roles = new Set(this.rolesSeleccionados());
    selected ? roles.add(role) : roles.delete(role);
    this.draft['roles'] = [...roles].join('|');
  }

   protected usuariosDisponibles(): Array<Record<string, unknown>> {
     return this.usuariosApiRows().filter((user) => user['activo'] === true && (!user['cedulaProfesor'] || user['id'] === this.draft['usuarioId']));
   }

   protected seleccionarUsuarioProfesor(userId: string): void {
     const user = this.usuariosApiRows().find((item) => item['id'] === userId);
     if (user) this.draft['correo'] = String(user['correo'] ?? '');
   }

  protected campoSoloLectura(field: CampoFormulario): boolean {
    if (this.readOnly || field.readOnly === true) return true;
    if (this.key === 'profesores' && ['correo', 'usuarioId'].includes(field.key)) return true;
    if (!this.editingId) return false;
    if (this.key === 'periodos' && field.key === 'yearCiclo') return true;
     if (this.key === 'asignaturas' && ['codigo', 'tipoBanda', 'permiteMonografia'].includes(field.key)) return true;
     if (this.key === 'matriculas' && this.editingId && ['cedulaEstudiante', 'yearCiclo'].includes(field.key)) return true;
     if (this.key === 'asignaciones' && field.key !== 'profesor') return true;
    return false;
  }

   protected cerrarEditor(): void {
      this.editorOpen.set(false);
   }

   private accionesCrud(): Array<{ label: string; code: string; tone?: string }> {
     return [{ label: 'Editar', code: 'edit' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }];
   }

    private accionesProfesor(): Array<{ label: string; code: string }> {
      return [{ label: 'Editar', code: 'edit' }];
    }

    protected normalizarCodigoAsignatura(value: string): void {
      this.draft['codigo'] = String(value ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    }

   private accionesEstudiante(): Array<{ label: string; code: string; tone?: string }> {
     return [{ label: 'Editar', code: 'edit' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }];
   }

   private profesoresDemoRows(): Array<Record<string, unknown>> {
     return this.datos.listar('profesores').map((item) => ({ ...item, nombreCompleto: item['nombreCompleto'] ?? item['nombre'], acciones: this.accionesProfesor() }));
   }

   private estudiantesDemoApi(): EstudianteApi[] {
     return this.datos.listar('estudiantes').map((item, index) => {
       const parts = String(item['nombre'] ?? '').split(' ').filter(Boolean);
       return {
          idEstudiante: index + 1,
         nombre: parts.slice(0, Math.max(1, parts.length - 2)).join(' '),
         primerApellido: parts.at(-2) ?? '',
         segundoApellido: parts.at(-1) ?? null,
         cedula: String(item['cedula'] ?? ''),
         numeroCelular: String(item['numeroCelular'] ?? '') || null,
         email: String(item['correo'] ?? ''),
         fechaNacimiento: String(item['fechaNacimiento'] ?? '2009-05-15'),
          fechaRegistro: '2026-01-15',
       };
     });
   }

   private estudiantesDemoRows(): Array<Record<string, unknown>> {
     return this.estudiantesDemoApi().map((item) => ({ id: String(item.idEstudiante), nombre: item.nombre, nombreCompleto: this.nombreCompletoEstudiante(item), cedula: item.cedula, correo: item.email, numeroCelular: item.numeroCelular ?? '', fechaNacimiento: item.fechaNacimiento, primerApellido: item.primerApellido, segundoApellido: item.segundoApellido ?? '', acciones: this.accionesEstudiante() }));
   }

    private cursosDemo(): CursoLectivoApi[] {
      return this.datos.listar('periodos').map((item, index) => {
        const anio = Number(item['yearCiclo'] ?? 2026);
        const inicio = String(item['fechaInicio'] ?? `${anio}-02-09`);
        const fin = String(item['fechaFin'] ?? `${anio}-12-04`);
        return { idCursoLectivo: index + 1, yearCiclo: anio, anio, inicioSemestreI: inicio, finSemestreI: inicio, inicioSemestreII: fin, finSemestreII: fin, estado: 'PROGRAMADO', semestreActual: null, fechaInicio: inicio, fechaFin: fin };
      });
   }

   private cursosDemoRows(): Array<Record<string, unknown>> {
     return this.cursosDemo().map((course) => ({ id: String(course.idCursoLectivo), yearCiclo: course.yearCiclo, fechaInicio: this.formatearFecha(course.fechaInicio), fechaFin: this.formatearFecha(course.fechaFin), fechaInicioI: course.fechaInicio, fechaFinI: course.fechaFin, fechaInicioII: course.fechaInicio, fechaFinII: course.fechaFin, acciones: this.accionesCrud() }));
   }

    private seccionesDemo(): SeccionApi[] {
      return this.datos.listar('secciones').map((item, index) => {
        const yearCiclo = Number(item['yearCiclo'] ?? 2026);
        const seccion = String(item['nombre'] ?? item['seccion'] ?? '10-1');
        const [nivel, numero] = seccion.split('-').map(Number);
        return { idSeccion: String(index + 1), yearCiclo, seccion, anio: yearCiclo, nivel: nivel || 10, numero: numero || 1, nombre: seccion, cedulaGuia: null, nombreGuia: null, cantidadEstudiantes: 0 };
      });
   }

   private seccionesDemoRows(): Array<Record<string, unknown>> {
      return this.seccionesDemo().map((section) => { const parts = section.seccion.split('-'); return { id: String(section.idSeccion), yearCiclo: section.yearCiclo, seccion: section.seccion, nivel: parts[0], numeroSeccion: parts[1], acciones: [{ label: 'Eliminar', code: 'delete', tone: 'danger' }] }; });
   }

   private cargarMatriculasDemo(): void {
     const students = this.estudiantesDemoApi();
     this.estudiantesMatricula.set(students);
     const studentByName = new Map(students.map((student) => [this.nombreCompletoEstudiante(student), student]));
     this.matriculasApiRows.set(this.datos.listar('matriculas').map((item, index) => {
       const student = studentByName.get(String(item['estudiante'] ?? ''));
       const estado = String(item['estado'] ?? 'Activa');
       return { id: String(item.id), estudiante: item['estudiante'], cedulaEstudiante: student?.cedula ?? '', yearCiclo: Number(item['yearCiclo'] ?? 2026), seccion: item['seccion'], estado, idMatricula: index + 1, acciones: estado === 'FINALIZADA' ? [{ label: 'Eliminar', code: 'delete', tone: 'danger' }] : [{ label: 'Finalizar', code: 'finalize' }, { label: 'Subir a undécimo', code: 'promote' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }] };
     }));
   }

         private cargarProfesores(busqueda = '', pagina = this.paginaActual(), actualizaPaginacion = true): void {
      this.apiError = '';
          this.profesoresApi.listarPaginado(busqueda, pagina, this.tamanoPagina).subscribe({ next: (response) => { if (actualizaPaginacion) this.actualizarPaginacion(response); this.profesoresApiRows.set(response.elementos.map((item) => ({ id: item.cedula, usuarioId: item.idUsuario, nombre: item.nombre, nombreCompleto: [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' '), cedula: item.cedula, correo: item.email, numeroCelular: item.numeroCelular ?? '', fechaNacimiento: item.fechaNacimiento, primerApellido: item.primerApellido, segundoApellido: item.segundoApellido ?? '', password: '', acciones: this.accionesProfesor() }))); }, error: () => { this.profesoresApiRows.set([]); this.apiError = 'No se pudieron consultar los profesores.'; } });
    }

    private cargarEstudiantes(busqueda = '', pagina = this.paginaActual()): void {
      this.apiError = '';
         this.estudiantesApi.listarPaginado(busqueda, pagina, this.tamanoPagina).subscribe({ next: (response) => { this.actualizarPaginacion(response); this.estudiantesApiRows.set(response.elementos.map((item) => ({ id: item.cedula, nombre: item.nombre, nombreCompleto: [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' '), cedula: item.cedula, correo: item.email, numeroCelular: item.numeroCelular ?? '', fechaNacimiento: item.fechaNacimiento, fechaRegistro: item.fechaRegistro, primerApellido: item.primerApellido, segundoApellido: item.segundoApellido ?? '', acciones: [...this.accionesEstudiante(), { label: 'Historial', code: 'history' }] }))); }, error: () => { this.estudiantesApiRows.set([]); this.apiError = 'No se pudieron consultar los estudiantes.'; } });
    }

     private cargarMatriculas(busqueda = '', pagina = this.paginaActual()): void {
      this.apiError = '';
        this.estudiantesApi.listarPaginado('', 1, 100).pipe(map((response) => response.elementos)).subscribe({ next: (students) => {
         this.estudiantesMatricula.set(students);
           this.matriculasApi.listar({ busqueda, pagina, tamanoPagina: this.tamanoPagina }).subscribe({ next: (response) => { this.actualizarPaginacion(response); this.matriculasApiRows.set(response.elementos.map((item) => ({ id: `${item.anio}-${item.cedulaEstudiante}`, estudiante: item.nombreEstudiante, cedulaEstudiante: item.cedulaEstudiante, yearCiclo: item.anio, seccion: item.seccion, estado: item.estado, fechaRetiro: item.fechaRetiro, nivel: item.nivel, numeroSeccion: item.numero, acciones: [{ label: 'Editar', code: 'edit' }, ...(item.nivel === 10 ? [{ label: 'Subir de nivel', code: 'promote' }] : []), { label: 'Eliminar', code: 'delete', tone: 'danger' }] }))); }, error: (error) => this.notificarError(error, 'No se pudieron consultar las matrículas.') });
         }, error: () => { this.estudiantesMatricula.set([]); this.matriculasApiRows.set([]); this.apiError = 'No se pudieron consultar los estudiantes para las matrículas.'; } });
   }

   private cargarSecciones(): void {
        this.seccionesApi.listarPaginado({ pagina: 1, tamanoPagina: 100 }).pipe(map((response) => response.elementos)).subscribe({ next: (sections) => this.seccionesMatricula.set(sections), error: () => { this.seccionesMatricula.set([]); this.apiError = 'No se pudieron consultar las secciones.'; } });
   }

   private cargarCursosLectivos(): void {
        this.cursosLectivosApi.listarPaginado(1, 100).pipe(map((response) => response.elementos)).subscribe({ next: (courses) => this.cursosLectivosMatricula.set(courses), error: () => { this.cursosLectivosMatricula.set([]); this.apiError = 'No se pudieron consultar los cursos lectivos.'; } });
   }

    private cargarCursosAdministracion(pagina = this.paginaActual()): void {
        this.cursosLectivosApi.listarPaginado(pagina, this.tamanoPagina).subscribe({ next: (response) => { this.actualizarPaginacion(response); this.cursosApiRows.set(response.elementos.map((course) => ({ id: String(course.idCursoLectivo), yearCiclo: course.yearCiclo, fechaInicio: this.formatearFecha(course.fechaInicio), fechaFin: this.formatearFecha(course.fechaFin), fechaInicioI: course.inicioSemestreI, fechaFinI: course.finSemestreI, fechaInicioII: course.inicioSemestreII, fechaFinII: course.finSemestreII, acciones: [{ label: 'Editar', code: 'edit' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }] }))); }, error: () => { this.cursosApiRows.set([]); this.apiError = 'No se pudieron consultar los cursos lectivos.'; } });
   }

      private cargarSeccionesAdministracion(pagina = this.paginaActual(), actualizaPaginacion = true): void {
         this.seccionesApi.listarPaginado({ pagina, tamanoPagina: this.tamanoPagina }).subscribe({ next: (response) => { if (actualizaPaginacion) this.actualizarPaginacion(response); this.seccionesApiRows.set(response.elementos.map((section) => { const parts = section.seccion.split('-'); return { id: String(section.idSeccion), yearCiclo: section.yearCiclo, seccion: section.seccion, nivel: parts[0], numeroSeccion: parts[1], acciones: [{ label: 'Eliminar', code: 'delete', tone: 'danger' }] }; })); }, error: () => { this.seccionesApiRows.set([]); this.apiError = 'No se pudieron consultar las secciones.'; } });
    }

    private notificarError(error: unknown, fallback: string): void {
      const mensaje = (error as { error?: { mensaje?: string } })?.error?.mensaje ?? fallback;
      this.apiError = mensaje;
      this.feedback.error(mensaje);
    }

    private cargarUsuarios(busqueda = '', pagina = this.paginaActual(), actualizaPaginacion = true, tamanoPagina = this.tamanoPagina): void {
      this.usuariosApi.listar(busqueda, pagina, tamanoPagina).subscribe({
        next: (response) => { if (actualizaPaginacion) this.actualizarPaginacion(response); this.usuariosApiRows.set(response.elementos.map((item) => this.usuarioRow(item))); },
        error: (error) => { this.usuariosApiRows.set([]); this.notificarError(error, 'No se pudieron consultar los usuarios.'); },
      });
    }

    private usuarioRow(item: UsuarioAdminApi): Record<string, unknown> {
      return {
        id: item.id,
        correo: item.email,
        roles: item.roles.map((role) => ROLES_FRONTEND[role] ?? role).join('|'),
        rolesBackend: item.roles.join('|'),
        estado: item.activo ? 'Activo' : 'Inactivo',
        activo: item.activo,
        bloqueadoHasta: this.fechaHoraLabel(item.bloqueadoHasta),
        ultimoLogin: this.fechaHoraLabel(item.ultimoLogin, 'No registrado'),
        creadoEn: this.fechaHoraLabel(item.creadoEn),
        intentosFallidosLogin: item.intentosFallidosLogin ?? 'No disponible',
        contrasenaCambiadaEn: this.fechaHoraLabel(item.passwordCambiadaEn, 'No disponible'),
        actualizadoEn: this.fechaHoraLabel(item.actualizadoEn, 'No disponible'),
        tokensInvalidadosDesde: this.fechaHoraLabel(item.tokensInvalidadosDesde, 'No disponible'),
        cedulaProfesor: item.cedulaProfesor ?? '',
        nombreProfesor: item.nombreProfesor ?? '',
        acciones: [{ label: 'Ver detalle', code: 'view' }, ...this.accionesCrud()],
      };
    }

    private fechaHoraLabel(value: string | null | undefined, empty = 'No registrado'): string {
      if (!value) return empty;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    }

    private cargarAsignaturas(pagina = this.paginaActual(), actualizaPaginacion = true): void {
      this.asignaturasApi.listar({ pagina, tamanoPagina: this.tamanoPagina }).subscribe({
        next: (response) => { if (actualizaPaginacion) this.actualizarPaginacion(response); this.asignaturasApiRows.set(response.elementos.map((item) => ({
          id: item.codigo,
          codigo: item.codigo,
          tipoAsignatura: this.tipoAsignaturaLabel(item.tipo),
          tipoBackend: item.tipo,
          nombre: item.nombre,
          descripcion: item.descripcion ?? '',
          imparteNivel10: item.imparteNivel10,
          imparteNivel11: item.imparteNivel11,
          acciones: this.accionesCrud(),
        }))); },
        error: (error) => { this.asignaturasApiRows.set([]); this.notificarError(error, 'No se pudieron consultar las asignaturas.'); },
      });
    }

    private tipoAsignaturaLabel(tipo: string): string {
      return tipo === 'TRONCAL' ? 'Troncal' : tipo === 'SUPERIOR' ? 'Superior' : tipo === 'MEDIO' ? 'Medio' : 'MEP';
    }

    private cargarAsignaciones(pagina = this.paginaActual()): void {
      this.asignacionesApi.listar({ pagina, tamanoPagina: this.tamanoPagina }).subscribe({
        next: (response) => { this.actualizarPaginacion(response); this.asignacionesApiRows.set(response.elementos.map((item) => ({
          id: `${item.anio}-${item.nivel}-${item.numero}-${item.codigoAsignatura}-${item.cedulaProfesor}`,
          anio: item.anio,
          nivel: item.nivel,
          numero: item.numero,
          profesor: item.nombreProfesor,
          cedulaProfesor: item.cedulaProfesor,
          codigo: item.codigoAsignatura,
          codigoAsignatura: `${item.codigoAsignatura} · ${item.asignatura}`,
          asignatura: item.asignatura,
           seccion: item.seccion,
           yearCiclo: item.anio,
          acciones: this.accionesCrud(),
         }))); },
        error: (error) => { this.asignacionesApiRows.set([]); this.notificarError(error, 'No se pudieron consultar las asignaciones.'); },
      });
    }

    private accionUsuario(action: string, registro: RegistroPortal): void {
      if (action === 'delete' && confirm(`¿Eliminar el usuario ${registro['correo']}?`)) {
        this.usuariosApi.borrar(String(registro.id)).subscribe({ next: () => { this.feedback.exito('El usuario fue eliminado.'); this.cargarUsuarios(); }, error: (error) => this.notificarError(error, 'No se pudo eliminar el usuario.') });
        return;
      }
       if (action === 'view') {
         this.usuariosApi.obtener(String(registro.id)).subscribe({ next: (item) => this.abrirDetalleUsuario(item), error: (error) => this.notificarError(error, 'No se pudo consultar el detalle del usuario.') });
         return;
       }
       if (action === 'edit') {
        this.editingId = registro.id;
         this.readOnly = false;
        this.editorTitle = this.readOnly ? 'Detalle de usuario' : 'Editar usuario';
        this.validationAttempted = false;
        this.apiError = '';
        this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, String(registro[field.key] ?? '')]));
        this.draft['rolesBackend'] = String(registro['rolesBackend'] ?? '');
        this.draft['emailOriginal'] = String(registro['correo'] ?? '');
         this.editorOpen.set(true);
       }
     }

     private abrirDetalleUsuario(item: UsuarioAdminApi): void {
       this.editingId = item.id;
       this.readOnly = true;
       this.editorTitle = 'Detalle de usuario';
       this.validationAttempted = false;
       this.apiError = '';
       this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, String(this.usuarioRow(item)[field.key] ?? '')]));
       this.draft['rolesBackend'] = item.roles.join('|');
       this.draft['emailOriginal'] = item.email;
       this.editorOpen.set(true);
     }

    private guardarUsuario(): void {
      const email = String(this.draft['correo'] ?? '').trim();
      const password = String(this.draft['password'] ?? '').trim();
      const roles = this.rolesSeleccionados().map((role) => ROLES_BACKEND[role] ?? role);
      const finish = () => { this.feedback.exito(this.editingId ? 'Los cambios del usuario fueron guardados.' : 'El usuario fue creado.'); this.cerrarEditor(); this.cargarUsuarios(); };
      const fail = (error: unknown) => this.notificarError(error, 'No se pudo guardar el usuario.');

      if (!this.editingId) {
        this.usuariosApi.registrar(email, password).pipe(switchMap((created) => {
          const additions = roles.filter((role) => role !== 'PROFESOR_REGULAR').map((role) => this.usuariosApi.agregarRol(created.id, role));
          return additions.length ? forkJoin(additions) : of([]);
        })).subscribe({ next: finish, error: fail });
        return;
      }

      const current = new Set(String(this.draft['rolesBackend'] ?? '').split('|').filter(Boolean));
      const desired = new Set(roles);
      const operations = [] as Array<ReturnType<UsuariosApiService['actualizarEmail']>>;
      if (email !== this.draft['emailOriginal']) operations.push(this.usuariosApi.actualizarEmail(this.editingId, email));
      if (password) operations.push(this.usuariosApi.resetearContrasena(this.editingId, password));
      if (this.draft['estado'] === 'Activo') operations.push(this.usuariosApi.activar(this.editingId));
      else operations.push(this.usuariosApi.desactivar(this.editingId));
      for (const role of desired) if (!current.has(role)) operations.push(this.usuariosApi.agregarRol(this.editingId, role));
      for (const role of current) if (!desired.has(role)) operations.push(this.usuariosApi.quitarRol(this.editingId, role));
      forkJoin(operations.length ? operations : [of(void 0)]).subscribe({ next: finish, error: fail });
    }

    private accionAsignatura(action: string, registro: RegistroPortal): void {
      if (action === 'delete' && confirm(`¿Eliminar la asignatura ${registro['codigo']}?`)) {
        this.asignaturasApi.borrar(String(registro['codigo'])).subscribe({ next: () => { this.feedback.exito('La asignatura fue eliminada.'); this.cargarAsignaturas(); }, error: (error) => this.notificarError(error, 'No se pudo eliminar la asignatura.') });
        return;
      }
      if (action === 'view' || action === 'edit') {
        this.editingId = registro.id;
        this.readOnly = action === 'view';
        this.editorTitle = this.readOnly ? 'Detalle de asignatura' : 'Editar asignatura';
        this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, String(registro[field.key] ?? '')]));
        this.editorOpen.set(true);
      }
    }

    private guardarAsignatura(): void {
      const request: AsignaturaRequest = {
        nombre: String(this.draft['nombre'] ?? '').trim(),
        tipo: this.tipoAsignaturaBackend(String(this.draft['tipoAsignatura'] ?? '')),
        descripcion: String(this.draft['descripcion'] ?? '').trim() || null,
        imparteNivel10: this.draft['imparteNivel10'] !== 'false',
        imparteNivel11: this.draft['imparteNivel11'] !== 'false',
      };
      const done = () => { this.feedback.exito(this.editingId ? 'La asignatura fue actualizada.' : 'La asignatura fue creada.'); this.cerrarEditor(); this.cargarAsignaturas(); };
      const error = (response: unknown) => this.notificarError(response, 'No se pudo guardar la asignatura.');
      if (this.editingId) this.asignaturasApi.actualizar(String(this.editingId), request).subscribe({ next: done, error });
      else this.asignaturasApi.registrar({ ...request, codigo: String(this.draft['codigo'] ?? '').trim().toUpperCase() }).subscribe({ next: done, error });
    }

    private tipoAsignaturaBackend(tipo: string): string {
      return tipo === 'Troncal' ? 'TRONCAL' : tipo === 'Superior' ? 'SUPERIOR' : tipo === 'Medio' ? 'MEDIO' : 'MEP';
    }

    private accionAsignacion(action: string, registro: RegistroPortal): void {
      if (action === 'delete' && confirm('¿Eliminar esta asignación académica?')) {
        this.asignacionesApi.borrar(Number(registro['anio']), Number(registro['nivel']), Number(registro['numero']), String(registro['codigo'] ?? ''), String(registro['cedulaProfesor'] ?? '')).subscribe({ next: () => { this.feedback.exito('La asignación fue eliminada.'); this.cargarAsignaciones(); }, error: (error) => this.notificarError(error, 'No se pudo eliminar la asignación.') });
        return;
      }
      if (action === 'view' || action === 'edit') {
        this.editingId = registro.id;
        this.readOnly = action === 'view';
        this.editorTitle = this.readOnly ? 'Detalle de asignación' : 'Editar asignación';
        this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, String(registro[field.key] ?? '')]));
         this.draft['anio'] = String(registro['anio'] ?? '');
         this.draft['yearCiclo'] = String(registro['yearCiclo'] ?? registro['anio'] ?? '');
        this.draft['nivel'] = String(registro['nivel'] ?? '');
        this.draft['numero'] = String(registro['numero'] ?? '');
        this.draft['cedulaProfesor'] = String(registro['cedulaProfesor'] ?? '');
        this.draft['cedulaProfesorOriginal'] = String(registro['cedulaProfesor'] ?? '');
        this.editorOpen.set(true);
      }
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
   }

  private guardarProfesor(): void {
    this.validationAttempted = true;
    const validation = this.validarProfesorDraft();
    if (validation) { this.apiError = validation; return; }
    const request = this.profesorRequest();
      if (this.editingId) {
        this.profesoresApi.actualizar(String(this.draft['cedulaOriginal'] ?? this.draft['cedula']), {
          nombre: request.nombre,
          primerApellido: request.primerApellido,
          segundoApellido: request.segundoApellido,
          numeroCelular: request.numeroCelular,
          fechaNacimiento: request.fechaNacimiento,
        }).subscribe({ next: () => { this.feedback.exito('El profesor fue actualizado.'); this.cerrarEditor(); this.cargarProfesores(); }, error: (error) => this.notificarError(error, 'No se pudo guardar el profesor.') });
      } else {
        this.profesoresApi.registrar(request).subscribe({ next: () => { this.feedback.exito('El profesor fue creado.'); this.cerrarEditor(); this.cargarProfesores(); }, error: (error) => this.notificarError(error, 'No se pudo guardar el profesor.') });
      }
   }

    private accionEstudiante(action: string, registro: RegistroPortal): void {
      if (action === 'history') {
        this.router.navigate(['/estudiantes', encodeURIComponent(String(registro['cedula'])), 'historial']);
        return;
      }
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
      if (action === 'delete' && confirm(`¿Eliminar al estudiante ${registro['nombreCompleto']}?`)) this.estudiantesApi.borrar(String(registro['cedula'])).subscribe({ next: () => { this.feedback.exito('El estudiante fue eliminado.'); this.cargarEstudiantes(); }, error: (error) => this.notificarError(error, 'No se pudo eliminar el estudiante.') });
   }

   private guardarEstudiante(): void {
     this.validationAttempted = true;
     const validation = this.validarEstudianteDraft();
     if (validation) { this.apiError = validation; return; }
     const request = this.estudianteRequest();
      if (this.editingId) {
        this.estudiantesApi.actualizar(String(this.draft['cedulaOriginal'] ?? this.draft['cedula']), { nombre: request.nombre, primerApellido: request.primerApellido, segundoApellido: request.segundoApellido, numeroCelular: request.numeroCelular, email: request.email, fechaNacimiento: request.fechaNacimiento }).subscribe({ next: () => { this.feedback.exito('El estudiante fue actualizado.'); this.cerrarEditor(); this.cargarEstudiantes(); }, error: (error) => this.notificarError(error, 'No se pudo guardar el estudiante.') });
      } else {
        this.estudiantesApi.registrar(request).subscribe({ next: () => { this.feedback.exito('El estudiante fue creado.'); this.cerrarEditor(); this.cargarEstudiantes(); }, error: (error) => this.notificarError(error, 'No se pudo guardar el estudiante.') });
      }
   }

   private estudianteRequest(): EstudianteRequest {
     return { nombre: String(this.draft['nombre'] ?? ''), primerApellido: String(this.draft['primerApellido'] ?? ''), segundoApellido: String(this.draft['segundoApellido'] ?? '') || null, cedula: String(this.draft['cedula'] ?? ''), numeroCelular: String(this.draft['numeroCelular'] ?? '') || null, email: String(this.draft['correo'] ?? ''), fechaNacimiento: String(this.draft['fechaNacimiento'] ?? '') };
   }

   protected fieldError(key: string): string {
       if (!this.validationAttempted || this.readOnly || !['profesores', 'estudiantes', 'matriculas', 'periodos', 'secciones'].includes(this.key)) return '';
       const value = String(this.draft[key] ?? '').trim();
         const required = new Set(this.key === 'usuarios' ? ['correo', 'password', 'roles'] : this.key === 'profesores' ? ['usuarioId', 'nombre', 'primerApellido', 'cedula', 'correo', 'fechaNacimiento'] : this.key === 'estudiantes' ? ['nombre', 'primerApellido', 'cedula', 'correo', 'fechaNacimiento'] : this.key === 'matriculas' ? ['cedulaEstudiante', 'yearCiclo', 'nivel', 'numeroSeccion'] : this.key === 'periodos' ? ['yearCiclo', 'fechaInicioI', 'fechaFinI', 'fechaInicioII', 'fechaFinII'] : ['yearCiclo', 'nivel', 'numeroSeccion']);
        const labels: Record<string, string> = { usuarioId: 'Usuario disponible', nombre: 'Nombre', primerApellido: 'Primer apellido', cedula: 'Cédula', correo: 'Correo electrónico', fechaNacimiento: 'Fecha de nacimiento', password: 'Contraseña', roles: 'Roles', cedulaEstudiante: 'Cédula del estudiante', yearCiclo: 'Curso lectivo', nivel: 'Nivel', numeroSeccion: 'Número de sección', fechaInicioI: 'Inicio del I semestre', fechaFinI: 'Fin del I semestre', fechaInicioII: 'Inicio del II semestre', fechaFinII: 'Fin del II semestre' };
      const label = labels[key] ?? key;
      if (required.has(key) && !value) return `El campo '${label}' es obligatorio y no puede estar vacío.`;
      if ((key === 'nombre' || key === 'primerApellido') && value.length > 0 && value.length < 2) return `El campo '${label}' debe tener al menos 2 caracteres.`;
      if ((key === 'cedula' || key === 'cedulaEstudiante') && value.length > 0 && value.length < 5) return `El campo '${label}' debe tener al menos 5 caracteres.`;
       if (this.key === 'matriculas' && (key === 'yearCiclo' || key === 'numeroSeccion') && value && (!Number.isInteger(Number(value)) || Number(value) <= 0)) return `El campo '${label}' debe ser un número válido mayor que cero.`;
       if (key === 'correo' && value && !/^\S+@\S+\.\S+$/.test(value)) return "El campo 'Correo electrónico' no tiene un formato válido.";
       if (['fechaNacimiento', 'fechaInicioI', 'fechaFinI', 'fechaInicioII', 'fechaFinII'].includes(key) && value && !this.esFechaIsoValida(value)) return `El campo '${label}' debe contener una fecha real.`;
       if (key === 'fechaNacimiento' && value) {
        const date = new Date(`${value}T00:00:00`);
        const today = new Date();
        if (date < new Date('1900-01-01T00:00:00') || date > today) return "El campo 'Fecha de nacimiento' debe estar entre 1900 y hoy.";
      }
       return '';
     }

    private esFechaIsoValida(value: string): boolean {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    }

  private validarUsuarioDraft(): string | null {
      const correo = String(this.draft['correo'] ?? '').trim();
      const password = String(this.draft['password'] ?? '').trim();
      if (!correo) return "El campo 'correo' es obligatorio y no puede estar vacío.";
      if (!/^\S+@\S+\.\S+$/.test(correo)) return 'Escriba un correo electrónico válido.';
       if (!this.editingId && !password) return "El campo 'contraseña' es obligatorio y no puede estar vacío.";
       if (password && (password.length < 8 || password.length > 128)) return 'La contraseña debe tener entre 8 y 128 caracteres.';
      if (!this.rolesSeleccionados().length) return 'Seleccione al menos un rol.';
      return null;
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
       if (!this.esFechaIsoValida(birthDate) || birthDate < '1900-01-01' || birthDate > new Date().toISOString().slice(0, 10)) return 'La fecha de nacimiento debe ser real y estar entre 1900 y hoy.';
      return null;
   }

    private profesorRequest(): RegistrarProfesorRequest {
      return { nombre: String(this.draft['nombre'] ?? ''), primerApellido: String(this.draft['primerApellido'] ?? ''), segundoApellido: String(this.draft['segundoApellido'] ?? '') || null, cedula: String(this.draft['cedula'] ?? ''), numeroCelular: String(this.draft['numeroCelular'] ?? '') || null, fechaNacimiento: String(this.draft['fechaNacimiento'] ?? ''), idUsuario: String(this.draft['usuarioId'] ?? '') };
  }

   private validarProfesorDraft(): string | null {
     if (!this.editingId && !String(this.draft['usuarioId'] ?? '').trim()) return "Seleccione un usuario disponible para el perfil del profesor.";
     if (!String(this.draft['nombre'] ?? '').trim()) return "El campo 'nombre' es obligatorio y no puede estar vacío.";
    if (!String(this.draft['primerApellido'] ?? '').trim()) return "El campo 'primerApellido' es obligatorio y no puede estar vacío.";
    if (!String(this.draft['cedula'] ?? '').trim()) return "El campo 'cedula' es obligatorio y no puede estar vacío.";
    if (!String(this.draft['correo'] ?? '').trim()) return "El campo 'correo' es obligatorio y no puede estar vacío.";
    if (!String(this.draft['fechaNacimiento'] ?? '').trim()) return "El campo 'fechaNacimiento' es obligatorio y no puede estar vacío.";
    if (String(this.draft['nombre'] ?? '').trim().length < 2 || String(this.draft['primerApellido'] ?? '').trim().length < 2) return 'El nombre y el primer apellido deben tener al menos 2 caracteres.';
    if (String(this.draft['cedula'] ?? '').trim().length < 5) return 'La cédula debe tener al menos 5 caracteres.';
    if (!/^\S+@\S+\.\S+$/.test(String(this.draft['correo'] ?? '').trim())) return 'Escriba un correo electrónico válido.';
    const birthDate = String(this.draft['fechaNacimiento'] ?? '');
     if (!this.esFechaIsoValida(birthDate) || birthDate < '1900-01-01' || birthDate > new Date().toISOString().slice(0, 10)) return 'La fecha de nacimiento debe ser real y estar entre 1900-01-01 y hoy.';
     return null;
  }

   private validarCatalogoAdministrativo(): string | null {
      const required = this.key === 'asignaturas' ? ['codigo', 'tipoAsignatura', 'nombre'] : ['profesor', 'codigo', 'yearCiclo', 'seccion'];
     const missing = required.find((key) => !String(this.draft[key] ?? '').trim());
      if (missing) return `El campo '${missing}' es obligatorio.`;
      if (this.key === 'asignaturas' && !/^[A-Z]{3}$/.test(String(this.draft['codigo']).trim())) return 'El código debe tener exactamente tres letras mayúsculas.';
      if (this.key === 'asignaturas' && String(this.draft['nombre'] ?? '').trim().length < 2) return 'El nombre de la asignatura debe tener al menos 2 caracteres.';
      if (this.key === 'asignaturas' && this.draft['imparteNivel10'] !== 'true' && this.draft['imparteNivel11'] !== 'true') return 'La asignatura debe impartirse al menos en nivel 10 o nivel 11.';
      if (this.key === 'asignaciones' && !/^[A-Z]{3}$/.test(String(this.draft['codigo']).trim())) return 'El código de asignatura debe tener exactamente tres letras mayúsculas.';
     return null;
   }

   private guardarAsignacion(): void {
      const teacher = this.profesoresDisponiblesAsignacion().find((item) => item.nombre === this.draft['profesor']);
      const [nivel, numero] = String(this.draft['seccion'] ?? '').split('-').map(Number);
       const anio = Number(this.draft['yearCiclo'] ?? this.draft['anio'] ?? new Date().getFullYear());
      const codigo = String(this.draft['codigo'] ?? '').trim();
      if (!teacher || !nivel || !numero) { this.apiError = 'Seleccione un profesor y una sección válida.'; this.feedback.error(this.apiError, 'Revise los datos del formulario'); return; }
      const done = () => { this.feedback.exito(this.editingId ? 'La asignación fue actualizada.' : 'La asignación fue registrada.'); this.cerrarEditor(); this.cargarAsignaciones(); };
      const fail = (error: unknown) => this.notificarError(error, 'No se pudo guardar la asignación.');
      if (this.editingId) {
        this.asignacionesApi.cambiarProfesor(anio, nivel, numero, codigo, String(this.draft['cedulaProfesorOriginal'] ?? ''), teacher.cedula).subscribe({ next: done, error: fail });
        return;
      }
      const request: RegistrarAsignacionRequest = { anio, nivel, numero, codigoAsignatura: codigo, cedulaProfesor: teacher.cedula };
      this.asignacionesApi.registrar(request).subscribe({ next: done, error: fail });
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
      const anio = Number(registro['yearCiclo']);
      const cedula = String(registro['cedulaEstudiante'] ?? '');
      if (action === 'edit') {
        this.editingId = registro.id;
        this.readOnly = false;
        this.validationAttempted = false;
        this.apiError = '';
        this.editorTitle = 'Cambiar sección de matrícula';
        this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, String(registro[field.key] ?? '')]));
        this.editorOpen.set(true);
        return;
      }
       if (action === 'promote') {
         this.promotionTarget.set({ estudiante: String(registro['estudiante'] ?? 'Estudiante'), cedula, seccion: String(registro['seccion'] ?? ''), cursoActual: anio, cursoDestino: anio + 1, numeroSeccion: Number(registro['numeroSeccion']) });
         return;
       }
      if (action === 'retire' && confirm('¿Registrar el retiro de esta matrícula?')) {
        const fecha = prompt('Fecha de retiro (AAAA-MM-DD):', new Date().toISOString().slice(0, 10));
        if (!fecha) return;
        const motivo = prompt('Motivo del retiro (opcional):', '') ?? '';
        this.matriculasApi.retirar(anio, cedula, fecha, motivo || undefined).subscribe({ next: () => { this.feedback.exito('El retiro de la matrícula fue registrado.'); this.cargarMatriculas(); }, error: (error) => this.notificarError(error, 'No se pudo registrar el retiro.') });
        return;
      }
      if (action === 'unretire' && confirm('¿Anular el retiro de esta matrícula?')) this.matriculasApi.quitarRetiro(anio, cedula).subscribe({ next: () => { this.feedback.exito('El retiro de la matrícula fue anulado.'); this.cargarMatriculas(); }, error: (error) => this.notificarError(error, 'No se pudo anular el retiro.') });
      if (action === 'delete' && confirm('¿Eliminar esta matrícula?')) this.matriculasApi.borrar(anio, cedula).subscribe({ next: () => { this.feedback.exito('La matrícula fue eliminada.'); this.cargarMatriculas(); }, error: (error) => this.notificarError(error, 'No se pudo eliminar la matrícula.') });
   }

   private guardarMatricula(): void {
     this.validationAttempted = true;
     const error = this.validarMatriculaDraft();
      if (error) { this.apiError = error; this.feedback.error(error, 'Revise los datos del formulario'); return; }
       const anio = Number(this.draft['yearCiclo']);
       const nivel = Number(this.draft['nivel']);
       const numero = Number(this.draft['numeroSeccion']);
       if (this.editingId) {
         this.matriculasApi.cambiarSeccion(anio, String(this.draft['cedulaEstudiante']), { nivel, numero }).subscribe({ next: () => { this.feedback.exito('La sección de la matrícula fue actualizada.'); this.cerrarEditor(); this.cargarMatriculas(); }, error: (response) => this.notificarError(response, 'No se pudo cambiar la sección de la matrícula.') });
         return;
       }
       const request: RegistrarMatriculaRequest = { cedulaEstudiante: String(this.draft['cedulaEstudiante'] ?? '').trim(), anio, nivel, numero };
       this.matriculasApi.registrar(request).subscribe({ next: () => { this.feedback.exito('La matrícula fue registrada.'); this.cerrarEditor(); this.cargarMatriculas(); }, error: (error) => this.notificarError(error, 'No se pudo registrar la matrícula.') });
   }

   private validarMatriculaDraft(): string | null {
     const cedula = String(this.draft['cedulaEstudiante'] ?? '').trim();
     if (!cedula) return "El campo 'Cédula del estudiante' es obligatorio y no puede estar vacío.";
     if (cedula.length < 5) return "El campo 'Cédula del estudiante' debe tener al menos 5 caracteres.";
      const year = String(this.draft['yearCiclo'] ?? '').trim();
      if (!year) return "El campo 'Curso lectivo' es obligatorio y no puede estar vacío.";
      if (!Number.isInteger(Number(year)) || Number(year) <= 0) return "El campo 'Curso lectivo' debe ser válido.";
      const level = String(this.draft['nivel'] ?? '').trim();
      if (!level || ![10, 11].includes(Number(level))) return "El campo 'Nivel' debe ser 10 u 11.";
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
      if (action === 'delete' && confirm(`¿Eliminar el curso lectivo ${registro['yearCiclo']}?`)) this.cursosLectivosApi.borrar(Number(registro['yearCiclo'])).subscribe({ next: () => { this.feedback.exito('El curso lectivo fue eliminado.'); this.cargarCursosAdministracion(); }, error: (error) => this.notificarError(error, 'No se pudo eliminar el curso lectivo.') });
   }

   private guardarCursoLectivo(): void {
     this.validationAttempted = true;
     const error = this.validarCursoLectivoDraft();
      if (error) { this.apiError = error; this.feedback.error(error, 'Revise los datos del formulario'); return; }
      const anio = Number(this.draft['yearCiclo']);
      const request: CursoLectivoRequest = { anio, inicioSemestreI: this.draft['fechaInicioI'], finSemestreI: this.draft['fechaFinI'], inicioSemestreII: this.draft['fechaInicioII'], finSemestreII: this.draft['fechaFinII'] };
       const success = () => { this.feedback.exito(this.editingId ? 'El curso lectivo fue actualizado.' : 'El curso lectivo fue creado.'); this.cerrarEditor(); this.cargarCursosAdministracion(); this.cargarCursosLectivos(); };
       const failure = (error: unknown) => this.notificarError(error, 'No se pudo guardar el curso lectivo.');
       if (this.editingId) this.cursosLectivosApi.actualizar(anio, { inicioSemestreI: request.inicioSemestreI, finSemestreI: request.finSemestreI, inicioSemestreII: request.inicioSemestreII, finSemestreII: request.finSemestreII }).subscribe({ next: success, error: failure });
       else this.cursosLectivosApi.abrir(request).subscribe({ next: success, error: failure });
   }

    private validarCursoLectivoDraft(): string | null {
      const fields: Array<[string, string]> = [['yearCiclo', 'Curso lectivo'], ['fechaInicioI', 'Inicio del I semestre'], ['fechaFinI', 'Fin del I semestre'], ['fechaInicioII', 'Inicio del II semestre'], ['fechaFinII', 'Fin del II semestre']];
      for (const [key, label] of fields) if (!String(this.draft[key] ?? '').trim()) return `El campo '${label}' es obligatorio y no puede estar vacío.`;
      const year = Number(this.draft['yearCiclo']);
      const dates = ['fechaInicioI', 'fechaFinI', 'fechaInicioII', 'fechaFinII'].map((key) => String(this.draft[key]));
      if (!Number.isInteger(year) || year < 1900 || year > 2100) return "El campo 'Curso lectivo' debe estar entre 1900 y 2100.";
      if (dates.some((date) => !this.esFechaIsoValida(date))) return 'Todas las fechas deben ser fechas reales con formato AAAA-MM-DD.';
      if (dates.some((date) => Number(date.slice(0, 4)) !== year)) return 'Todas las fechas deben pertenecer al curso lectivo seleccionado.';
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
      if (action === 'delete' && confirm(`¿Eliminar la sección ${registro['seccion']} del curso ${registro['yearCiclo']}?`)) this.seccionesApi.borrar(Number(registro['yearCiclo']), Number(registro['nivel']), Number(registro['numeroSeccion'])).subscribe({ next: () => { this.feedback.exito('La sección fue eliminada.'); this.cargarSeccionesAdministracion(); }, error: (error) => this.notificarError(error, 'No se pudo eliminar la sección.') });
   }

   private guardarSeccion(): void {
     this.validationAttempted = true;
     const error = this.validarSeccionDraft();
      if (error) { this.apiError = error; this.feedback.error(error, 'Revise los datos del formulario'); return; }
      const request: SeccionRequest = { anio: Number(this.draft['yearCiclo']), nivel: Number(this.draft['nivel']), numero: Number(this.draft['numeroSeccion']) };
      this.seccionesApi.registrar(request).subscribe({ next: () => { this.feedback.exito('La sección fue registrada.'); this.cerrarEditor(); this.cargarSeccionesAdministracion(); }, error: (error) => this.notificarError(error, 'No se pudo registrar la sección.') });
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
       const term = this.studentSearch.trim().toLowerCase();
       return this.estudiantesMatricula().filter((student) => !matriculados.has(student.cedula)).filter((student) => !term || this.nombreCompletoEstudiante(student).toLowerCase().includes(term) || student.cedula.toLowerCase().includes(term));
    }

    protected cancelarPromocion(): void { this.promotionTarget.set(null); }

    protected confirmarPromocion(): void {
      const target = this.promotionTarget();
      if (!target) return;
      this.matriculasApi.subirSeccion({ anio: target.cursoDestino, numero: target.numeroSeccion }).subscribe({ next: () => { this.promotionTarget.set(null); this.feedback.exito('La sección fue subida a undécimo.'); this.cargarMatriculas(); }, error: (error) => this.notificarError(error, 'No se pudo subir la sección a undécimo.') });
    }

     protected estudiantesResultadosMatricula(): EstudianteApi[] {
      const disponibles = this.estudiantesDisponiblesMatricula();
      return this.studentSearch.trim() ? disponibles : disponibles.slice(0, 8);
     }

     protected buscarEstudiantesMatricula(value: string): void {
       this.studentSearch = value;
       const busqueda = value.trim();
       if (busqueda.length === 1) return;
       this.estudiantesApi.listar(busqueda).subscribe({ next: (students) => this.estudiantesMatricula.set(students), error: () => this.apiError = 'No se pudieron buscar estudiantes.' });
     }

    protected seleccionarEstudianteMatricula(student: EstudianteApi): void {
      this.draft['cedulaEstudiante'] = student.cedula;
      this.studentSearch = this.nombreCompletoEstudiante(student);
    }

    protected estudianteSeleccionadoMatricula(): string {
      const selected = this.estudiantesMatricula().find((student) => student.cedula === this.draft['cedulaEstudiante']);
      return selected ? this.nombreCompletoEstudiante(selected) : 'Estudiante no encontrado';
    }

    protected inicialesEstudiante(student: EstudianteApi): string {
      return [student.nombre, student.primerApellido].map((part) => part.trim().charAt(0)).filter(Boolean).join('').toUpperCase();
    }

   protected nombreCompletoEstudiante(student: EstudianteApi): string {
     return [student.nombre, student.primerApellido, student.segundoApellido].filter(Boolean).join(' ');
   }

    protected seccionesDisponiblesMatricula(): SeccionApi[] {
      const year = Number(this.draft['yearCiclo']);
      const level = Number(this.draft['nivel']);
      return this.seccionesMatricula().filter((section) => section.yearCiclo === year && (!level || section.nivel === level));
   }

   protected cursosDisponiblesMatricula(): CursoLectivoApi[] {
     return this.cursosLectivosMatricula();
   }

   protected cambioCursoLectivo(year: string): void {
     this.draft['yearCiclo'] = year;
     this.draft['numeroSeccion'] = '';
     this.draft['seccion'] = '';
     this.draft['cedulaEstudiante'] = '';
    this.studentSearch = '';
  }

    protected cursoLectivoLabel(course: CursoLectivoApi): string {
       return `Curso lectivo ${course.yearCiclo} | ${this.formatearFecha(course.fechaInicio ?? course.inicioSemestreI)} al ${this.formatearFecha(course.fechaFin ?? course.finSemestreII)}`;
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
