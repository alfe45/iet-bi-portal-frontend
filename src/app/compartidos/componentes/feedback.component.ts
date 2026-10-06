import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../servicios/feedback.service';

@Component({
  selector: 'app-feedback',
  imports: [FormsModule],
  template: `
    @if (feedback.dialogo(); as dialogo) {
      <div class="feedback-backdrop" role="presentation">
        <section class="feedback-dialog feedback-dialog--action" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-message">
          <span class="feedback-icon feedback-icon-error" aria-hidden="true">?</span>
          <h2 id="dialog-title">{{ dialogo.titulo }}</h2>
          <p id="dialog-message">{{ dialogo.mensaje }}</p>
          @if (dialogo.tipo === 'texto') {
            <label class="dialog-input"><span>{{ dialogo.etiqueta }}</span><input type="text" [(ngModel)]="dialogo.valorInicial" /></label>
            <div class="dialog-actions"><button type="button" class="ghost-button" (click)="feedback.responderDialogo(null)">Cancelar</button><button type="button" class="primary-button" (click)="feedback.responderDialogo(dialogo.valorInicial)">Continuar</button></div>
          } @else {
            <div class="dialog-actions"><button type="button" class="ghost-button" (click)="feedback.responderDialogo(false)">Cancelar</button><button type="button" class="danger-button" (click)="feedback.responderDialogo(true)">{{ dialogo.confirmar }}</button></div>
          }
        </section>
      </div>
    }
    @if (feedback.actual(); as actual) {
      @if (actual.tipo === 'error') {
        <div class="feedback-backdrop" role="presentation">
          <section class="feedback-dialog" role="alertdialog" aria-modal="true" aria-labelledby="feedback-title" aria-describedby="feedback-message">
            <span class="feedback-icon feedback-icon-error" aria-hidden="true">!</span>
            <h2 id="feedback-title">{{ actual.titulo }}</h2>
            <p id="feedback-message">{{ actual.mensaje }}</p>
            <button type="button" class="primary-button" (click)="feedback.cerrar()">Aceptar</button>
          </section>
        </div>
      } @else {
        <div class="feedback-toast" role="status" aria-live="polite">
          <span class="feedback-icon feedback-icon-success" aria-hidden="true">&#10003;</span>
          <div><strong>{{ actual.titulo }}</strong><span>{{ actual.mensaje }}</span></div>
          <button type="button" class="feedback-close" aria-label="Cerrar notificación" (click)="feedback.cerrar()">×</button>
        </div>
      }
    }
  `,
  styles: `
     :host { position: fixed; top: 0; left: 0; z-index: 2000; width: 100%; height: 0; pointer-events: none; }
     .feedback-backdrop { position: fixed; inset: 0; z-index: 2000; display: grid; place-items: center; padding: 1rem; background: rgba(10, 28, 52, .34); backdrop-filter: blur(8px); pointer-events: auto; }
     .feedback-dialog { display: grid; justify-items: center; gap: .65rem; width: min(100%, 360px); padding: 2rem 1.5rem; border: 1px solid rgba(255,255,255,.7); border-radius: 16px; background: rgba(255,255,255,.96); box-shadow: 0 20px 60px rgba(4,26,55,.3); color: #29344a; text-align: center; user-select: none; cursor: default; }
    .feedback-dialog h2 { margin: 0; font-size: 1.05rem; }
     .feedback-dialog p { margin: 0 0 .5rem; color: #667085; font-size: .85rem; }
     .feedback-dialog--action { gap: .8rem; }
     .dialog-input { display: grid; gap: .3rem; width: 100%; color: #475467; font-size: .78rem; font-weight: 700; text-align: left; }
     .dialog-input input { width: 100%; box-sizing: border-box; user-select: text; cursor: text; }
     .dialog-actions { display: flex; gap: .6rem; width: 100%; margin-top: .25rem; }
     .dialog-actions > button { flex: 1 1 0; cursor: pointer; }
    .feedback-icon { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 50%; font-weight: 800; }
    .feedback-icon-error { background: #fff0f1; color: #b42318; }
    .feedback-icon-success { background: #e8f8f2; color: #13775f; }
     .feedback-toast { position: fixed; top: 1rem; right: 1rem; z-index: 2000; display: flex; align-items: center; gap: .7rem; width: min(100% - 2rem, 390px); padding: .9rem 1rem; border: 1px solid #b7e3d3; border-radius: 10px; background: #f2fcf8; box-shadow: 0 12px 30px rgba(4,26,55,.16); color: #164c40; pointer-events: auto; }
    .feedback-toast div { display: grid; gap: .15rem; flex: 1; }
    .feedback-toast span { color: #35675d; font-size: .8rem; }
    .feedback-close { border: 0; background: transparent; color: #35675d; font-size: 1.2rem; cursor: pointer; }
  `,
})
export class FeedbackComponent {
  protected readonly feedback = inject(FeedbackService);
}
