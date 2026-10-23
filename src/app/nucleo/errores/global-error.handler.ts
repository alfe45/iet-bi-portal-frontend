import { ErrorHandler, Injectable, inject } from '@angular/core';
import { FeedbackService } from '../../compartidos/servicios/feedback.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly feedback = inject(FeedbackService);

  handleError(error: unknown): void {
    console.error(error);
    if (this.feedback.actual()) return;
    const mensaje = error instanceof Error && error.message.trim()
      ? error.message
      : 'Ocurrió un error inesperado. Intente nuevamente. Si el problema continúa, contacte al administrador.';
    this.feedback.error(mensaje, 'Ocurrió un error inesperado');
  }
}
