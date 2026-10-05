import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolUsuario } from '../modelos/modelos-prototipo';
import { AutenticacionService } from './autenticacion.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AutenticacionService);
  return auth.authenticated() || inject(Router).createUrlTree(['/login']);
};

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AutenticacionService);
  const permitidos = route.data['roles'] as RolUsuario[] | undefined;
  return !permitidos?.length || permitidos.some((role) => auth.hasRole(role)) || inject(Router).createUrlTree(['/dashboard']);
};
