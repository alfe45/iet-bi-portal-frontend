import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataTableComponent } from '../compartidos/componentes/tabla-datos.component';
import { StatGridComponent } from '../compartidos/componentes/cuadricula-estadisticas.component';
import { AutenticacionService } from '../nucleo/autenticacion/autenticacion.service';
import { FuncionalidadAdministrativa, RegistroVista } from '../nucleo/modelos/datos-vista';
import { ColumnaTabla } from '../nucleo/modelos/modelos-prototipo';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';
import { CuentaProfesorRequest, ProfesoresApiService, RegistrarProfesorRequest } from '../nucleo/api/profesores-api.service';
import { EstudiantesApiService, EstudianteApi, EstudianteRequest } from '../nucleo/api/estudiantes-api.service';
import { MatriculasApiService, RegistrarMatriculaRequest } from '../nucleo/api/matriculas-api.service';
import { SeccionesApiService, SeccionApi, SeccionRequest } from '../nucleo/api/secciones-api.service';
import { CursosLectivosApiService, CursoLectivoApi, CursoLectivoRequest } from '../nucleo/api/cursos-lectivos-api.service';
import { UsuariosApiService, UsuarioAdminApi } from '../nucleo/api/usuarios-api.service';
import { AsignaturasApiService, AsignaturaApi, AsignaturaRequest } from '../nucleo/api/asignaturas-api.service';
import { AsignacionesApiService, AsignacionApi, RegistrarAsignacionRequest } from '../nucleo/api/asignaciones-api.service';
import { concat } from 'rxjs';
import { map, toArray } from 'rxjs/operators';
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

interface ProfessorDeleteTarget {
  nombre: string;
  cedula: string;
}

const ESTADOS = ['Activo', 'Inactivo'];
const ROLES_USUARIO = ['Administrador', 'Profesor regular', 'Profesor Guía', 'Profesor Coordinador de Monografía', 'Profesor CAS', 'Profesor Coordinador de CAS'];
const ROLES_BACKEND: Record<string, string> = { 'Administrador': 'ADMIN', 'Profesor regular': 'PROFESOR_REGULAR', 'Profesor Guía': 'GUIA', 'Profesor Coordinador de Monografía': 'COORD_MONOGRAFIA', 'Profesor CAS': 'PROFESOR_CAS', 'Profesor Coordinador de CAS': 'COORD_CAS' };
const ROLES_FRONTEND: Record<string, string> = Object.fromEntries(Object.entries(ROLES_BACKEND).map(([label, role]) => [role, label]));
const DESCRIPCIONES_ROL: Record<string, string> = {
  'Administrador': 'Configuración institucional y gestión completa del portal.',
  'Profesor regular': 'Registro académico, notas, estudiantes y ausentismo.',
  'Profesor Guía': 'Seguimiento de su sección, reportes y monografías.',
  'Profesor Coordinador de Monografía': 'Coordinación y seguimiento de monografías.',
  'Profesor CAS': 'Registro y actualización de informes CAS.',
  'Profesor Coordinador de CAS': 'Supervisión general y reportes del programa CAS.',
};
const CONFIGURACIONES: Record<FuncionalidadAdministrativa, ConfiguracionCrud> = {
  profesores: { title: 'Profesores', singular: 'profesor', subtitle: 'Administre el personal docente y sus cuentas de acceso (los administradores también son profesores con el rol Administrador).', columns: [{ key: 'nombreCompleto', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'cuenta', label: 'Cuenta' }, { key: 'rolesTexto', label: 'Roles' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'primerApellido', label: 'Primer apellido' }, { key: 'segundoApellido', label: 'Segundo apellido', required: false }, { key: 'cedula', label: 'Cédula' }, { key: 'numeroCelular', label: 'Número celular', required: false }, { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date' }, { key: 'modoCuenta', label: 'Cuenta de acceso', type: 'select' }, { key: 'usuarioId', label: 'Usuario existente', type: 'select' }, { key: 'correo', label: 'Correo', type: 'email' }, { key: 'password', label: 'Contraseña', type: 'password' }, { key: 'roles', label: 'Roles', options: ROLES_USUARIO }, { key: 'estado', label: 'Estado de la cuenta', type: 'select', options: ESTADOS }] },
  estudiantes: { title: 'Estudiantes', singular: 'estudiante', subtitle: 'Consulte y administre los estudiantes registrados.', columns: [{ key: 'nombreCompleto', label: 'Nombre' }, { key: 'cedula', label: 'Cédula' }, { key: 'correo', label: 'Correo' }, { key: 'fechaNacimiento', label: 'Fecha de nacimiento' }], fields: [{ key: 'nombre', label: 'Nombre' }, { key: 'primerApellido', label: 'Primer apellido' }, { key: 'segundoApellido', label: 'Segundo apellido', required: false }, { key: 'cedula', label: 'Cédula' }, { key: 'numeroCelular', label: 'Número celular', required: false }, { key: 'correo', label: 'Correo', type: 'email' }, { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date' }, { key: 'fechaRegistro', label: 'Fecha de registro', readOnly: true, required: false }] },
  periodos: { title: 'Cursos lectivos', singular: 'curso lectivo', subtitle: 'Configure los cursos lectivos y sus semestres.', columns: [{ key: 'yearCiclo', label: 'Año' }, { key: 'estado', label: 'Estado', type: 'badge-periodo' }, { key: 'fechaInicio', label: 'Inicio' }, { key: 'fechaFin', label: 'Fin' }], fields: [{ key: 'yearCiclo', label: 'Año' }, { key: 'estado', label: 'Estado', readOnly: true }, { key: 'fechaInicioI', label: 'Inicio del I semestre', type: 'date' }, { key: 'fechaFinI', label: 'Fin del I semestre', type: 'date' }, { key: 'fechaInicioII', label: 'Inicio del II semestre', type: 'date' }, { key: 'fechaFinII', label: 'Fin del II semestre', type: 'date' }] },
  secciones: { title: 'Secciones', singular: 'sección', subtitle: 'Administre las secciones de cada curso lectivo.', columns: [{ key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'seccion', label: 'Sección' }], fields: [{ key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'nivel', label: 'Nivel' }, { key: 'numeroSeccion', label: 'Número de sección' }] },
  matriculas: { title: 'Matrículas', singular: 'matrícula', subtitle: 'Administre las matrículas de estudiantes en secciones.', columns: [{ key: 'estudiante', label: 'Estudiante' }, { key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'seccion', label: 'Sección' }, { key: 'estado', label: 'Estado', type: 'badge' }], fields: [{ key: 'cedulaEstudiante', label: 'Estudiante' }, { key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'nivel', label: 'Nivel' }, { key: 'numeroSeccion', label: 'Número de sección' }] },
  asignaturas: { title: 'Asignaturas', singular: 'asignatura', subtitle: 'Administre código, tipo, descripción y niveles donde se imparte cada asignatura.', columns: [{ key: 'codigo', label: 'Código' }, { key: 'tipoAsignatura', label: 'Tipo' }, { key: 'escala', label: 'Escala' }, { key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción' }], fields: [{ key: 'codigo', label: 'Código (3 letras)' }, { key: 'tipoAsignatura', label: 'Tipo de asignatura', type: 'select', options: ['MEP', 'Troncal', 'Superior', 'Medio'] }, { key: 'nombre', label: 'Nombre' }, { key: 'descripcion', label: 'Descripción', required: false }, { key: 'imparteNivel11', label: 'Imparte en nivel 11', type: 'select', options: ['Sí', 'No'] }, { key: 'imparteNivel12', label: 'Imparte en nivel 12', type: 'select', options: ['Sí', 'No'] }] },
  asignaciones: { title: 'Asignación profesores', singular: 'asignación de profesor', subtitle: 'Administre las asignaciones de profesores por asignatura y sección.', columns: [{ key: 'profesor', label: 'Profesor' }, { key: 'codigoAsignatura', label: 'Código / asignatura' }, { key: 'yearCiclo', label: 'Año' }, { key: 'seccion', label: 'Sección' }], fields: [{ key: 'profesor', label: 'Profesor' }, { key: 'codigo', label: 'Código / asignatura' }, { key: 'yearCiclo', label: 'Curso lectivo' }, { key: 'seccion', label: 'Sección' }] },
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

       <app-stat-grid [cards]="statCards()" />

       @if (editorOpen()) {
            <div class="modal-backdrop" role="presentation"><form class="surface editor" [class.professor-editor]="key === 'profesores'" [class.student-editor]="key === 'estudiantes'" autocomplete="off" (ngSubmit)="guardar()" novalidate role="dialog" aria-modal="true" aria-labelledby="crud-editor-title">
            <div class="section-heading modal-header"><div><p class="modal-kicker">{{ readOnly ? 'Consulta' : editingId ? 'Edición' : 'Nuevo registro' }}</p><h3 id="crud-editor-title">{{ editorTitle }}</h3>@if (!readOnly) { <p class="required-legend">* Campos obligatorios</p> } @else { <p>Información de solo lectura.</p> }</div><button type="button" class="modal-close" aria-label="Cerrar modal" (click)="cerrarEditor()">×</button></div>
             <div class="editor-grid">
               @if (key === 'profesores') {
                 <div class="professor-wizard" aria-label="Progreso del registro de profesor">
                   <div class="wizard-steps">
                     @for (step of professorSteps; track step.number) {
                       <div class="wizard-step" [class.active]="professorStep() === step.number" [class.complete]="professorStep() > step.number">
                         <span class="wizard-step-number">{{ professorStep() > step.number ? '✓' : step.number }}</span>
                         <span class="wizard-step-copy"><strong>{{ step.label }}</strong><small>{{ step.short }}</small></span>
                       </div>
                       @if (step.number < professorSteps.length) { <span class="wizard-connector" [class.complete]="professorStep() > step.number"></span> }
                     }
                   </div>
                 </div>
               }
               @for (field of camposFormularioVisibles(); track field.key) {
                      <div [class.student-field]="key === 'matriculas' && field.key === 'cedulaEstudiante'" [class.course-field]="(key === 'matriculas' || key === 'secciones' || key === 'asignaciones') && field.key === 'yearCiclo'" [class.registration-field]="key === 'estudiantes' && field.key === 'fechaRegistro'" [class.roles-field]="key === 'profesores' && field.key === 'roles'" [class.account-field]="key === 'profesores' && field.key === 'modoCuenta'" [class.professor-email-field]="key === 'profesores' && field.key === 'correo'" [class.professor-password-field]="key === 'profesores' && field.key === 'password'" [class.professor-personal-field]="key === 'profesores' && ['cedula', 'numeroCelular', 'fechaNacimiento'].includes(field.key)" [class.required-field]="campoRequerido(field)"><span>{{ field.label }}@if (campoRequerido(field)) { <span class="required-mark" aria-hidden="true">*</span> }</span>
                     @if ((key === 'profesores' || key === 'estudiantes') && field.key === 'cedula') {
                       <div class="identification-input">
                         <input type="text" [name]="field.key" [ngModel]="draft[field.key]" (ngModelChange)="cambiarIdentificacion($event)" [attr.aria-label]="field.label" inputmode="text" maxlength="20" [readonly]="campoSoloLectura(field)" [required]="field.required ?? true" placeholder="1-1234-5678" />
                         @if (!readOnly && !campoSoloLectura(field)) { <label class="foreign-identification"><input type="checkbox" name="identificacionExtranjera" [checked]="identificacionExtranjera" (change)="cambiarTipoIdentificacion($any($event.target).checked)" /> Identificación extranjera</label> }
                       </div>
                     } @else if (key === 'profesores' && field.key === 'modoCuenta') {
                       @if (draft['modoCuenta'] === 'actual') {
                         <div class="selected-student"><strong>{{ draft['emailOriginal'] }}</strong><span>Tiene cuenta de acceso.</span><small>Abajo puede cambiar el correo, poner una contraseña nueva, editar los roles o desactivarla. Al eliminar el profesor se elimina también su cuenta.</small></div>
                       } @else if (!editingId) {
                           <div class="selected-student credentials-note"><strong>Credenciales de acceso:</strong> El profesor ingresará con ese correo y contraseña.</div>
                       } @else {
                         <select [name]="field.key" [(ngModel)]="draft[field.key]" [attr.aria-label]="field.label" [disabled]="readOnly"><option value="ninguna">Mantener sin cuenta</option><option value="nueva">Crear su cuenta</option></select><small class="catalog-count">Este profesor se registró antes de que la cuenta fuera obligatoria.</small>
                       }
                    } @else if (key === 'asignaciones' && field.key === 'profesor') {
                        <select [name]="field.key" [(ngModel)]="draft[field.key]" [attr.aria-label]="field.label" [disabled]="readOnly || campoSoloLectura(field)" [required]="field.required ?? true"><option value="">Seleccione un profesor</option>@for (teacher of profesoresDisponiblesAsignacion(); track teacher.id) { <option [value]="teacher.nombre">{{ teacher.cedula }} · {{ teacher.nombre }}</option> }</select>
                    } @else if (key === 'asignaciones' && field.key === 'codigo') {
                        <select [name]="field.key" [(ngModel)]="draft[field.key]" [attr.aria-label]="field.label" [disabled]="readOnly || campoSoloLectura(field)" [required]="field.required ?? true"><option value="">Seleccione una asignatura</option>@for (subject of asignaturasDisponiblesAsignacion(); track subject.codigo) { <option [value]="subject.codigo">{{ subject.codigo }} · {{ subject.nombre }}</option> }</select>
                     } @else if (key === 'asignaciones' && field.key === 'seccion') {
                        <select [name]="field.key" [(ngModel)]="draft[field.key]" [attr.aria-label]="field.label" [disabled]="readOnly || campoSoloLectura(field)" [required]="field.required ?? true"><option value="">Seleccione una sección</option>@for (section of seccionesAsignacion(); track section) { <option [value]="section">{{ section }}</option> }</select>
                     } @else if (key === 'asignaciones' && field.key === 'yearCiclo') {
                        <select [name]="field.key" [(ngModel)]="draft[field.key]" (ngModelChange)="cambioCursoLectivo($event)" [attr.aria-label]="field.label" [disabled]="readOnly || !!editingId" [required]="field.required ?? true"><option value="">Seleccione un curso lectivo</option>@for (course of cursosDisponiblesMatricula(); track course.idCursoLectivo) { <option [value]="course.yearCiclo">{{ cursoLectivoLabel(course) }}</option> }</select>
                     } @else if (key === 'matriculas' && field.key === 'cedulaEstudiante') {
                       @if (editingId) {
                         <div class="selected-student"><strong>{{ estudianteSeleccionadoMatricula() }}</strong><span>{{ draft[field.key] }}</span><small>El estudiante no se puede cambiar al editar una matrícula.</small></div>
                       } @else {
                          <div class="student-picker"><div class="student-search"><span class="search-label">Buscar estudiante</span><input type="search" name="buscarEstudiante" [(ngModel)]="studentSearch" (ngModelChange)="buscarEstudiantesMatricula($event)" placeholder="Nombre completo o número de cédula" autocomplete="off" [readonly]="readOnly" /><small>{{ estudiantesDisponiblesMatricula().length }} estudiantes disponibles</small></div><div class="student-results" role="listbox" aria-label="Resultados de estudiantes">@for (student of estudiantesResultadosMatricula(); track student.cedula) { <button type="button" class="student-result" [class.selected]="draft[field.key] === student.cedula" (click)="seleccionarEstudianteMatricula(student)"><span class="student-avatar">{{ inicialesEstudiante(student) }}</span><span class="student-result-copy"><strong>{{ nombreCompletoEstudiante(student) }}</strong><small>{{ student.cedula }}{{ student.email ? ' · ' + student.email : '' }}{{ edadEstudiante(student) ? ' · Edad actual: ' + edadEstudiante(student) + ' años' : '' }}</small></span><span class="student-check" aria-hidden="true">{{ draft[field.key] === student.cedula ? 'Seleccionado' : 'Elegir' }}</span></button>} @empty { <p class="student-empty">No encontramos estudiantes con esa búsqueda.</p> }</div>@if (draft[field.key]) { <p class="student-selection">Estudiante seleccionado: <strong>{{ estudianteSeleccionadoMatricula() }}</strong><small>{{ estudianteSeleccionadoCorreo() }}{{ estudianteSeleccionadoEdad() ? ' · Edad actual: ' + estudianteSeleccionadoEdad() + ' años' : '' }}</small></p> }</div>
        }

                   } @else if (key === 'matriculas' && field.key === 'yearCiclo') {
                      <select [name]="field.key" [(ngModel)]="draft[field.key]" (ngModelChange)="cambioCursoLectivo($event)" [attr.aria-label]="field.label" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione un curso lectivo</option>@for (course of cursosDisponiblesMatricula(); track course.idCursoLectivo) { <option [value]="course.yearCiclo">{{ cursoLectivoLabel(course) }}</option> }</select>
                   } @else if (key === 'matriculas' && field.key === 'nivel') {
                      <select [name]="field.key" [(ngModel)]="draft[field.key]" (ngModelChange)="draft['numeroSeccion'] = ''" [attr.aria-label]="field.label" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione un nivel</option><option value="11">Undécimo</option><option value="12">Duodécimo</option></select>
                  } @else if (key === 'secciones' && field.key === 'yearCiclo') {
                     <select [name]="field.key" [(ngModel)]="draft[field.key]" [attr.aria-label]="field.label" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione un curso lectivo</option>@for (course of cursosDisponiblesMatricula(); track course.idCursoLectivo) { <option [value]="course.yearCiclo">{{ cursoLectivoLabel(course) }}</option> }</select>
                  } @else if (key === 'secciones' && field.key === 'nivel') {
                     <select [name]="field.key" [(ngModel)]="draft[field.key]" [attr.aria-label]="field.label" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione un nivel</option><option value="11">Undécimo</option><option value="12">Duodécimo</option></select>
                     } @else if (key === 'matriculas' && field.key === 'numeroSeccion') {
                        <select [name]="field.key" [(ngModel)]="draft[field.key]" [attr.aria-label]="field.label" [disabled]="readOnly" [required]="field.required ?? true"><option value="">Seleccione una sección</option>@for (section of seccionesDisponiblesMatricula(); track section.idSeccion) { <option [value]="numeroSeccion(section.seccion)">{{ section.seccion }}</option> }</select>
                     } @else if (key === 'secciones' && field.key === 'numeroSeccion') {
                        <input type="number" [name]="field.key" [(ngModel)]="draft[field.key]" [attr.aria-label]="field.label" min="1" max="99" step="1" inputmode="numeric" [readonly]="readOnly" [required]="field.required ?? true" />
                     } @else if (key === 'profesores' && field.key === 'roles') {
                       <span class="roles-grid">@for (option of rolesDisponibles(); track option) { <label class="role-card" [class.selected]="rolesSeleccionados().includes(option)" [class.role-admin]="option === 'Administrador'" [class.role-guide]="option === 'Profesor Guía'" [class.role-cas]="option.includes('CAS')" [class.role-monograph]="option.includes('Monografía')"><input type="checkbox" [attr.aria-label]="option" [checked]="rolesSeleccionados().includes(option)" [disabled]="readOnly" (change)="cambiarRol(option, $any($event.target).checked)" /><span class="role-card-mark">{{ rolesSeleccionados().includes(option) ? '✓' : '' }}</span><span class="role-card-copy"><strong>{{ option }}</strong><small>{{ descripcionRol(option) }}</small></span></label> }</span>
                      } @else if ((key === 'profesores' || key === 'estudiantes') && field.key === 'numeroCelular') {
                        <input type="tel" [name]="field.key" [ngModel]="formatearTelefono(draft[field.key])" (ngModelChange)="cambiarNumeroCelular($event)" [attr.aria-label]="field.label" inputmode="numeric" maxlength="9" autocomplete="tel" placeholder="0000-0000" [readonly]="campoSoloLectura(field)" [required]="campoRequerido(field)" />
                      } @else if (key === 'asignaturas' && field.key === 'codigo') {
                       <input type="text" [name]="field.key" [(ngModel)]="draft[field.key]" (ngModelChange)="normalizarCodigoAsignatura($event)" [attr.aria-label]="field.label" maxlength="3" minlength="3" pattern="[A-Z]{3}" placeholder="Ej. MAT" [readonly]="campoSoloLectura(field)" [required]="field.required ?? true" />
                    } @else if (key === 'asignaturas' && (field.key === 'imparteNivel11' || field.key === 'imparteNivel12')) {
                       <select [name]="field.key" [(ngModel)]="draft[field.key]" [attr.aria-label]="field.label" [disabled]="campoSoloLectura(field)" [required]="field.required ?? true"><option value="true">Sí</option><option value="false">No</option></select>
                    } @else if (field.type === 'select') {
                      <select [name]="field.key" [(ngModel)]="draft[field.key]" [attr.aria-label]="field.label" [disabled]="campoSoloLectura(field)" [required]="field.required ?? true">@for (option of field.options ?? []; track option) { <option [value]="option">{{ option }}</option> }</select>
                      } @else {
                        @if (field.type === 'password') { <span class="password-input"><input [type]="showPassword() ? 'text' : 'password'" autocomplete="new-password" [name]="field.key" [(ngModel)]="draft[field.key]" [attr.aria-label]="field.label" [readonly]="campoSoloLectura(field)" [required]="campoRequerido(field)" /><span class="password-visibility"><input type="checkbox" [attr.aria-label]="'Mostrar ' + field.label.toLowerCase()" [checked]="showPassword()" (change)="showPassword.set($any($event.target).checked)" /> Mostrar contraseña</span></span> } @else { <input [type]="field.type ?? 'text'" autocomplete="off" [name]="field.key" [(ngModel)]="draft[field.key]" [attr.aria-label]="field.label" [min]="fechaMinima(field.key)" [max]="fechaMaxima(field.key)" [readonly]="campoSoloLectura(field)" [required]="campoRequerido(field)" /> }
                 }
                 @if (fieldError(field.key)) { <small class="field-error" role="alert">{{ fieldError(field.key) }}</small> }
                 </div>
              }
              @if (key === 'profesores' && professorStep() === 3 && !camposFormularioVisibles().length) {
                <div class="role-empty-state"><span class="role-empty-icon">i</span><div><strong>Sin cuenta de acceso</strong><p>Este profesor no tiene una cuenta. Puedes crearla en la fase anterior para asignarle responsabilidades y permitirle iniciar sesión.</p></div></div>
              }
            </div>
              @if (apiError && !readOnly && key !== 'profesores') { <p class="api-error" role="alert">{{ apiError }}</p> }
             @if (key === 'profesores') {
               <div class="form-actions wizard-actions"><button type="button" class="ghost-button" (click)="cerrarEditor()">{{ readOnly ? 'Cerrar' : 'Cancelar' }}</button><span class="wizard-actions-spacer"></span>@if (professorStep() > 1) { <button type="button" class="ghost-button" (click)="retrocederProfesor()">← Atrás</button> } @if (professorStep() < professorSteps.length) { <button type="button" class="primary-button" (click)="avanzarProfesor()">Continuar <span aria-hidden="true">→</span></button> } @else if (!readOnly) { <button type="submit" class="primary-button">Guardar cambios</button> }</div>
             } @else if (!readOnly) { <div class="form-actions"><button type="button" class="ghost-button" (click)="cerrarEditor()">Cancelar</button><button type="submit" class="primary-button">Guardar</button></div> }
           </form></div>
        }

        @if (promotionTarget(); as target) {
          <div class="modal-backdrop" role="presentation" (click)="cancelarPromocion()">
            <section class="promotion-modal" role="dialog" aria-modal="true" aria-labelledby="promotion-title" (click)="$event.stopPropagation()">
              <div class="promotion-icon" aria-hidden="true">↑</div>
              <div class="promotion-copy"><p class="modal-kicker">Cambio académico</p><h3 id="promotion-title">Confirmar subida de nivel</h3><p>Esta acción trasladará la matrícula de <strong>{{ target.estudiante }}</strong> a duodécimo (nivel 12), junto con el guía y los profesores de la sección.</p></div>
              <dl class="promotion-summary"><div><dt>Identificación</dt><dd>{{ target.cedula }}</dd></div><div><dt>Sección actual</dt><dd>{{ target.cursoActual }} · {{ target.seccion }}</dd></div><div><dt>Nuevo curso</dt><dd>{{ target.cursoDestino }} · Sección {{ target.numeroSeccion }}</dd></div></dl>
              <p class="promotion-warning">La operación actualizará la sección académica de esta matrícula.</p>
              <div class="modal-actions"><button type="button" class="ghost-button" (click)="cancelarPromocion()">Cancelar</button><button type="button" class="primary-button" (click)="confirmarPromocion()">Subir a duodécimo</button></div>
            </section>
          </div>
        }

        @if (professorDeleteTarget(); as target) {
          <div class="modal-backdrop" role="presentation" (click)="cancelarEliminacionProfesor()">
            <section class="promotion-modal delete-profile-modal" role="dialog" aria-modal="true" aria-labelledby="delete-profile-title" (click)="$event.stopPropagation()">
              <div class="promotion-icon" aria-hidden="true">!</div>
              <div class="promotion-copy"><p class="modal-kicker">Confirmación</p><h3 id="delete-profile-title">Eliminar profesor</h3><p>¿Desea eliminar a <strong>{{ target.nombre }}</strong>? Se eliminan su perfil y su cuenta de acceso.</p></div>
              <p class="promotion-warning">Esta acción no se puede deshacer.</p>
              <div class="modal-actions"><button type="button" class="ghost-button" (click)="cancelarEliminacionProfesor()">Cancelar</button><button type="button" class="danger-button" (click)="confirmarEliminacionProfesor()">Eliminar profesor</button></div>
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
       .editor { width:min(100%,760px);max-height:calc(100vh - 2rem);overflow:auto;padding:0;border:1px solid #dbe5ef;border-left:5px solid #2f6b9a;border-radius:14px;box-shadow:0 24px 70px rgba(18,32,49,.26); }.editor.professor-editor::before{display:none;content:none}
       .editor .modal-header{align-items:flex-start;margin:0;padding:1.5rem 1.75rem .95rem;border-bottom:1px solid #edf1f4}.editor .modal-header h3{margin:0;color:#29344a;font-size:1.2rem}.editor .modal-header p:last-child{margin:.3rem 0 0;color:#667085;font-size:.8rem}.editor .modal-header .required-legend{margin:.3rem 0 0;color:#b42318;font-size:.78rem;font-weight:700}.editor .modal-close{flex:0 0 auto;width:36px;height:36px;padding:0;border:1px solid #d7e0e8;border-radius:8px;color:#475467;background:#f8fafc;font-size:1.45rem;line-height:1;cursor:pointer}.editor .modal-close:hover{border-color:#9bb6c9;background:#eef5f8;color:#1e5578}
      .user-editor { width:min(100%,700px); border-left-color:#1e7a68; }
      .modal-kicker { margin:0 0 .2rem; color:#1e7a68; font-size:.72rem; font-weight:800; letter-spacing:.11em; text-transform:uppercase; }
          .editor-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; padding:1.35rem 1.75rem 0; }.editor .required-field::before{content:none!important}.editor .required-field>span:first-child::after{content:none!important}.professor-editor .editor-grid,.student-editor .editor-grid{align-items:start}.professor-editor .editor-grid div:has(> input[required])::before,.professor-editor .editor-grid div:has(> select[required])::before,.professor-editor .editor-grid div:has(> textarea[required])::before,.student-editor .editor-grid div:has(> input[required])::before,.student-editor .editor-grid div:has(> select[required])::before,.student-editor .editor-grid div:has(> textarea[required])::before{content:none!important}.professor-wizard{grid-column:1 / -1}.professor-personal-field{align-self:start;align-content:start}.foreign-identification{display:inline-flex!important;align-items:center;justify-content:center;width:100%;gap:.4rem;transform:translateX(-.35rem)}.foreign-identification input[type="checkbox"]{width:auto;min-height:0}.student-editor .identification-input{width:100%}.student-editor .editor-grid>div{min-width:0;align-self:start}.professor-email-field{grid-column:1;align-content:start;min-width:0;grid-template-columns:minmax(0,1fr)}.professor-password-field{grid-column:2;align-content:start;min-width:0;grid-template-columns:minmax(0,1fr)}.professor-email-field>span:first-child,.professor-password-field>span:first-child{height:36px;min-height:36px;display:flex;align-items:flex-start;white-space:nowrap}.professor-email-field>input,.professor-password-field .password-input,.professor-password-field .password-input>input{width:100%;max-width:100%;min-width:0;box-sizing:border-box}.professor-password-field .password-input{grid-template-columns:minmax(0,1fr);justify-self:stretch;overflow:hidden}.selected-student.credentials-note{display:block;line-height:1.35}.credentials-note strong{color:#1e3a5f}
        .professor-wizard{grid-column:1 / -1;display:grid;gap:1rem;margin:-.2rem 0 .15rem}.wizard-steps{display:flex;align-items:center;gap:.55rem}.wizard-step{display:flex;align-items:center;gap:.45rem;min-width:0;color:#98a2b3}.wizard-step-number{display:grid;place-items:center;width:1.8rem;height:1.8rem;border:2px solid #dbe5ef;border-radius:50%;background:#fff;color:#98a2b3;font-size:.72rem;font-weight:800;flex:0 0 auto}.wizard-step-copy{display:grid;gap:.08rem;white-space:nowrap}.wizard-step-copy strong{font-size:.75rem;color:#667085}.wizard-step-copy small{font-size:.64rem;color:#98a2b3}.wizard-step.active .wizard-step-number{border-color:#2f6b9a;background:#2f6b9a;color:#fff;box-shadow:0 0 0 4px #eaf3f8}.wizard-step.active .wizard-step-copy strong{color:#1e5578}.wizard-step.complete .wizard-step-number{border-color:#1e7a68;background:#1e7a68;color:#fff}.wizard-step.complete .wizard-step-copy strong{color:#1e7a68}.wizard-connector{height:2px;min-width:1.5rem;flex:1;background:#dbe5ef}.wizard-connector.complete{background:#8bc9b9}.wizard-actions-spacer{flex:1}
       .student-field { grid-column: 1 / -1; }.course-field, .registration-field { grid-column: span 2; }.student-field select, .course-field select, .registration-field input { width: 100%; min-width: 0; }.student-field .student-picker{width:100%}.registration-field input { min-width: 240px; }
       .user-editor .editor-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap:1rem; margin-top:0; }.user-editor .editor-grid>label{align-content:start}.user-editor .editor-grid>label>input:not([type="checkbox"]),.user-editor .editor-grid>label>select,.user-editor .password-input>input{height:50px;min-height:50px;align-self:start}
       .user-editor .roles-field, .roles-field, .account-field { grid-column:1 / -1; }.catalog-count{color:#667085;font-size:.72rem;font-weight:500}
       .user-editor .roles-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:.7rem .9rem; padding:.95rem 1rem; border:1px solid #c9dbe5; border-radius:10px; background:#f5fafc; }
       .group-filter { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1rem; padding:.7rem; background:#f2f7fa; border-radius:7px; }.group-filter label { display:flex; align-items:center; gap:.7rem; }.group-filter span { color:#667085; font-size:.82rem; }
        .table-tools{display:flex;align-items:end;justify-content:space-between;gap:.8rem;margin:0 0 1rem;padding:.75rem;background:#f8fafc;border:1px solid #e6edf3;border-radius:8px}.table-search{display:grid;gap:.25rem;flex:1;max-width:520px}.table-search span{color:#475467;font-size:.72rem;font-weight:800}.table-search input{width:100%;box-sizing:border-box}.table-search-actions{display:flex;gap:.5rem}.table-search-actions button{white-space:nowrap}
        .pagination-bar{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem .2rem 0;color:#667085;font-size:.76rem}.pagination-actions{display:flex;align-items:center;gap:.7rem}.pagination-actions button{padding:.35rem .65rem;font-size:.72rem}.pagination-actions button:disabled{opacity:.45;cursor:not-allowed}
        label, .editor-grid > div { display: grid; gap: .25rem; font-weight: 700; }.student-picker{display:grid;gap:.55rem;padding:.7rem;border:1px solid #cfdbe5;border-radius:9px;background:#f8fbfd}.student-search{display:grid;gap:.3rem}.search-label{color:#1e3a5f;font-size:.76rem;font-weight:800}.student-search input{width:100%;box-sizing:border-box}.student-search small{color:#667085;font-size:.72rem;font-weight:500}.student-results{display:grid;gap:.35rem;max-height:220px;overflow:auto;padding-right:.15rem}.student-result{display:grid;grid-template-columns:2rem minmax(0,1fr) auto;align-items:center;gap:.55rem;width:100%;padding:.55rem;border:1px solid #dbe5ef;border-radius:7px;background:#fff;color:#25364a;text-align:left;cursor:pointer}.student-result:hover,.student-result.selected{border-color:#2f6b9a;background:#eaf3f8}.student-avatar{display:grid;place-items:center;width:2rem;height:2rem;border-radius:50%;background:#d9eaf3;color:#1e5a78;font-size:.68rem;font-weight:800}.student-result-copy{display:grid;min-width:0;gap:.12rem}.student-result-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.78rem}.student-result-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#667085;font-size:.7rem}.student-check{color:#2f6b9a;font-size:.65rem;font-weight:800}.student-empty{margin:0;padding:.8rem;color:#667085;font-size:.78rem;text-align:center}.selected-student{display:grid;gap:.2rem;padding:.75rem;border:1px solid #b9d3e5;border-radius:9px;background:#f0f8fc}.selected-student strong{color:#1e3a5f}.selected-student span,.selected-student small{color:#667085;font-size:.75rem}.student-selection{margin:0;color:#1e5a78;font-size:.75rem}
      .form-actions { display: flex; justify-content: flex-end; gap: .75rem; margin:1.4rem 0 0; padding:1rem 1.75rem 1.35rem; border-top:1px solid #edf1f4; background:#fbfcfd; }
     .field-error { display: block; color: #b42318; font-size: .72rem; line-height: 1.2; font-weight: 600; }
         .password-input { display: grid; gap: .4rem; }.password-visibility { display: flex; align-items: center; gap: .4rem; color: #475467; font-size: .8rem; font-weight: 600; }.password-visibility input { width: auto; min-height: 0; padding: 0; }.roles-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;padding:.2rem 0 0}.role-card{position:relative;display:grid;grid-template-columns:1.75rem minmax(0,1fr);align-items:center;gap:.65rem;min-height:4.4rem;padding:.75rem .8rem;border:1px solid #dbe5ef;border-left:4px solid #b9c9d6;border-radius:11px;background:#fff;color:#25364a;cursor:pointer;transition:border-color .15s ease,background .15s ease,box-shadow .15s ease,transform .15s ease}.role-card:hover{border-color:#8fb5cc;background:#f8fcff;transform:translateY(-1px)}.role-card input{position:absolute;width:1px;height:1px;opacity:0}.role-card-mark{display:grid;place-items:center;width:1.55rem;height:1.55rem;border:1.5px solid #b9c9d6;border-radius:50%;color:transparent;font-size:.78rem;font-weight:900}.role-card-copy{display:grid;gap:.18rem}.role-card-copy strong{font-size:.76rem;color:#1e3a5f}.role-card-copy small{color:#667085;font-size:.66rem;font-weight:500;line-height:1.35}.role-card.selected{border-color:#67a9c7;background:#f0f8fc;box-shadow:0 5px 16px rgba(47,107,154,.1)}.role-card.selected .role-card-mark{border-color:#2f6b9a;background:#2f6b9a;color:#fff}.role-card.role-cas{border-left-color:#1e7a68}.role-card.role-cas.selected{border-color:#78b9ab;background:#f0faf6}.role-card.role-cas.selected .role-card-mark{border-color:#1e7a68;background:#1e7a68}.role-card.role-guide{border-left-color:#c58b31}.role-card.role-guide.selected{border-color:#dfb66c;background:#fffaf0}.role-card.role-guide.selected .role-card-mark{border-color:#b87918;background:#b87918}.role-card.role-monograph{border-left-color:#8064a2}.role-card.role-monograph.selected{border-color:#b39acb;background:#faf7fd}.role-card.role-monograph.selected .role-card-mark{border-color:#8064a2;background:#8064a2}.role-card.role-admin{border-left-color:#c95b68}.role-card.role-admin.selected{border-color:#dd929b;background:#fff7f8}.role-card.role-admin.selected .role-card-mark{border-color:#b94352;background:#b94352}.role-empty-state{grid-column:1 / -1;display:flex;align-items:flex-start;gap:.75rem;padding:1rem;border:1px dashed #b9d3e5;border-radius:11px;background:#f7fbfd;color:#475467}.role-empty-icon{display:grid;place-items:center;width:1.7rem;height:1.7rem;border-radius:50%;background:#dceef7;color:#1e5a78;font-weight:900}.role-empty-state strong{color:#1e3a5f;font-size:.8rem}.role-empty-state p{margin:.2rem 0 0;font-size:.72rem;line-height:1.45}
        @media (max-width: 900px) { .editor-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .student-field, .course-field, .registration-field { grid-column: 1 / -1; } }
         @media (max-width: 700px) { .editor-grid { grid-template-columns: 1fr; } .student-field, .course-field, .registration-field, .professor-email-field, .professor-password-field { grid-column: span 1; } }
       .promotion-modal{width:min(100%,500px);padding:1.7rem;border:1px solid #cfe0e6;border-top:5px solid #1b6f60;border-radius:16px;background:#fff;box-shadow:0 24px 70px rgba(18,32,49,.28)}.promotion-icon{display:grid;place-items:center;width:3rem;height:3rem;margin-bottom:1rem;border-radius:12px;color:#13775f;background:#e7f5ef;font-size:1.7rem;font-weight:800}.promotion-copy h3{margin:0;color:#29344a;font-size:1.25rem}.promotion-copy p:last-child{margin:.45rem 0 0;color:#667085;line-height:1.5}.promotion-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin:1.35rem 0 1rem}.promotion-summary div{padding:.75rem;border:1px solid #e1ebef;border-radius:9px;background:#f8fbfc}.promotion-summary dt{color:#667085;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.promotion-summary dd{margin:.25rem 0 0;color:#1e3a5f;font-size:.82rem;font-weight:700;overflow-wrap:anywhere}.promotion-warning{margin:0;padding:.75rem .85rem;border-left:3px solid #f0a33a;border-radius:6px;color:#7a4b08;background:#fff8eb;font-size:.78rem}.modal-actions{display:flex;justify-content:flex-end;gap:.65rem;margin-top:1.35rem}@keyframes modal-fade-in{from{opacity:0}to{opacity:1}}
         @media (max-width: 700px) { .modal-backdrop{align-items:start}.user-editor .editor-grid,.editor-grid { grid-template-columns:1fr; } .student-field, .course-field, .registration-field { grid-column: span 1; } .user-editor .roles-field { grid-column:auto; } .user-editor .roles-grid,.roles-grid { grid-template-columns:1fr; } .editor .modal-header,.editor-grid,.form-actions{padding-left:1rem;padding-right:1rem}.wizard-steps{gap:.25rem}.wizard-step-copy{display:none}.wizard-step{flex:0 0 auto}.wizard-connector{min-width:.5rem}.promotion-summary{grid-template-columns:1fr} }
  `,
})
// Administra los formularios y tablas de las funcionalidades seleccionadas.
export class FuncionalidadVistaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AutenticacionService);
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
     protected readonly professorDeleteTarget = signal<ProfessorDeleteTarget | null>(null);
     protected readonly columns = computed(() => [...this.teacherColumns(), { key: 'acciones', label: 'Acciones', type: 'actions' as const }]);
     protected readonly rows = computed<Array<Record<string, unknown>>>(() => {
       if (this.isTeacher()) return this.teacherRows();
       if (this.key === 'profesores') return this.profesoresApiRows();
       if (this.key === 'estudiantes') return this.estudiantesApiRows();
       if (this.key === 'matriculas') return this.matriculasApiRows();
       if (this.key === 'periodos') return this.cursosApiRows();
        if (this.key === 'secciones') return this.seccionesApiRows();
        if (this.key === 'asignaturas') return this.asignaturasApiRows();
        if (this.key === 'asignaciones') return this.asignacionesRows();
           return [];
    });
    protected readonly statCards = computed(() => [
      { label: 'Registros', value: this.cantidadRegistros(), tone: 'primary' as const },
      ...(this.key === 'profesores' ? [{ label: 'Usuarios sin perfil', value: String(this.usuariosSinPerfil()), tone: 'success' as const }] : []),
    ]);
   protected readonly editorOpen = signal(false);
  protected readOnly = false;
   protected editorTitle = '';
   protected editingId: string | undefined;
    protected draft: Record<string, string> = {};
    protected identificacionExtranjera = false;
    protected validationAttempted = false;
    protected readonly showPassword = signal(false);
    protected readonly professorStep = signal(1);
    protected readonly professorSteps = [
      { number: 1, label: 'Perfil', short: 'Datos personales' },
      { number: 2, label: 'Cuenta', short: 'Acceso al portal' },
      { number: 3, label: 'Roles', short: 'Responsabilidades' },
    ];
    protected studentSearch = '';
   protected readonly selectedGroupId = signal(this.grupos.grupoActual()?.id ?? '');
  protected readonly String = String;
   protected readonly isTeacher = computed(() => !this.auth.hasRole('Administrador'));
  protected readonly pageTitle = computed(() => this.isTeacher() && this.key === 'asignaturas' ? 'Mis asignaturas' : this.isTeacher() && this.key === 'secciones' ? 'Mis secciones' : this.config.title);
    protected readonly pageSubtitle = computed(() => this.isTeacher() && this.key === 'asignaturas' ? 'Consulta las asignaturas que tienes asignadas en el periodo actual.' : this.isTeacher() && this.key === 'secciones' ? 'Consulta las secciones donde impartes alguna asignatura.' : this.isTeacher() && this.key === 'estudiantes' ? 'Consulta los estudiantes de tus grupos.' : this.config.subtitle);

    protected busquedaDisponible(): boolean { return this.isAdmin() && ['profesores', 'estudiantes', 'matriculas'].includes(this.key); }
    protected etiquetaBusqueda(): string { return this.key === 'matriculas' ? 'Buscar matrícula' : `Buscar ${this.config.title.toLowerCase()}`; }
     protected placeholderBusqueda(): string { return this.key === 'matriculas' ? 'Nombre o cédula del estudiante' : 'Correo, nombre o cédula'; }

      protected cantidadRegistros(): string { return this.paginacionAdministrativa() ? String(this.totalRegistros()) : String(this.rows().length); }
      protected usuariosSinPerfil(): number { return this.usuariosApiRows().filter((user) => user['activo'] === true && !user['cedulaProfesor']).length; }
     protected paginacionAdministrativa(): boolean { return this.isAdmin() && ['profesores', 'estudiantes', 'periodos', 'secciones', 'matriculas', 'asignaturas', 'asignaciones'].includes(this.key); }
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
      if (this.key === 'profesores') this.cargarProfesores(this.adminSearch);
      if (this.key === 'estudiantes') this.cargarEstudiantes(this.adminSearch);
      if (this.key === 'matriculas') this.cargarMatriculas(this.adminSearch);
    }

     protected limpiarBusqueda(): void { this.adminSearch = ''; this.buscarRegistros(); }

     private cargarPaginaActual(): void {
       const pagina = this.paginaActual();
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
      if (this.key === 'profesores') {
        const modo = this.draft['modoCuenta'];
        const visibles = modo === 'nueva' ? ['correo', 'password', 'roles'] : modo === 'actual' ? ['correo', 'password', 'roles', 'estado'] : [];
        return this.config.fields.filter((field) => !['usuarioId', 'correo', 'password', 'roles', 'estado'].includes(field.key) || visibles.includes(field.key))
          .map((field) => modo === 'actual' && field.key === 'password' ? { ...field, label: 'Nueva contraseña (opcional)', required: false } : field);
      }
       return this.config.fields;
    }

    protected camposFormularioVisibles(): CampoFormulario[] {
      if (this.key !== 'profesores') return this.camposFormulario();
      const fields = this.camposFormulario();
      if (this.professorStep() === 1) return fields.filter((field) => ['nombre', 'primerApellido', 'segundoApellido', 'cedula', 'numeroCelular', 'fechaNacimiento'].includes(field.key));
      if (this.professorStep() === 2) return fields.filter((field) => ['modoCuenta', 'usuarioId', 'correo', 'password', 'estado'].includes(field.key));
      return fields.filter((field) => field.key === 'roles');
    }

    protected descripcionRol(role: string): string { return DESCRIPCIONES_ROL[role] ?? 'Responsabilidad institucional del portal.'; }

    protected avanzarProfesor(): void {
      const error = this.validarPasoProfesor(this.professorStep());
      this.validationAttempted = true;
      if (error) { this.apiError = error; return; }
      this.validationAttempted = false;
      this.apiError = '';
      this.professorStep.update((step) => Math.min(this.professorSteps.length, step + 1));
    }

    protected retrocederProfesor(): void {
      this.validationAttempted = false;
      this.apiError = '';
      this.professorStep.update((step) => Math.max(1, step - 1));
    }

   protected rolesDisponibles(): string[] {
     const roles = this.config.fields.find((field) => field.key === 'roles')?.options ?? [];
     return roles;
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
       if (this.isAdmin() && this.key === 'asignaturas') this.cargarAsignaturas();
        if (this.isAdmin() && this.key === 'asignaciones') { this.cargarAsignaciones(); this.cargarProfesores('', 1, false); this.cargarAsignaturas(1, false); this.cargarSeccionesAdministracion(1, false); this.cargarCursosLectivos(); }
    }

  protected abrirNuevo(): void {
    this.editingId = undefined;
    this.readOnly = false;
    this.validationAttempted = false;
     this.apiError = '';
      this.showPassword.set(false);
      this.professorStep.set(1);
      this.studentSearch = '';
      this.identificacionExtranjera = false;
     this.editorTitle = `Registrar ${this.config.singular}`;
     this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, field.options?.[0] ?? '']));
      if (this.key === 'profesores') { this.draft['modoCuenta'] = 'nueva'; this.draft['roles'] = 'Profesor regular'; }
      if (this.key === 'asignaturas') { this.draft['imparteNivel11'] = 'true'; this.draft['imparteNivel12'] = 'true'; }
      if (this.key === 'asignaciones') { this.draft['profesor'] = this.profesoresDisponiblesAsignacion()[0]?.nombre ?? ''; this.draft['codigo'] = this.asignaturasDisponiblesAsignacion()[0]?.codigo ?? ''; this.draft['yearCiclo'] = String(new Date().getFullYear()); this.draft['seccion'] = this.seccionesAsignacion()[0] ?? ''; }
      if (this.key === 'matriculas') { this.draft['yearCiclo'] = String(new Date().getFullYear()); this.draft['nivel'] = '11'; }
    if (this.key === 'secciones') this.draft['yearCiclo'] = String(new Date().getFullYear());
      this.editorOpen.set(true);
  }

  protected async accion(event: { action: string; row: Record<string, unknown> }): Promise<void> {
    const registro = event.row as RegistroVista;
    if (this.isAdmin() && this.key === 'profesores') { this.accionProfesor(event.action, registro); return; }
    if (this.isAdmin() && this.key === 'estudiantes') { this.accionEstudiante(event.action, registro); return; }
     if (this.isAdmin() && this.key === 'matriculas') { this.accionMatricula(event.action, registro); return; }
     if (this.isAdmin() && this.key === 'asignaturas') { this.accionAsignatura(event.action, registro); return; }
     if (this.isAdmin() && this.key === 'asignaciones') { this.accionAsignacion(event.action, registro); return; }
    if (this.isAdmin() && this.key === 'periodos') { this.accionCursoLectivo(event.action, registro); return; }
    if (this.isAdmin() && this.key === 'secciones') { this.accionSeccion(event.action, registro); return; }
       if (event.action === 'delete' && this.isAdmin()) {
         if (await this.feedback.confirmar(`¿Eliminar ${registro['nombre'] ?? this.config.singular}?`, 'Eliminar registro', 'Eliminar')) this.feedback.error('Esta operación no está disponible para este catálogo.');
      return;
    }
    this.editingId = registro.id;
    this.readOnly = event.action === 'view' || !this.isAdmin();
    this.editorTitle = this.readOnly ? `Detalle de ${this.config.singular}` : `Editar ${this.config.singular}`;
    this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, registro[field.key] ?? '']));
     this.editorOpen.set(true);
  }

  protected guardar(): void {
      if (this.isAdmin() && (this.key === 'asignaturas' || this.key === 'asignaciones')) {
       const validation = this.validarCatalogoAdministrativo();
        if (validation) { this.validationAttempted = true; this.apiError = validation; return; }
      }
      if (this.isAdmin() && this.key === 'asignaciones') { this.guardarAsignacion(); return; }
     if (this.isAdmin() && this.key === 'asignaturas') { this.guardarAsignatura(); return; }
    if (this.isAdmin() && this.key === 'profesores') { this.guardarProfesor(); return; }
    if (this.isAdmin() && this.key === 'estudiantes') { this.guardarEstudiante(); return; }
    if (this.isAdmin() && this.key === 'matriculas') { this.guardarMatricula(); return; }
    if (this.isAdmin() && this.key === 'periodos') { this.guardarCursoLectivo(); return; }
    if (this.isAdmin() && this.key === 'secciones') { this.guardarSeccion(); return; }
     this.cerrarEditor();
  }

  protected rolesSeleccionados(): string[] { return String(this.draft['roles'] ?? '').split('|').map((role) => role.trim()).filter(Boolean); }

    protected cambiarRol(role: string, selected: boolean): void {
    const roles = new Set(this.rolesSeleccionados());
    selected ? roles.add(role) : roles.delete(role);
    this.draft['roles'] = [...roles].join('|');
  }


  protected campoSoloLectura(field: CampoFormulario): boolean {
    if (this.readOnly || field.readOnly === true) return true;
    if (this.key === 'profesores') return field.key === 'cedula' && Boolean(this.editingId);
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

      private accionesProfesor(tieneCuenta: boolean): Array<{ label: string; code: string; tone?: string }> {
        return [{ label: 'Editar', code: 'edit' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }];
    }

     protected normalizarCodigoAsignatura(value: string): void {
       this.draft['codigo'] = String(value ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
     }

     protected formatearTelefono(value: unknown): string {
       const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8);
       if (digits.length <= 4) return digits;
       return `${digits.slice(0, 4)}-${digits.slice(4)}`;
     }

     protected cambiarNumeroCelular(value: unknown): void {
       this.draft['numeroCelular'] = this.formatearTelefono(value);
     }

    protected cambiarTipoIdentificacion(extranjera: boolean): void {
      const actual = String(this.draft['cedula'] ?? '').trim();
      if (!extranjera && actual && !this.esIdentificacionCostarricense(actual)) {
        // No se destruye una identificación extranjera al cambiar accidentalmente la casilla.
        this.identificacionExtranjera = true;
        return;
      }
      this.identificacionExtranjera = extranjera;
      this.draft['cedula'] = this.identificacionExtranjera
        ? actual.replace(/[^A-Za-z0-9-]/g, '').slice(0, 20)
        : this.formatearCedulaCostarricense(actual);
    }

    protected cambiarIdentificacion(value: string): void {
      const limpio = String(value ?? '')
        .replace(this.identificacionExtranjera ? /[^A-Za-z0-9-]/g : /[^0-9]/g, '')
        .slice(0, 20);
      this.draft['cedula'] = this.identificacionExtranjera ? limpio : this.formatearCedulaCostarricense(limpio);
    }

    private formatearCedulaCostarricense(value: string): string {
      const digits = value.replace(/[^0-9]/g, '').slice(0, 9);
      if (digits.length <= 1) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
      return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
    }

    private inferirIdentificacionExtranjera(value: string | undefined): boolean {
      const identification = String(value ?? '').trim();
      return Boolean(identification) && !this.esIdentificacionCostarricense(identification);
    }

    private esIdentificacionCostarricense(value: string): boolean {
      return /^\d{9}$/.test(value) || /^\d-\d{4}-\d{4}$/.test(value);
    }

   private accionesEstudiante(): Array<{ label: string; code: string; tone?: string }> {
     return [{ label: 'Editar', code: 'edit' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }];
   }

         private cargarProfesores(busqueda = '', pagina = this.paginaActual(), actualizaPaginacion = true): void {
      this.apiError = '';
           this.profesoresApi.listarPaginado(busqueda, pagina, this.tamanoPagina).subscribe({ next: (response) => { if (actualizaPaginacion) this.actualizarPaginacion(response); this.profesoresApiRows.set(response.elementos.map((item) => { const roles = item.roles.map((role) => ROLES_FRONTEND[role] ?? role); return { id: item.cedula, usuarioId: item.idUsuario ?? '', nombre: item.nombre, nombreCompleto: [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' '), cedula: item.cedula, correo: item.email ?? '', cuenta: item.tieneCuenta ? String(item.email) : 'Sin cuenta', tieneCuenta: item.tieneCuenta, estado: item.tieneCuenta ? (item.activo ? 'Activo' : 'Inactivo') : '—', roles: roles.join('|'), rolesBackend: item.roles.join('|'), rolesTexto: roles.join(', ') || '—', numeroCelular: item.numeroCelular ?? '', fechaNacimiento: item.fechaNacimiento, primerApellido: item.primerApellido, segundoApellido: item.segundoApellido ?? '', password: '', acciones: this.accionesProfesor(item.tieneCuenta) }; })); }, error: () => { this.profesoresApiRows.set([]); this.notificarError(undefined, 'No se pudieron consultar los profesores.'); } });
    }

    private cargarEstudiantes(busqueda = '', pagina = this.paginaActual()): void {
      this.apiError = '';
         this.estudiantesApi.listarPaginado(busqueda, pagina, this.tamanoPagina).subscribe({ next: (response) => { this.actualizarPaginacion(response); this.estudiantesApiRows.set(response.elementos.map((item) => ({ id: item.cedula, nombre: item.nombre, nombreCompleto: [item.nombre, item.primerApellido, item.segundoApellido].filter(Boolean).join(' '), cedula: item.cedula, correo: item.email, numeroCelular: item.numeroCelular ?? '', fechaNacimiento: item.fechaNacimiento, fechaRegistro: item.fechaRegistro, primerApellido: item.primerApellido, segundoApellido: item.segundoApellido ?? '', acciones: [...this.accionesEstudiante(), { label: 'Historial', code: 'history' }] }))); }, error: () => { this.estudiantesApiRows.set([]); this.notificarError(undefined, 'No se pudieron consultar los estudiantes.'); } });
    }

     private cargarMatriculas(busqueda = '', pagina = this.paginaActual()): void {
      this.apiError = '';
        this.estudiantesApi.listarPaginado('', 1, 100).pipe(map((response) => response.elementos)).subscribe({ next: (students) => {
         this.estudiantesMatricula.set(students);
           this.matriculasApi.listar({ busqueda, pagina, tamanoPagina: this.tamanoPagina }).subscribe({ next: (response) => { this.actualizarPaginacion(response); this.matriculasApiRows.set(response.elementos.map((item) => ({ id: `${item.anio}-${item.cedulaEstudiante}`, estudiante: item.nombreEstudiante, cedulaEstudiante: item.cedulaEstudiante, yearCiclo: item.anio, seccion: item.seccion, estado: item.estado, fechaRetiro: item.fechaRetiro, nivel: item.nivel, numeroSeccion: item.numero, acciones: [{ label: 'Editar', code: 'edit' }, ...(item.nivel === 11 ? [{ label: 'Subir de nivel', code: 'promote' }] : []), { label: 'Eliminar', code: 'delete', tone: 'danger' }] }))); }, error: (error) => this.notificarError(error, 'No se pudieron consultar las matrículas.') });
          }, error: () => { this.estudiantesMatricula.set([]); this.matriculasApiRows.set([]); this.notificarError(undefined, 'No se pudieron consultar los estudiantes para las matrículas.'); } });
   }

   private cargarSecciones(): void {
         this.seccionesApi.listarPaginado({ pagina: 1, tamanoPagina: 100 }).pipe(map((response) => response.elementos)).subscribe({ next: (sections) => this.seccionesMatricula.set(sections), error: () => { this.seccionesMatricula.set([]); this.notificarError(undefined, 'No se pudieron consultar las secciones.'); } });
   }

   private cargarCursosLectivos(): void {
         this.cursosLectivosApi.listarPaginado(1, 100).pipe(map((response) => response.elementos)).subscribe({ next: (courses) => this.cursosLectivosMatricula.set(courses), error: () => { this.cursosLectivosMatricula.set([]); this.notificarError(undefined, 'No se pudieron consultar los cursos lectivos.'); } });
   }

    private cargarCursosAdministracion(pagina = this.paginaActual()): void {
         this.cursosLectivosApi.listarPaginado(pagina, this.tamanoPagina).subscribe({ next: (response) => { this.actualizarPaginacion(response); this.cursosApiRows.set(response.elementos.map((course) => ({ id: String(course.idCursoLectivo), yearCiclo: course.yearCiclo, estado: course.estado, fechaInicio: this.formatearFecha(course.fechaInicio), fechaFin: this.formatearFecha(course.fechaFin), fechaInicioI: course.inicioSemestreI, fechaFinI: course.finSemestreI, fechaInicioII: course.inicioSemestreII, fechaFinII: course.finSemestreII, acciones: [{ label: 'Editar', code: 'edit' }, { label: 'Eliminar', code: 'delete', tone: 'danger' }] }))); }, error: () => { this.cursosApiRows.set([]); this.notificarError(undefined, 'No se pudieron consultar los cursos lectivos.'); } });
    }

      private cargarSeccionesAdministracion(pagina = this.paginaActual(), actualizaPaginacion = true): void {
         this.seccionesApi.listarPaginado({ pagina, tamanoPagina: this.tamanoPagina }).subscribe({ next: (response) => { if (actualizaPaginacion) this.actualizarPaginacion(response); this.seccionesApiRows.set(response.elementos.map((section) => { const parts = section.seccion.split('-'); return { id: String(section.idSeccion), yearCiclo: section.yearCiclo, seccion: section.seccion, nivel: parts[0], numeroSeccion: parts[1], acciones: [{ label: 'Eliminar', code: 'delete', tone: 'danger' }] }; })); }, error: () => { this.seccionesApiRows.set([]); this.notificarError(undefined, 'No se pudieron consultar las secciones.'); } });
    }

     private notificarError(error: unknown, fallback: string): void {
       const mensaje = (error as { error?: { mensaje?: string } })?.error?.mensaje ?? fallback;
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
        cedulaProfesor: item.cedulaProfesor ?? '',
        nombreProfesor: item.nombreProfesor ?? '',
      };
    }

    private cargarAsignaturas(pagina = this.paginaActual(), actualizaPaginacion = true): void {
      this.asignaturasApi.listar({ pagina, tamanoPagina: this.tamanoPagina }).subscribe({
        next: (response) => { if (actualizaPaginacion) this.actualizarPaginacion(response); this.asignaturasApiRows.set(response.elementos.map((item) => ({
          id: item.codigo,
          codigo: item.codigo,
          tipoAsignatura: this.tipoAsignaturaLabel(item.tipo),
          tipoBackend: item.tipo,
          escala: this.escalaPorTipo(item.tipo),
          nombre: item.nombre,
          descripcion: item.descripcion ?? '',
          imparteNivel11: item.imparteNivel11,
          imparteNivel12: item.imparteNivel12,
          acciones: this.accionesCrud(),
        }))); },
        error: (error) => { this.asignaturasApiRows.set([]); this.notificarError(error, 'No se pudieron consultar las asignaturas.'); },
      });
    }

    private tipoAsignaturaLabel(tipo: string): string {
      return tipo === 'TRONCAL' ? 'Troncal' : tipo === 'SUPERIOR' ? 'Superior' : tipo === 'MEDIO' ? 'Medio' : 'MEP';
    }

    private escalaPorTipo(tipo: string): string {
      return tipo === 'TRONCAL' ? 'A-E' : tipo === 'MEP' ? '0-100' : '1-7';
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

     private async accionAsignatura(action: string, registro: RegistroVista): Promise<void> {
      if (action === 'delete' && await this.feedback.confirmar(`¿Eliminar la asignatura ${registro['codigo']}?`, 'Eliminar asignatura', 'Eliminar')) {
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
        imparteNivel11: this.draft['imparteNivel11'] !== 'false',
        imparteNivel12: this.draft['imparteNivel12'] !== 'false',
      };
      const done = () => { this.feedback.exito(this.editingId ? 'La asignatura fue actualizada.' : 'La asignatura fue creada.'); this.cerrarEditor(); this.cargarAsignaturas(); };
      const error = (response: unknown) => this.notificarError(response, 'No se pudo guardar la asignatura.');
      if (this.editingId) this.asignaturasApi.actualizar(String(this.editingId), request).subscribe({ next: done, error });
      else this.asignaturasApi.registrar({ ...request, codigo: String(this.draft['codigo'] ?? '').trim().toUpperCase() }).subscribe({ next: done, error });
    }

    private tipoAsignaturaBackend(tipo: string): string {
      return tipo === 'Troncal' ? 'TRONCAL' : tipo === 'Superior' ? 'SUPERIOR' : tipo === 'Medio' ? 'MEDIO' : 'MEP';
    }

   private async accionAsignacion(action: string, registro: RegistroVista): Promise<void> {
      if (action === 'delete' && await this.feedback.confirmar('¿Eliminar esta asignación académica?', 'Eliminar asignación', 'Eliminar')) {
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

   private async accionProfesor(action: string, registro: RegistroVista): Promise<void> {
     if (action === 'delete') {
       this.professorDeleteTarget.set({ nombre: String(registro['nombreCompleto'] ?? registro['cedula']), cedula: String(registro['cedula']) });
       return;
     }
     if (action === 'view' || action === 'edit') {
      this.editingId = registro.id;
      this.readOnly = action === 'view';
      this.editorTitle = this.readOnly ? 'Detalle de profesor' : 'Editar profesor';
      this.validationAttempted = false;
       this.apiError = '';
       this.showPassword.set(false);
       this.professorStep.set(1);
        this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, String(registro[field.key] ?? '')]));
       this.identificacionExtranjera = this.inferirIdentificacionExtranjera(this.draft['cedula']);
      this.draft['cedulaOriginal'] = String(registro['cedula'] ?? '');
      this.draft['password'] = '';
      // Con cuenta se editan correo, contraseña, roles y estado; un profesor anterior sin cuenta puede recibirla al guardar.
      this.draft['modoCuenta'] = registro['tieneCuenta'] ? 'actual' : 'ninguna';
      if (!registro['tieneCuenta']) { this.draft['usuarioId'] = ''; this.draft['correo'] = ''; this.draft['roles'] = 'Profesor regular'; this.draft['estado'] = 'Activo'; }
      else { this.draft['emailOriginal'] = String(registro['correo'] ?? ''); this.draft['rolesBackend'] = String(registro['rolesBackend'] ?? ''); this.draft['estadoOriginal'] = String(registro['estado'] ?? ''); }
      this.editorOpen.set(true);
      return;
    }
   }

  private guardarProfesor(): void {
    this.validationAttempted = true;
    const validation = this.validarProfesorDraft();
    if (validation) { this.apiError = validation; return; }
    const request = this.profesorRequest();
    const terminar = (mensaje: string) => { this.feedback.exito(mensaje); this.cerrarEditor(); this.cargarProfesores(); this.cargarUsuarios('', 1, false, 100); };
      if (this.editingId) {
        const cedula = String(this.draft['cedulaOriginal'] ?? this.draft['cedula']);
        const { cuenta, cedula: _cedula, ...datos } = request;
        this.profesoresApi.actualizar(cedula, datos).subscribe({ next: () => {
          if (this.draft['modoCuenta'] === 'actual') { this.guardarCuentaProfesor(terminar); return; }
          if (!cuenta) { terminar('El profesor fue actualizado.'); return; }
          this.profesoresApi.crearCuenta(cedula, cuenta).subscribe({ next: () => terminar('El profesor fue actualizado y se le creó la cuenta.'), error: (error) => { this.cargarProfesores(); this.notificarError(error, 'Los datos se guardaron, pero no se pudo crear la cuenta.'); } });
        }, error: (error) => this.notificarError(error, 'No se pudo guardar el profesor.') });
      } else {
        this.profesoresApi.registrar(request).subscribe({ next: () => terminar('El profesor y su cuenta fueron creados.'), error: (error) => this.notificarError(error, 'No se pudo guardar el profesor.') });
      }
   }

  // Aplica sobre el usuario del profesor solo lo que cambió (correo, contraseña, estado y roles).
  private guardarCuentaProfesor(terminar: (mensaje: string) => void): void {
    const id = String(this.draft['usuarioId'] ?? '');
    const email = String(this.draft['correo'] ?? '').trim();
    const password = String(this.draft['password'] ?? '');
    const actuales = new Set(String(this.draft['rolesBackend'] ?? '').split('|').filter(Boolean));
    const deseados = new Set(this.rolesSeleccionados().map((role) => ROLES_BACKEND[role] ?? role));
    const operaciones = [] as Array<ReturnType<UsuariosApiService['actualizarEmail']>>;
    if (email !== this.draft['emailOriginal']) operaciones.push(this.usuariosApi.actualizarEmail(id, email));
    if (password) operaciones.push(this.usuariosApi.resetearContrasena(id, password));
    if (this.draft['estado'] !== this.draft['estadoOriginal']) operaciones.push(this.draft['estado'] === 'Activo' ? this.usuariosApi.activar(id) : this.usuariosApi.desactivar(id));
    for (const role of deseados) if (!actuales.has(role)) operaciones.push(this.usuariosApi.agregarRol(id, role));
    for (const role of actuales) if (!deseados.has(role)) operaciones.push(this.usuariosApi.quitarRol(id, role));
    if (!operaciones.length) { terminar('El profesor fue actualizado.'); return; }
    // En serie: cada cambio es una petición y una transacción; si uno falla, los anteriores quedan aplicados.
    concat(...operaciones).pipe(toArray()).subscribe({ next: () => terminar('El profesor y su cuenta fueron actualizados.'), error: (error) => { this.cargarProfesores(); this.notificarError(error, 'Los datos del profesor se guardaron, pero no todos los cambios de la cuenta.'); } });
  }

    private async accionEstudiante(action: string, registro: RegistroVista): Promise<void> {
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
        this.identificacionExtranjera = this.inferirIdentificacionExtranjera(String(this.draft['cedula'] ?? ''));
       this.draft['cedulaOriginal'] = String(registro['cedula'] ?? '');
       this.editorOpen.set(true);
       return;
     }
       if (action === 'delete' && await this.feedback.confirmar(`¿Eliminar al estudiante ${registro['nombreCompleto']}?`, 'Eliminar estudiante', 'Eliminar')) this.estudiantesApi.borrar(String(registro['cedula'])).subscribe({ next: () => { this.feedback.exito('El estudiante fue eliminado.'); this.cargarEstudiantes(); }, error: (error) => this.notificarError(error, 'No se pudo eliminar el estudiante.') });
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
      return { nombre: String(this.draft['nombre'] ?? ''), primerApellido: String(this.draft['primerApellido'] ?? ''), segundoApellido: String(this.draft['segundoApellido'] ?? '') || null, cedula: String(this.draft['cedula'] ?? ''), numeroCelular: this.formatearTelefono(this.draft['numeroCelular']) || null, email: String(this.draft['correo'] ?? ''), fechaNacimiento: String(this.draft['fechaNacimiento'] ?? '') };
   }

    protected campoRequerido(field: CampoFormulario): boolean {
      if (this.readOnly || field.required === false) return false;
      if (this.key !== 'profesores') return field.required ?? true;
      if (field.key === 'password') return this.draft['modoCuenta'] === 'nueva';
      if (['correo', 'roles'].includes(field.key)) return ['nueva', 'actual'].includes(String(this.draft['modoCuenta'] ?? ''));
      return field.required ?? true;
    }

     protected fieldError(key: string): string {
       if (!this.validationAttempted || this.readOnly || !['profesores', 'estudiantes', 'matriculas', 'periodos', 'secciones'].includes(this.key)) return '';
       const value = String(this.draft[key] ?? '').trim();
         const required = new Set(this.key === 'profesores' ? ['nombre', 'primerApellido', 'cedula', 'fechaNacimiento', ...(this.draft['modoCuenta'] === 'nueva' ? ['correo', 'password', 'roles'] : this.draft['modoCuenta'] === 'actual' ? ['correo', 'roles'] : [])] : this.key === 'estudiantes' ? ['nombre', 'primerApellido', 'cedula', 'correo', 'fechaNacimiento'] : this.key === 'matriculas' ? ['cedulaEstudiante', 'yearCiclo', 'nivel', 'numeroSeccion'] : this.key === 'periodos' ? ['yearCiclo', 'fechaInicioI', 'fechaFinI', 'fechaInicioII', 'fechaFinII'] : ['yearCiclo', 'nivel', 'numeroSeccion']);
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

    protected fechaMinima(key: string): string | null {
      if (key === 'fechaNacimiento') return '1900-01-01';
      if (!key.startsWith('fechaInicio') && !key.startsWith('fechaFin')) return null;
      const year = Number(this.draft['yearCiclo']);
      return Number.isInteger(year) && year >= 1900 && year <= 2100 ? `${year}-01-01` : null;
    }

    protected fechaMaxima(key: string): string | null {
      if (key === 'fechaNacimiento') return new Date().toISOString().slice(0, 10);
      if (!key.startsWith('fechaInicio') && !key.startsWith('fechaFin')) return null;
      const year = Number(this.draft['yearCiclo']);
      return Number.isInteger(year) && year >= 1900 && year <= 2100 ? `${year}-12-31` : null;
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
      const modo = this.draft['modoCuenta'];
      const cuenta: CuentaProfesorRequest | null = modo === 'nueva' ? { email: String(this.draft['correo'] ?? '').trim(), contrasena: String(this.draft['password'] ?? ''), roles: this.rolesSeleccionados().map((role) => ROLES_BACKEND[role] ?? role) } : null;
       return { nombre: String(this.draft['nombre'] ?? ''), primerApellido: String(this.draft['primerApellido'] ?? ''), segundoApellido: String(this.draft['segundoApellido'] ?? '') || null, cedula: String(this.draft['cedula'] ?? ''), numeroCelular: this.formatearTelefono(this.draft['numeroCelular']) || null, fechaNacimiento: String(this.draft['fechaNacimiento'] ?? ''), cuenta };
  }

     private validarPasoProfesor(step: number): string | null {
      if (!String(this.draft['nombre'] ?? '').trim()) return "El campo 'nombre' es obligatorio y no puede estar vacío.";
      if (!String(this.draft['primerApellido'] ?? '').trim()) return "El campo 'primerApellido' es obligatorio y no puede estar vacío.";
      if (!String(this.draft['cedula'] ?? '').trim()) return "El campo 'cedula' es obligatorio y no puede estar vacío.";
      if (!String(this.draft['fechaNacimiento'] ?? '').trim()) return "El campo 'fechaNacimiento' es obligatorio y no puede estar vacío.";
      if (String(this.draft['nombre'] ?? '').trim().length < 2 || String(this.draft['primerApellido'] ?? '').trim().length < 2) return 'El nombre y el primer apellido deben tener al menos 2 caracteres.';
      if (String(this.draft['cedula'] ?? '').trim().length < 5) return 'La cédula debe tener al menos 5 caracteres.';
      if (step === 1) {
        const birthDate = String(this.draft['fechaNacimiento'] ?? '');
        if (!this.esFechaIsoValida(birthDate) || birthDate < '1900-01-01' || birthDate > new Date().toISOString().slice(0, 10)) return 'La fecha de nacimiento debe ser real y estar entre 1900 y hoy.';
        return null;
      }
      if (step === 2 && this.draft['modoCuenta'] === 'actual') {
        if (!/^\S+@\S+\.\S+$/.test(String(this.draft['correo'] ?? '').trim())) return 'Escriba un correo electrónico válido para la cuenta.';
        const nueva = String(this.draft['password'] ?? '');
        if (nueva && (nueva.length < 8 || nueva.length > 128)) return 'La contraseña nueva debe tener entre 8 y 128 caracteres.';
      }
      if (step === 2 && this.draft['modoCuenta'] === 'nueva') {
        if (!/^\S+@\S+\.\S+$/.test(String(this.draft['correo'] ?? '').trim())) return 'Escriba un correo electrónico válido para la cuenta.';
        const password = String(this.draft['password'] ?? '');
        if (password.length < 8 || password.length > 128) return 'La contraseña debe tener entre 8 y 128 caracteres.';
      }
      if (step === 2) return null;
      if (this.draft['modoCuenta'] !== 'ninguna' && !this.rolesSeleccionados().length) return 'Seleccione al menos un rol para la cuenta.';
      return null;
    }

     private validarProfesorDraft(): string | null {
       for (const step of this.professorSteps.map((item) => item.number)) {
         const error = this.validarPasoProfesor(step);
         if (error) return error;
       }
       return null;
    }
    private validarCatalogoAdministrativo(): string | null {
      const required = this.key === 'asignaturas' ? ['codigo', 'tipoAsignatura', 'nombre'] : ['profesor', 'codigo', 'yearCiclo', 'seccion'];
     const missing = required.find((key) => !String(this.draft[key] ?? '').trim());
      if (missing) return `El campo '${missing}' es obligatorio.`;
      if (this.key === 'asignaturas' && !/^[A-Z]{3}$/.test(String(this.draft['codigo']).trim())) return 'El código debe tener exactamente tres letras mayúsculas.';
      if (this.key === 'asignaturas' && String(this.draft['nombre'] ?? '').trim().length < 2) return 'El nombre de la asignatura debe tener al menos 2 caracteres.';
      if (this.key === 'asignaturas' && this.draft['imparteNivel11'] !== 'true' && this.draft['imparteNivel12'] !== 'true') return 'La asignatura debe impartirse al menos en nivel 11 o nivel 12.';
      if (this.key === 'asignaciones' && !/^[A-Z]{3}$/.test(String(this.draft['codigo']).trim())) return 'El código de asignatura debe tener exactamente tres letras mayúsculas.';
     return null;
   }

   private guardarAsignacion(): void {
      const teacher = this.profesoresDisponiblesAsignacion().find((item) => item.nombre === this.draft['profesor']);
      const [nivel, numero] = String(this.draft['seccion'] ?? '').split('-').map(Number);
       const anio = Number(this.draft['yearCiclo'] ?? this.draft['anio'] ?? new Date().getFullYear());
      const codigo = String(this.draft['codigo'] ?? '').trim();
      if (!teacher || !nivel || !numero) { this.apiError = 'Seleccione un profesor y una sección válida.'; return; }
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
    return this.grupos.profesor() || this.auth.currentDisplayName() || this.auth.currentUsername();
  }

   private activeAssignments(): RegistroVista[] {
     return this.grupos.asignaciones();
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
        const scale = ['Estudios Sociales', 'Cívica', 'Civica'].includes(name) ? '1–100' : '1–7';
        return { id: `subject-${name}`, nombre: name, escala: scale, secciones: assignments.filter((item) => item['asignatura'] === name).length, acciones: [{ label: 'Ver grupos', code: 'view' }] };
      });
    }

    if (this.key === 'secciones') {
       return [...new Set(assignments.map((item) => item['seccion']))].map((name) => ({ id: `section-${name}`, nombre: name, nivel: assignments.find((item) => item['seccion'] === name)?.['nivel'] ?? '-', asignaturas: assignments.filter((item) => item['seccion'] === name).map((item) => item['asignatura']).join(', '), estudiantes: this.grupos.estudiantesDeSeccion(name).length, acciones: [{ label: 'Abrir', code: 'view' }] }));
    }
    if (this.key === 'estudiantes') {
      const selected = this.grupos.grupos().find((group) => group.id === this.selectedGroupId());
      const sections = new Set(selected ? [selected.seccion] : assignments.map((item) => item['seccion']));
        const students = selected?.estudiantes ?? this.grupos.estudiantesDeSeccion([...sections][0] ?? '');
       return students.map((item) => ({ ...item, acciones: [{ label: 'Ver', code: 'view' }] }));
      }
    return [];
  }

    private async accionMatricula(action: string, registro: RegistroVista): Promise<void> {
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
      if (action === 'retire' && await this.feedback.confirmar('¿Registrar el retiro de esta matrícula?', 'Registrar retiro', 'Continuar')) {
        const fecha = await this.feedback.solicitarTexto('Indique la fecha de retiro con formato AAAA-MM-DD.', new Date().toISOString().slice(0, 10), 'Fecha de retiro');
        if (!fecha) return;
        const motivo = await this.feedback.solicitarTexto('Indique el motivo del retiro si corresponde.', '', 'Motivo del retiro');
        if (motivo === null) return;
        this.matriculasApi.retirar(anio, cedula, fecha, motivo || undefined).subscribe({ next: () => { this.feedback.exito('El retiro de la matrícula fue registrado.'); this.cargarMatriculas(); }, error: (error) => this.notificarError(error, 'No se pudo registrar el retiro.') });
        return;
      }
      if (action === 'unretire' && await this.feedback.confirmar('¿Anular el retiro de esta matrícula?', 'Anular retiro', 'Anular')) this.matriculasApi.quitarRetiro(anio, cedula).subscribe({ next: () => { this.feedback.exito('El retiro de la matrícula fue anulado.'); this.cargarMatriculas(); }, error: (error) => this.notificarError(error, 'No se pudo anular el retiro.') });
      if (action === 'delete' && await this.feedback.confirmar('¿Eliminar esta matrícula?', 'Eliminar matrícula', 'Eliminar')) this.matriculasApi.borrar(anio, cedula).subscribe({ next: () => { this.feedback.exito('La matrícula fue eliminada.'); this.cargarMatriculas(); }, error: (error) => this.notificarError(error, 'No se pudo eliminar la matrícula.') });
   }

   private guardarMatricula(): void {
     this.validationAttempted = true;
     const error = this.validarMatriculaDraft();
       if (error) { this.apiError = error; return; }
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
      if (!level || ![11, 12].includes(Number(level))) return "El campo 'Nivel' debe ser 11 o 12.";
      const section = String(this.draft['numeroSeccion'] ?? '').trim();
     if (!section) return "El campo 'Número de sección' es obligatorio y no puede estar vacío.";
     if (!Number.isInteger(Number(section)) || Number(section) <= 0) return "El campo 'Número de sección' debe ser mayor que cero.";
     return null;
   }

    private async accionCursoLectivo(action: string, registro: RegistroVista): Promise<void> {
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
       if (action === 'delete' && await this.feedback.confirmar(`¿Eliminar el curso lectivo ${registro['yearCiclo']}?`, 'Eliminar curso lectivo', 'Eliminar')) this.cursosLectivosApi.borrar(Number(registro['yearCiclo'])).subscribe({ next: () => { this.feedback.exito('El curso lectivo fue eliminado.'); this.cargarCursosAdministracion(); }, error: (error) => this.notificarError(error, 'No se pudo eliminar el curso lectivo.') });
   }

   private guardarCursoLectivo(): void {
     this.validationAttempted = true;
     const error = this.validarCursoLectivoDraft();
       if (error) { this.apiError = error; return; }
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

    private async accionSeccion(action: string, registro: RegistroVista): Promise<void> {
     if (action === 'view') {
       this.readOnly = true;
       this.editorTitle = 'Detalle de sección';
       this.validationAttempted = false;
       this.apiError = '';
       this.draft = Object.fromEntries(this.config.fields.map((field) => [field.key, String(registro[field.key] ?? '')]));
       this.editorOpen.set(true);
       return;
     }
       if (action === 'delete' && await this.feedback.confirmar(`¿Eliminar la sección ${registro['seccion']} del curso ${registro['yearCiclo']}?`, 'Eliminar sección', 'Eliminar')) this.seccionesApi.borrar(Number(registro['yearCiclo']), Number(registro['nivel']), Number(registro['numeroSeccion'])).subscribe({ next: () => { this.feedback.exito('La sección fue eliminada.'); this.cargarSeccionesAdministracion(); }, error: (error) => this.notificarError(error, 'No se pudo eliminar la sección.') });
   }

   private guardarSeccion(): void {
     this.validationAttempted = true;
     const error = this.validarSeccionDraft();
       if (error) { this.apiError = error; return; }
      const request: SeccionRequest = { anio: Number(this.draft['yearCiclo']), nivel: Number(this.draft['nivel']), numero: Number(this.draft['numeroSeccion']) };
      this.seccionesApi.registrar(request).subscribe({ next: () => { this.feedback.exito('La sección fue registrada.'); this.cerrarEditor(); this.cargarSeccionesAdministracion(); }, error: (error) => this.notificarError(error, 'No se pudo registrar la sección.') });
   }

   private validarSeccionDraft(): string | null {
     if (!String(this.draft['yearCiclo'] ?? '').trim()) return "El campo 'Curso lectivo' es obligatorio y no puede estar vacío.";
     if (!String(this.draft['nivel'] ?? '').trim()) return "El campo 'Nivel' es obligatorio y no puede estar vacío.";
     if (!String(this.draft['numeroSeccion'] ?? '').trim()) return "El campo 'Número de sección' es obligatorio y no puede estar vacío.";
      if (!Number.isInteger(Number(this.draft['yearCiclo'])) || Number(this.draft['yearCiclo']) <= 0) return "El campo 'Curso lectivo' debe ser válido.";
     if (![11, 12].includes(Number(this.draft['nivel']))) return "El campo 'Nivel' debe ser 11 o 12.";
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

    protected cancelarEliminacionProfesor(): void { this.professorDeleteTarget.set(null); }

    protected confirmarEliminacionProfesor(): void {
      const target = this.professorDeleteTarget();
      if (!target) return;
      this.profesoresApi.borrar(target.cedula).subscribe({ next: () => { this.professorDeleteTarget.set(null); this.cargarProfesores(); this.cargarUsuarios('', 1, false, 100); }, error: (error) => this.notificarError(error, 'No se pudo eliminar el profesor.') });
    }

    protected confirmarPromocion(): void {
      const target = this.promotionTarget();
      if (!target) return;
      this.matriculasApi.subirSeccion({ anio: target.cursoDestino, numero: target.numeroSeccion }).subscribe({ next: (resultado) => { this.promotionTarget.set(null); this.feedback.exito(`La sección fue subida a duodécimo: ${resultado.matriculados.length} matriculados${resultado.omitidos.length ? `, ${resultado.omitidos.length} ya estaban matriculados` : ''}; ${resultado.guiaCopiado ? 'se copió el guía' : 'sin guía que copiar'} y ${resultado.asignacionesCopiadas.length} asignaciones de profesores.`); this.cargarMatriculas(); }, error: (error) => this.notificarError(error, 'No se pudo subir la sección a duodécimo.') });
    }

     protected estudiantesResultadosMatricula(): EstudianteApi[] {
      const disponibles = this.estudiantesDisponiblesMatricula();
      return this.studentSearch.trim() ? disponibles : disponibles.slice(0, 8);
     }

     protected buscarEstudiantesMatricula(value: string): void {
       this.studentSearch = value;
       const busqueda = value.trim();
       if (busqueda.length === 1) return;
       this.estudiantesApi.listar(busqueda).subscribe({ next: (students) => this.estudiantesMatricula.set(students), error: () => this.notificarError(undefined, 'No se pudieron buscar estudiantes.') });
     }

    protected seleccionarEstudianteMatricula(student: EstudianteApi): void {
      this.draft['cedulaEstudiante'] = student.cedula;
      this.studentSearch = this.nombreCompletoEstudiante(student);
    }

    protected estudianteSeleccionadoMatricula(): string {
      const selected = this.estudiantesMatricula().find((student) => student.cedula === this.draft['cedulaEstudiante']);
      return selected ? this.nombreCompletoEstudiante(selected) : 'Estudiante no encontrado';
    }

    protected estudianteSeleccionadoCorreo(): string {
      const selected = this.estudiantesMatricula().find((student) => student.cedula === this.draft['cedulaEstudiante']);
      return selected && selected.email ? selected.email : '';
    }

    protected estudianteSeleccionadoEdad(): number {
      const selected = this.estudiantesMatricula().find((student) => student.cedula === this.draft['cedulaEstudiante']);
      return selected ? this.edadEstudiante(selected) : 0;
    }

    protected inicialesEstudiante(student: EstudianteApi): string {
      return [student.nombre, student.primerApellido].map((part) => part.trim().charAt(0)).filter(Boolean).join('').toUpperCase();
    }

   protected nombreCompletoEstudiante(student: EstudianteApi): string {
     return [student.nombre, student.primerApellido, student.segundoApellido].filter(Boolean).join(' ');
   }

   protected edadEstudiante(student: EstudianteApi): number {
     const fecha = student.fechaNacimiento;
     if (!fecha) return 0;
     const nacimiento = new Date(fecha);
     const hoy = new Date();
     let edad = hoy.getFullYear() - nacimiento.getFullYear();
     const m = hoy.getMonth() - nacimiento.getMonth();
     if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
     return edad;
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
