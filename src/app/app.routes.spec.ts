import type { Route } from '@angular/router';
import { routes } from './app.routes';

describe('report routes', () => {
  const childRoutes = routes.find((route) => route.children)?.children ?? [];

  it.each([
    ['reportes', 'subject'],
    ['reportes/asignatura', 'subject'],
  ])('configures %s with the %s mode', (path, reportMode) => {
    const route = childRoutes.find((candidate: Route) => candidate.path === path);

    expect(route?.data?.['reportMode']).toBe(reportMode);
  });

  it('protects the authenticated shell and sensitive routes by role', () => {
    const shell = routes.find((route) => route.children);
    const users = childRoutes.find((route) => route.path === 'usuarios');
    const monographs = childRoutes.find((route) => route.path === 'monografias');

    expect(shell?.canActivateChild).toHaveLength(2);
    expect(users?.data?.['roles']).toEqual(['Administrador']);
    expect(monographs?.data?.['roles']).toEqual(['Profesor Coordinador de Monografía']);
    expect(childRoutes.find((route: Route) => route.path === 'asignaciones-monografia')?.data?.['roles']).toEqual(['Administrador']);
  });

  it.each(['grupos', 'grupo', 'registro-academico', 'compartir', 'reportes', 'reportes/asignatura'])('limits %s to accounts with Profesor regular', (path) => {
    const route = childRoutes.find((candidate: Route) => candidate.path === path);

    expect(route?.data?.['roles']).toEqual(['Profesor regular']);
  });

  it.each(['estudiantes', 'secciones', 'asignaturas'])('allows %s for administrators and regular teachers only', (path) => {
    const route = childRoutes.find((candidate: Route) => candidate.path === path);

    expect(route?.data?.['roles']).toEqual(['Administrador', 'Profesor regular']);
  });

  it('separates CAS teacher follow-up from CAS coordination', () => {
    expect(childRoutes.find((route: Route) => route.path === 'cas')?.data?.['roles']).toEqual(['Profesor CAS']);
    expect(childRoutes.find((route: Route) => route.path === 'coordinacion-cas')?.data?.['roles']).toEqual(['Profesor Coordinador de CAS']);
  });
});
