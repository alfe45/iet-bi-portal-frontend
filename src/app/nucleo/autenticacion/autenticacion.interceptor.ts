import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, catchError, switchMap, throwError } from 'rxjs';
import { AutenticacionService } from './autenticacion.service';
import { FeedbackService } from '../../compartidos/servicios/feedback.service';

let avisoCierreSesionEnCurso = false;

function cerrarSesionConAviso(auth: AutenticacionService, feedback: FeedbackService, mensaje: string): void {
  if (auth.estaCerrandoSesion()) return;
  if (avisoCierreSesionEnCurso) return;
  avisoCierreSesionEnCurso = true;
   void feedback.aviso(mensaje, 'Sesión finalizada', 'Aceptar')
    .then(() => auth.expirarSesion())
    .finally(() => { avisoCierreSesionEnCurso = false; });
}

export const autenticacionInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AutenticacionService);
  const feedback = inject(FeedbackService);
  const esAuth = request.url.includes('/api/auth/') || request.url.includes('/api/setup/');
  const conToken = auth.accessTokenValue();
  const usuario = auth.currentUsername();
  const requestAutorizada = conToken && !esAuth
    ? request.clone({ setHeaders: { Authorization: `Bearer ${conToken}` } })
    : request;

  return next(requestAutorizada).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || esAuth) return throwError(() => error);
      // Al cerrar sesión pueden terminar peticiones de la vista anterior con 401.
      // Es una transición intencional, no una sesión expirada que deba notificarse.
      // Tampoco se debe notificar una petición de un rol anterior después de un nuevo login.
      if (auth.estaCerrandoSesion()) return EMPTY;
      // RD-005: una petición que salió sin sesión (p. ej. de la vista que se destruye tras
      // "Cerrar sesión") no es una sesión expirada y no debe mostrar "Sesión finalizada".
      if (!conToken) return EMPTY;
      if (auth.accessTokenValue() !== conToken) {
        // Otra pestaña renovó mientras la petición viajaba: se repite con el token vigente (RD-053).
        const vigente = auth.accessTokenValue();
        if (vigente && usuario && auth.currentUsername() === usuario) {
          return next(request.clone({ setHeaders: { Authorization: `Bearer ${vigente}` } }));
        }
        return EMPTY;
      }
      if (!auth.refreshTokenValue()) {
        cerrarSesionConAviso(auth, feedback, 'La sesión ya no está disponible. Por seguridad, debe volver a iniciar sesión para continuar.');
        return EMPTY;
      }
      return auth.renovarAccessToken().pipe(
        switchMap((token) => next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
        catchError(() => {
          if (auth.estaCerrandoSesion() || auth.accessTokenValue() !== conToken) return EMPTY;
          cerrarSesionConAviso(auth, feedback, 'No pudimos mantener su sesión activa. Por seguridad, debe volver a iniciar sesión para continuar.');
          return EMPTY;
        }),
      );
    }),
  );
};
