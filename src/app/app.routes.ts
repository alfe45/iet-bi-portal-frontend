import { Routes } from '@angular/router';
import { EstructuraPrincipalComponent } from './estructura/estructura-principal.component';
import { TableroVistaComponent } from './vistas/tablero-vista.component';
import { FuncionalidadVistaComponent } from './vistas/funcionalidad-vista.component';
import { SeccionGuiaVistaComponent } from './vistas/seccion-guia-vista.component';
import { VerificacionMonografiasVistaComponent } from './vistas/verificacion-monografias-vista.component';
import { AsignacionesMonografiaVistaComponent } from './vistas/asignaciones-monografia-vista.component';
import { AsignacionesCasGuiaVistaComponent } from './vistas/asignaciones-cas-guia-vista.component';
import { InicioSesionVistaComponent } from './vistas/inicio-sesion-vista.component';
import { MonografiasVista } from './vistas/monografias-vista';
import { PerfilVistaComponent } from './vistas/perfil-vista.component';
import { ReportesVistaComponent } from './vistas/reportes-vista.component';
import { ReportesBandasVistaComponent } from './vistas/reportes-bandas-vista.component';
import { GrupoDocenteVistaComponent } from './vistas/grupo-docente-vista.component';
import { GruposProfesorVistaComponent } from './vistas/grupos-profesor-vista.component';
import { RegistroAcademicoVistaComponent } from './vistas/registro-academico-vista.component';
import { CompartirSeccionVistaComponent } from './vistas/compartir-seccion-vista.component';
import { CasVistaComponent } from './vistas/cas-vista.component';
import { HistorialEstudianteVistaComponent } from './vistas/historial-estudiante-vista.component';
import { authGuard, roleGuard } from './nucleo/autenticacion/autenticacion.guards';
import { RolUsuario } from './nucleo/modelos/modelos-prototipo';

const ADMIN: RolUsuario[] = ['Administrador'];
const DOCENTES: RolUsuario[] = ['Profesor regular', 'Profesor Guía', 'Profesor Coordinador de Monografía', 'Profesor CAS', 'Profesor Coordinador de CAS'];
const TODOS: RolUsuario[] = ['Administrador', ...DOCENTES];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: InicioSesionVistaComponent },
  {
    path: '',
    component: EstructuraPrincipalComponent,
    canActivateChild: [authGuard, roleGuard],
    children: [
      { path: 'dashboard', component: TableroVistaComponent, data: { roles: TODOS } },
      { path: 'grupo', component: GrupoDocenteVistaComponent, data: { roles: DOCENTES } },
      { path: 'grupos', component: GruposProfesorVistaComponent, data: { roles: DOCENTES } },
      { path: 'registro-academico', component: RegistroAcademicoVistaComponent, data: { roles: DOCENTES } },
      { path: 'compartir', component: CompartirSeccionVistaComponent, data: { roles: DOCENTES } },
      { path: 'usuarios', component: FuncionalidadVistaComponent, data: { roles: ADMIN } },
      { path: 'profesores', component: FuncionalidadVistaComponent, data: { roles: ADMIN } },
      { path: 'estudiantes', component: FuncionalidadVistaComponent, data: { roles: TODOS } },
      { path: 'estudiantes/:cedula/historial', component: HistorialEstudianteVistaComponent, data: { roles: ADMIN } },
      { path: 'periodos', component: FuncionalidadVistaComponent, data: { roles: ADMIN } },
      { path: 'secciones', component: FuncionalidadVistaComponent, data: { roles: TODOS } },
      { path: 'matriculas', component: FuncionalidadVistaComponent, data: { roles: ADMIN } },
      { path: 'escalas', component: FuncionalidadVistaComponent, data: { roles: ADMIN } },
      { path: 'asignaturas', component: FuncionalidadVistaComponent, data: { roles: TODOS } },
      { path: 'asignaciones', component: FuncionalidadVistaComponent, data: { roles: ADMIN } },
      { path: 'asignaciones-monografia', component: AsignacionesMonografiaVistaComponent, data: { roles: ADMIN } },
      { path: 'asignaciones-cas', component: AsignacionesCasGuiaVistaComponent, data: { assignmentMode: 'cas', roles: ADMIN } },
      { path: 'asignaciones-guias', component: AsignacionesCasGuiaVistaComponent, data: { assignmentMode: 'guide', roles: ADMIN } },
      { path: 'evaluaciones', redirectTo: 'registro-academico', pathMatch: 'full' },
      { path: 'ausentismo', redirectTo: 'registro-academico', pathMatch: 'full' },
      { path: 'seccion-guia', component: SeccionGuiaVistaComponent, data: { roles: ['Profesor Guía'] } },
      { path: 'verificacion-monografias', component: VerificacionMonografiasVistaComponent, data: { roles: ['Profesor Guía'] } },
      { path: 'reportes', component: ReportesVistaComponent, data: { reportMode: 'subject', roles: DOCENTES } },
      { path: 'reportes/bandas', component: ReportesBandasVistaComponent, data: { roles: ['Profesor Guía'] } },
      { path: 'reportes/asignatura', component: ReportesVistaComponent, data: { reportMode: 'subject', roles: DOCENTES } },
      { path: 'monografias', component: MonografiasVista, data: { roles: ['Profesor Coordinador de Monografía'] } },
      { path: 'perfil', component: PerfilVistaComponent, data: { roles: TODOS } },
      { path: 'cas', component: CasVistaComponent, data: { casMode: 'teacher', roles: ['Profesor CAS', 'Profesor Coordinador de CAS'] } },
      { path: 'coordinacion-cas', component: CasVistaComponent, data: { casMode: 'coordinator', roles: ['Profesor Coordinador de CAS'] } },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
