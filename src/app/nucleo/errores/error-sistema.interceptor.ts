import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/** Texto único del FA "Error del sistema" de las especificaciones (RD-003); igual al de la API. */
export const MENSAJE_ERROR_SISTEMA = 'Ocurrió un error inesperado. Intente de nuevo más tarde.';

/**
 * Si la API no responde (status 0) o responde 5xx sin { codigo, mensaje }, el error se normaliza
 * con el mensaje del error del sistema; así las vistas que muestran `error.error?.mensaje` presentan
 * el mismo texto que la API en lugar de su mensaje de respaldo.
 */
export const errorSistemaInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      const sinRespuesta = error.status === 0 || error.status >= 500;
      const traeMensaje = typeof (error.error as { mensaje?: unknown } | null)?.mensaje === 'string';
      if (!sinRespuesta || traeMensaje) return throwError(() => error);
      return throwError(() => new HttpErrorResponse({
        error: { codigo: 'INTERNAL_ERROR', mensaje: MENSAJE_ERROR_SISTEMA },
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url ?? undefined,
      }));
    }),
  );
