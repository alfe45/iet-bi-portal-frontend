import { ErrorHandler, Injectable, inject } from '@angular/core';
import { FeedbackService } from '../../compartidos/servicios/feedback.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly feedback = inject(FeedbackService);

  handleError(error: unknown): void {
    console.error(error);
    if (this.feedback.actual()) return;
    // El detalle técnico queda en la consola; al usuario solo se le muestra un mensaje general.
    this.feedback.error('Ocurrió un error inesperado. Intente nuevamente. Si el problema continúa, contacte al administrador.', 'Ocurrió un error inesperado');
  }
}
