import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, catchError, switchMap, throwError } from 'rxjs';
import { AutenticacionService } from './autenticacion.service';

export const autenticacionInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AutenticacionService);
  const esAuth = request.url.includes('/api/auth/') || request.url.includes('/api/setup/');
  const conToken = auth.accessTokenValue();
  const requestAutorizada = conToken && !esAuth
    ? request.clone({ setHeaders: { Authorization: `Bearer ${conToken}` } })
    : request;

  return next(requestAutorizada).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || esAuth) return throwError(() => error);
      if (!auth.refreshTokenValue()) {
        auth.expirarSesion();
        return EMPTY;
      }
      return auth.renovarAccessToken().pipe(
        switchMap((token) => next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
        catchError(() => {
          auth.expirarSesion();
          return EMPTY;
        }),
      );
    }),
  );
};
