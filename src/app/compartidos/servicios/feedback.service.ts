import { Injectable, signal } from '@angular/core';

export type TipoFeedback = 'success' | 'error';

export interface FeedbackActual {
  tipo: TipoFeedback;
  titulo: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  readonly actual = signal<FeedbackActual | null>(null);

  exito(mensaje: string, titulo = 'Operación completada'): void {
    this.actual.set({ tipo: 'success', titulo, mensaje });
  }

  error(mensaje: string, titulo = 'No se pudo completar la operación'): void {
    this.actual.set({ tipo: 'error', titulo, mensaje });
  }

  cerrar(): void {
    this.actual.set(null);
  }
}
