import { Routes } from '@angular/router';
import { authGuard, loginGuard, roleGuard } from './core/guards/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';
import { AbsenteeismPageComponent } from './pages/absenteeism/absenteeism-page.component';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { EvaluationsPageComponent } from './pages/evaluations/evaluations-page.component';
import { FeaturePageComponent } from './pages/feature/feature-page.component';
import { FeatureRecordPageComponent } from './pages/feature/feature-record-page.component';
import { GuideSectionPageComponent } from './pages/guide-section/guide-section-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { MonographDetailPageComponent } from './pages/monographs/monograph-detail-page.component';
import { MonographsPage } from './pages/monographs/monographs-page/monographs-page';
import { FollowUpsPage } from './pages/monographs/follow-ups-page/follow-ups-page';
import { FollowUpRecordPage } from './pages/monographs/follow-up-record-page/follow-up-record-page';
import { ProfilePageComponent } from './pages/profile/profile-page.component';
import { ReportsPageComponent } from './pages/reports/reports-page.component';

const ALL_ROLES = ['Administrador', 'Profesor', 'Profesor Guía', 'Profesor Guía de Monografía'];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPageComponent, canActivate: [loginGuard] },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardPageComponent, canActivate: [roleGuard], data: { roles: ALL_ROLES } },
      { path: 'usuarios', component: FeaturePageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'] } },
      { path: 'usuarios/registrar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'usuarios', mode: 'create' } },
      { path: 'usuarios/:id/editar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'usuarios', mode: 'edit' } },
      { path: 'usuarios/:id', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'usuarios', mode: 'detail' } },
      { path: 'profesores', component: FeaturePageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'] } },
      { path: 'profesores/registrar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'profesores', mode: 'create' } },
      { path: 'profesores/:id/editar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'profesores', mode: 'edit' } },
      { path: 'profesores/:id', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'profesores', mode: 'detail' } },
      { path: 'estudiantes', component: FeaturePageComponent, canActivate: [roleGuard], data: { roles: ALL_ROLES } },
      { path: 'estudiantes/registrar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'estudiantes', mode: 'create' } },
      { path: 'estudiantes/:id/editar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'estudiantes', mode: 'edit' } },
      { path: 'estudiantes/:id/historial-matricula', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'estudiantes', mode: 'history' } },
      { path: 'estudiantes/:id', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ALL_ROLES, entity: 'estudiantes', mode: 'detail' } },
      { path: 'periodos', component: FeaturePageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'] } },
      { path: 'periodos/registrar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'periodos', mode: 'create' } },
      { path: 'periodos/:id/editar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'periodos', mode: 'edit' } },
      { path: 'periodos/:id', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ALL_ROLES, entity: 'periodos', mode: 'detail' } },
      { path: 'secciones', component: FeaturePageComponent, canActivate: [roleGuard], data: { roles: ALL_ROLES } },
      { path: 'secciones/registrar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'secciones', mode: 'create' } },
      { path: 'secciones/:id/editar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'secciones', mode: 'edit' } },
      { path: 'secciones/:id', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador', 'Profesor', 'Profesor Guía'], entity: 'secciones', mode: 'detail' } },
      { path: 'matriculas', component: FeaturePageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'] } },
      { path: 'matriculas/registrar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'matriculas', mode: 'create' } },
      { path: 'matriculas/:id/editar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'matriculas', mode: 'edit' } },
      { path: 'matriculas/:id', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'matriculas', mode: 'detail' } },
      { path: 'escalas', component: FeaturePageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'] } },
      { path: 'escalas/:id/editar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'escalas', mode: 'edit' } },
      { path: 'escalas/:id', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'escalas', mode: 'detail' } },
      { path: 'asignaturas', component: FeaturePageComponent, canActivate: [roleGuard], data: { roles: ALL_ROLES } },
      { path: 'asignaturas/registrar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'asignaturas', mode: 'create' } },
      { path: 'asignaturas/:id/editar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'asignaturas', mode: 'edit' } },
      { path: 'asignaturas/:id', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ALL_ROLES, entity: 'asignaturas', mode: 'detail' } },
      { path: 'asignaciones', component: FeaturePageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'] } },
      { path: 'asignaciones/registrar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'asignaciones', mode: 'create' } },
      { path: 'asignaciones/:id/editar', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'asignaciones', mode: 'edit' } },
      { path: 'asignaciones/:id', component: FeatureRecordPageComponent, canActivate: [roleGuard], data: { roles: ['Administrador'], entity: 'asignaciones', mode: 'detail' } },
      { path: 'evaluaciones', component: EvaluationsPageComponent, canActivate: [roleGuard], data: { roles: ['Profesor', 'Profesor Guía', 'Profesor Guía de Monografía'] } },
      { path: 'ausentismo', component: AbsenteeismPageComponent, canActivate: [roleGuard], data: { roles: ['Profesor', 'Profesor Guía', 'Profesor Guía de Monografía'] } },
      { path: 'seccion-guia', component: GuideSectionPageComponent, canActivate: [roleGuard], data: { roles: ['Profesor Guía'] } },
      { path: 'reportes', component: ReportsPageComponent, canActivate: [roleGuard], data: { roles: ['Profesor', 'Profesor Guía'] } },
      { path: 'reportes/individual', component: ReportsPageComponent, canActivate: [roleGuard], data: { roles: ['Profesor Guía'], reportMode: 'individual' } },
      { path: 'reportes/consolidado', component: ReportsPageComponent, canActivate: [roleGuard], data: { roles: ['Profesor Guía'], reportMode: 'consolidated' } },
      { path: 'reportes/seccion', component: ReportsPageComponent, canActivate: [roleGuard], data: { roles: ['Profesor Guía'], reportMode: 'section' } },
      { path: 'monografias', component: MonographsPage, canActivate: [roleGuard], data: { roles: ['Profesor Guía de Monografía'] } },
      { path: 'monografias/reportes', component: FollowUpsPage, canActivate: [roleGuard], data: { roles: ['Profesor Guía de Monografía'] } },
      { path: 'monografias/reportes/nuevo', component: FollowUpRecordPage, canActivate: [roleGuard], data: { roles: ['Profesor Guía de Monografía'] } },
      { path: 'monografias/:id', component: MonographDetailPageComponent, canActivate: [roleGuard], data: { roles: ['Profesor Guía', 'Profesor Guía de Monografía'] } },
      { path: 'perfil', component: ProfilePageComponent, canActivate: [roleGuard], data: { roles: ALL_ROLES } },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
