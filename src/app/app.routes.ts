import { Routes } from '@angular/router';
import { EstructuraPrincipalComponent } from './estructura/estructura-principal.component';
import { AusentismoVistaComponent } from './vistas/ausentismo-vista.component';
import { TableroVistaComponent } from './vistas/tablero-vista.component';
import { EvaluacionesVistaComponent } from './vistas/evaluaciones-vista.component';
import { FuncionalidadVistaComponent } from './vistas/funcionalidad-vista.component';
import { SeccionGuiaVistaComponent } from './vistas/seccion-guia-vista.component';
import { InicioSesionVistaComponent } from './vistas/inicio-sesion-vista.component';
import { DetalleMonografiaVistaComponent } from './vistas/detalle-monografia-vista.component';
import { MonografiasVista } from './vistas/monografias-vista';
import { SeguimientosVista } from './vistas/seguimientos-vista';
import { PerfilVistaComponent } from './vistas/perfil-vista.component';
import { ReportesVistaComponent } from './vistas/reportes-vista.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: InicioSesionVistaComponent },
  {
    path: '',
    component: EstructuraPrincipalComponent,
    children: [
      { path: 'dashboard', component: TableroVistaComponent },
      { path: 'usuarios', component: FuncionalidadVistaComponent },
      { path: 'profesores', component: FuncionalidadVistaComponent },
      { path: 'estudiantes', component: FuncionalidadVistaComponent },
      { path: 'periodos', component: FuncionalidadVistaComponent },
      { path: 'secciones', component: FuncionalidadVistaComponent },
      { path: 'matriculas', component: FuncionalidadVistaComponent },
      { path: 'escalas', component: FuncionalidadVistaComponent },
      { path: 'asignaturas', component: FuncionalidadVistaComponent },
      { path: 'asignaciones', component: FuncionalidadVistaComponent },
      { path: 'evaluaciones', component: EvaluacionesVistaComponent },
      { path: 'ausentismo', component: AusentismoVistaComponent },
      { path: 'seccion-guia', component: SeccionGuiaVistaComponent },
      { path: 'reportes', component: ReportesVistaComponent },
      { path: 'reportes/individual', component: ReportesVistaComponent },
      { path: 'reportes/consolidado', component: ReportesVistaComponent },
      { path: 'reportes/seccion', component: ReportesVistaComponent },
      { path: 'monografias', component: MonografiasVista },
      { path: 'monografias/reportes', component: SeguimientosVista },
      { path: 'monografias/:id', component: DetalleMonografiaVistaComponent },
      { path: 'perfil', component: PerfilVistaComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
