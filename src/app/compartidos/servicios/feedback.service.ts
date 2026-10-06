import { Injectable, signal } from '@angular/core';

export type TipoFeedback = 'success' | 'error';

export interface FeedbackActual {
  tipo: TipoFeedback;
  titulo: string;
  mensaje: string;
}

export type DialogoActual =
  | { tipo: 'confirmar'; titulo: string; mensaje: string; confirmar: string }
  | { tipo: 'texto'; titulo: string; mensaje: string; etiqueta: string; valorInicial: string };

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  readonly actual = signal<FeedbackActual | null>(null);
  readonly dialogo = signal<DialogoActual | null>(null);
  private resolverDialogo: ((valor: boolean | string | null) => void) | null = null;

  exito(mensaje: string, titulo = 'Operación completada'): void {
    this.actual.set({ tipo: 'success', titulo, mensaje });
  }

  error(mensaje: string, titulo = 'No se pudo completar la operación'): void {
    this.actual.set({ tipo: 'error', titulo, mensaje });
  }

  confirmar(mensaje: string, titulo = 'Confirmar acción', confirmar = 'Confirmar'): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolverDialogo = (valor) => resolve(valor === true);
      this.dialogo.set({ tipo: 'confirmar', titulo, mensaje, confirmar });
    });
  }

  solicitarTexto(mensaje: string, valorInicial = '', etiqueta = 'Valor'): Promise<string | null> {
    return new Promise((resolve) => {
      this.resolverDialogo = (valor) => resolve(typeof valor === 'string' ? valor : null);
      this.dialogo.set({ tipo: 'texto', titulo: 'Complete la información', mensaje, etiqueta, valorInicial });
    });
  }

  responderDialogo(valor: boolean | string | null): void {
    const resolver = this.resolverDialogo;
    this.resolverDialogo = null;
    this.dialogo.set(null);
    resolver?.(valor);
  }

  cerrar(): void {
    this.actual.set(null);
  }
}
