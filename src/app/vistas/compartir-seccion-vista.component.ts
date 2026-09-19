import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';

@Component({
  selector: 'app-vista-compartir-seccion',
  imports: [FormsModule],
  template: `
    <section class="share-page" aria-labelledby="share-title">
      <header class="surface page-header"><div><p class="eyebrow">Comunicación</p><h2 id="share-title">Compartir archivo con el grupo</h2><p>Adjunta un archivo y envíalo por correo a los estudiantes del grupo seleccionado.</p></div><div class="period"><small>Periodo activo</small><strong>{{ grupos.periodoActivo() }}</strong></div></header>
      <form class="surface share-form" (ngSubmit)="prepararEnvio()">
        <section class="group-block"><label>Grupo<select name="grupo" [ngModel]="selectedGroupId()" (ngModelChange)="cambiarGrupo($event)">@for (group of grupos.grupos(); track group.id) {<option [value]="group.id">{{ grupos.etiqueta(group) }}</option>}</select></label><div class="recipient-summary"><strong>{{ recipients().length }} estudiantes recibirán el archivo</strong><span>{{ grupos.etiqueta(currentGroup()) }}</span><button type="button" class="link-button" (click)="showRecipients.set(!showRecipients())">{{ showRecipients() ? 'Ocultar destinatarios' : 'Ver destinatarios' }}</button></div></section>
        @if (showRecipients()) {<div class="recipient-list">@for (student of recipients(); track student.id) {<div><strong>{{ student['nombre'] }}</strong><span>{{ student['correo'] }}</span></div>} @empty {<p>No hay destinatarios en este grupo.</p>}</div>}
        <section class="file-section"><p class="field-title">Archivo</p><div class="drop-zone" [class.drop-zone--selected]="fileName()" (dragover)="$event.preventDefault()" (drop)="dropFile($event)"><span class="upload-icon" aria-hidden="true">↑</span><strong>{{ fileName() || 'Arrastra un archivo aquí' }}</strong>@if (!fileName()) {<span>o</span>}<button type="button" class="secondary-button" (click)="fileInput.click()">{{ fileName() ? 'Cambiar archivo' : 'Seleccionar archivo' }}</button>@if (fileName()) {<small>{{ fileSize() }} · {{ fileType() }} <button type="button" class="remove-file" (click)="removeFile()">Quitar</button></small>}</div><input #fileInput class="visually-hidden" type="file" (change)="selectFile($event)" /></section>
        <label>Asunto<input name="asunto" [(ngModel)]="subject" required placeholder="Material de Historia - Semana 4" /></label>
        <label>Mensaje <span class="optional">(opcional)</span><textarea name="mensaje" rows="4" [(ngModel)]="body" placeholder="Adjunto el material para la próxima clase."></textarea></label>
        @if (message) {<p class="message" role="status">{{ message }}</p>}
        <div class="actions"><button type="button" class="ghost-button">Cancelar</button><button type="submit" class="primary-button" [disabled]="!fileName() || !subject.trim()">Enviar archivo</button></div>
      </form>
      @if (confirmationOpen()) {<div class="modal-backdrop" role="presentation"><section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><p class="eyebrow">Confirmar envío</p><h3 id="confirm-title">¿Enviar archivo?</h3><p>Se enviará <strong>“{{ fileName() }}”</strong> a {{ recipients().length }} estudiantes de <strong>{{ grupos.etiqueta(currentGroup()) }}</strong>.</p><div class="actions"><button type="button" class="ghost-button" (click)="confirmationOpen.set(false)">Cancelar</button><button type="button" class="primary-button" (click)="confirmarEnvio()">Confirmar envío</button></div></section></div>}
    </section>
  `,
  styles: `
    .share-page{min-height:0;gap:.45rem}.page-header{padding:.5rem .85rem!important}.page-header h2{font-size:1.25rem}.page-header p:last-child{margin-top:.15rem;font-size:.78rem}.share-form{gap:.25rem!important;padding:.75rem 1rem!important}.share-form input,.share-form select{min-height:34px!important;padding:.35rem .6rem!important}.group-block{gap:.5rem}.recipient-summary{padding:.4rem .6rem}.drop-zone{padding:.35rem!important;gap:.15rem}.upload-icon{width:24px;height:24px;font-size:.85rem}.secondary-button{padding:.3rem .55rem}.recipient-list{max-height:70px;overflow:hidden;padding:.4rem .6rem}.share-form textarea{height:50px!important;min-height:0!important}
    .share-page{display:grid;gap:1rem;align-content:start}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.page-header h2,.page-header p:last-child{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.period{display:grid;text-align:right}.period small{color:#667085}.period strong{color:#238d78}.share-form{display:grid;gap:1rem;width:min(100%,850px);margin:0 auto}.group-block{display:grid;grid-template-columns:minmax(220px,1fr) minmax(260px,1.2fr);gap:1rem;align-items:end}.share-form label{display:grid;gap:.35rem;font-weight:700}.recipient-summary{display:grid;gap:.2rem;padding:.7rem .8rem;border:1px solid #dbe5ef;border-radius:7px;background:#f2f7fa}.recipient-summary span{color:#667085;font-size:.85rem}.link-button{justify-self:start;padding:0;border:0;color:#1769aa;background:transparent;font-weight:700;cursor:pointer}.recipient-list{display:grid;gap:.4rem;padding:.7rem .8rem;border:1px solid #e6edf3;border-radius:7px}.recipient-list>div{display:flex;justify-content:space-between;gap:1rem;padding:.35rem 0}.recipient-list span{color:#667085;font-size:.85rem}.recipient-list p{margin:0;color:#667085}.file-section{display:grid;gap:.35rem}.field-title{margin:0;font-weight:700}.drop-zone{display:grid;justify-items:center;gap:.4rem;padding:1.7rem 1rem;border:2px dashed #9bc6e5;border-radius:9px;color:#475467;background:#f7fbfe;text-align:center}.drop-zone--selected{border-style:solid;border-color:#5ca6d5;background:#eef8fd}.upload-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;color:#fff;background:#1769aa;font-size:1.3rem;font-weight:700}.drop-zone>strong{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#1e3a5f}.drop-zone small{color:#667085}.secondary-button{padding:.45rem .75rem;border:1px solid #b8d5e8;border-radius:5px;color:#1769aa;background:#fff;font-weight:700;cursor:pointer}.remove-file{margin-left:.4rem;padding:0;border:0;color:#b42318;background:transparent;font-weight:700;cursor:pointer}.optional{color:#667085;font-size:.8rem;font-weight:400}.actions{display:flex;justify-content:flex-end;gap:.6rem}.actions button:disabled{cursor:not-allowed;opacity:.45}.message{margin:0;color:#238d78;font-weight:700}.modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:1rem;background:rgba(13,25,39,.52)}.confirm-modal{width:min(100%,500px);padding:1.3rem;border-radius:10px;background:#fff;box-shadow:0 20px 60px rgba(4,26,55,.3)}.confirm-modal h3{margin:.1rem 0 .7rem;color:#1e3a5f}.confirm-modal>p:not(.eyebrow){color:#475467;line-height:1.5}.confirm-modal .actions{margin-top:1.2rem}@media(max-width:650px){.page-header{align-items:flex-start;flex-direction:column}.period{text-align:left}.group-block{grid-template-columns:1fr}.recipient-list>div{align-items:flex-start;flex-direction:column}.actions{flex-direction:column}.actions button{width:100%}}
  `,
})
// Permite compartir información de una sección.
export class CompartirSeccionVistaComponent {
  protected readonly grupos = inject(GruposProfesorService);
  protected readonly selectedGroupId = signal(this.grupos.grupoActual()?.id ?? '');
  protected readonly currentGroup = computed(() => this.grupos.grupos().find((group) => group.id === this.selectedGroupId()) ?? this.grupos.grupoActual());
  protected readonly recipients = computed(() => this.currentGroup()?.estudiantes ?? []);
  protected readonly showRecipients = signal(false);
  protected readonly confirmationOpen = signal(false);
  protected readonly fileName = signal('');
  protected readonly fileSize = signal('');
  protected readonly fileType = signal('');
  protected subject = '';
  protected body = '';
  protected message = '';

  protected cambiarGrupo(id: string): void { this.selectedGroupId.set(id); this.grupos.seleccionar(id); this.showRecipients.set(false); }
  protected selectFile(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; if (file) this.setFile(file); }
  protected dropFile(event: DragEvent): void { event.preventDefault(); const file = event.dataTransfer?.files?.[0]; if (file) this.setFile(file); }
  protected removeFile(): void { this.fileName.set(''); this.fileSize.set(''); this.fileType.set(''); }
  protected prepararEnvio(): void { if (this.fileName() && this.subject.trim()) this.confirmationOpen.set(true); }
  protected confirmarEnvio(): void { this.confirmationOpen.set(false); this.message = `Archivo enviado correctamente a ${this.recipients().length} estudiantes.`; }
  private setFile(file: File): void { this.fileName.set(file.name); this.fileSize.set(this.formatSize(file.size)); this.fileType.set(file.type || 'Tipo no disponible'); }
  private formatSize(bytes: number): string { if (!bytes) return '0 B'; const units = ['B', 'KB', 'MB', 'GB']; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`; }
}
