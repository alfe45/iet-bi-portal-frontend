import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GruposProfesorService } from '../nucleo/datos/grupos-profesor.service';
import { FeedbackService } from '../compartidos/servicios/feedback.service';
import { ProfesorRegularApiService } from '../nucleo/api/profesor-regular-api.service';

// Mismos límites que el backend (RP-61): Brevo rechaza webp y odp.
const EXTENSIONES = ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt', 'xls', 'xlsx', 'ods', 'csv', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'zip'];
const MAX_ARCHIVOS = 10;
const MAX_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'app-vista-compartir-seccion',
  imports: [FormsModule],
  template: `
    <section class="share-page" aria-labelledby="share-title">
      <header class="surface page-header"><div><p class="eyebrow">Comunicación</p><h2 id="share-title">Compartir archivos con el grupo</h2><p>Adjunta archivos y envíalos por correo a los estudiantes de la sección del grupo seleccionado. Cada estudiante recibe su propio correo y, si responde, la respuesta te llega a ti.</p></div><div class="period"><small>Periodo activo</small><strong>{{ grupos.periodoActivo() }}</strong></div></header>
      <form class="surface share-form" (ngSubmit)="prepararEnvio()">
        <section class="group-block"><label>Grupo<select name="grupo" [ngModel]="selectedGroupId()" (ngModelChange)="cambiarGrupo($event)">@for (group of grupos.grupos(); track group.id) {<option [value]="group.id">{{ grupos.etiqueta(group) }}</option>}</select></label><div class="recipient-summary"><strong>{{ selectedCount() }} de {{ recipients().length }} estudiantes recibirán el correo</strong><span>Sección {{ currentGroup()?.seccion ?? '—' }} · sin estudiantes retirados</span><button type="button" class="link-button" (click)="showRecipients.set(!showRecipients())">{{ showRecipients() ? 'Ocultar destinatarios' : 'Elegir destinatarios' }}</button></div></section>
        @if (showRecipients()) {<div class="recipient-list" style="max-height: min(260px, 35vh); overflow-y: auto;" aria-label="Lista de destinatarios">@if (recipients().length) {<label class="recipient-all"><input type="checkbox" [checked]="allSelected()" (change)="seleccionarTodos($any($event.target).checked)" /> Todos los estudiantes</label>}@for (student of recipients(); track student.id) {<label class="recipient-row"><input type="checkbox" [checked]="selected().has(student.id)" (change)="alternar(student.id)" /><strong>{{ student['nombre'] }}</strong><span>{{ student['cedula'] }} · a su correo registrado</span></label>} @empty {<p>No hay estudiantes sin retiro en esta sección.</p>}</div>}
        <section class="file-section"><p class="field-title">Archivos <span class="optional">(hasta {{ maxArchivos }} y 10 MB en total)</span></p><div class="drop-zone" [class.drop-zone--selected]="files().length" (dragover)="$event.preventDefault()" (drop)="dropFiles($event)"><span class="upload-icon" aria-hidden="true">↑</span><strong>{{ files().length ? files().length + (files().length === 1 ? ' archivo seleccionado' : ' archivos seleccionados') + ' · ' + formatSize(totalBytes()) : 'Arrastra archivos aquí' }}</strong>@if (!files().length) {<span>o</span>}<button type="button" class="secondary-button" (click)="fileInput.click()">{{ files().length ? 'Agregar archivos' : 'Seleccionar archivos' }}</button>@for (file of files(); track $index) {<small>{{ file.name }} · {{ formatSize(file.size) }} <button type="button" class="remove-file" (click)="removeFile($index)">Quitar</button></small>}<small class="hint">Documentos, hojas de cálculo, presentaciones, imágenes (jpg, png, gif, bmp) y zip.</small></div><input #fileInput class="visually-hidden" type="file" multiple [accept]="accept" (change)="selectFiles($event); fileInput.value = ''" /></section>
        @if (fileError()) {<p class="file-error" role="alert">{{ fileError() }}</p>}
        <label>Asunto<input name="asunto" [(ngModel)]="subject" required maxlength="150" placeholder="Material de Historia - Semana 4" /></label>
        <label>Mensaje<textarea name="mensaje" rows="4" [(ngModel)]="body" required maxlength="5000" placeholder="Adjunto el material para la próxima clase."></textarea></label>
        <div class="actions"><button type="button" class="ghost-button" (click)="cancelar()">Cancelar</button><button type="submit" class="primary-button" [disabled]="!puedeEnviar()">{{ sending() ? 'Enviando…' : 'Enviar correo' }}</button></div>
      </form>
      @if (confirmationOpen()) {<div class="modal-backdrop" role="presentation"><section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><p class="eyebrow">Confirmar envío</p><h3 id="confirm-title">¿Enviar correo?</h3><p>Se enviará <strong>“{{ subject.trim() }}”</strong>{{ files().length ? ' con ' + files().length + (files().length === 1 ? ' archivo' : ' archivos') : ' sin archivos' }} a {{ selectedCount() }} {{ selectedCount() === 1 ? 'estudiante' : 'estudiantes' }} de la sección <strong>{{ currentGroup()?.seccion }}</strong>. El envío no se puede deshacer.</p><div class="actions"><button type="button" class="ghost-button" (click)="confirmationOpen.set(false)">Cancelar</button><button type="button" class="primary-button" [disabled]="sending()" (click)="confirmarEnvio()">Confirmar envío</button></div></section></div>}
    </section>
  `,
  styles: `
    .share-page{min-height:0;gap:.45rem}.page-header{padding:.5rem .85rem!important}.page-header h2{font-size:1.25rem}.page-header p:last-child{margin-top:.15rem;font-size:.78rem}.share-form{gap:.25rem!important;padding:.75rem 1rem!important}.share-form input,.share-form select{min-height:34px!important;padding:.35rem .6rem!important}.group-block{gap:.5rem}.recipient-summary{padding:.4rem .6rem}.drop-zone{padding:.35rem!important;gap:.15rem}.upload-icon{width:24px;height:24px;font-size:.85rem}.secondary-button{padding:.3rem .55rem}.recipient-list{max-height:70px;overflow:hidden;padding:.4rem .6rem}.share-form textarea{height:50px!important;min-height:0!important}
    .share-page{display:grid;gap:1rem;align-content:start}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-left:5px solid #2f6b9a}.page-header h2,.page-header p:last-child{margin:0}.page-header p:last-child{margin-top:.35rem;color:#667085}.eyebrow{margin:0 0 .25rem;color:#2f6b9a;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.period{display:grid;text-align:right}.period small{color:#667085}.period strong{color:#1b6f60}.share-form{display:grid;gap:1rem;width:min(100%,850px);margin:0 auto}.group-block{display:grid;grid-template-columns:minmax(220px,1fr) minmax(260px,1.2fr);gap:1rem;align-items:end}.share-form label{display:grid;gap:.35rem;font-weight:700}.recipient-summary{display:grid;gap:.2rem;padding:.7rem .8rem;border:1px solid #dbe5ef;border-radius:7px;background:#f2f7fa}.recipient-summary span{color:#667085;font-size:.85rem}.link-button{justify-self:start;padding:0;border:0;color:#1769aa;background:transparent;font-weight:700;cursor:pointer}.recipient-list{display:grid;gap:.4rem;padding:.7rem .8rem;border:1px solid #e6edf3;border-radius:7px}.share-form .recipient-row,.share-form .recipient-all{display:flex;align-items:center;gap:.6rem;padding:.35rem 0;font-weight:400}.share-form .recipient-all{font-weight:700;border-bottom:1px solid #e6edf3}.share-form .recipient-row input,.share-form .recipient-all input{min-height:0!important;width:auto}.recipient-row span{margin-left:auto;color:#667085;font-size:.85rem}.recipient-list p{margin:0;color:#667085}.file-section{display:grid;gap:.35rem}.field-title{margin:0;font-weight:700}.drop-zone{display:grid;justify-items:center;gap:.4rem;padding:1.7rem 1rem;border:2px dashed #9bc6e5;border-radius:9px;color:#475467;background:#f7fbfe;text-align:center}.drop-zone--selected{border-style:solid;border-color:#5ca6d5;background:#eef8fd}.upload-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;color:#fff;background:#1769aa;font-size:1.3rem;font-weight:700}.drop-zone>strong{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#1e3a5f}.drop-zone small{color:#667085}.drop-zone .hint{font-size:.72rem}.secondary-button{padding:.45rem .75rem;border:1px solid #b8d5e8;border-radius:5px;color:#1769aa;background:#fff;font-weight:700;cursor:pointer}.remove-file{margin-left:.4rem;padding:0;border:0;color:#b42318;background:transparent;font-weight:700;cursor:pointer}.file-error{margin:0;color:#b42318;font-size:.85rem;font-weight:700}.optional{color:#667085;font-size:.8rem;font-weight:400}.actions{display:flex;justify-content:flex-end;gap:.6rem}.actions button:disabled{cursor:not-allowed;opacity:.45}.message{margin:0;color:#1b6f60;font-weight:700}.modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:1rem;background:rgba(13,25,39,.52)}.confirm-modal{width:min(100%,500px);padding:1.3rem;border-radius:10px;background:#fff;box-shadow:0 20px 60px rgba(4,26,55,.3)}.confirm-modal h3{margin:.1rem 0 .7rem;color:#1e3a5f}.confirm-modal>p:not(.eyebrow){color:#475467;line-height:1.5}.confirm-modal .actions{margin-top:1.2rem}@media(max-width:650px){.page-header{align-items:flex-start;flex-direction:column}.period{text-align:left}.group-block{grid-template-columns:1fr}.recipient-row{flex-wrap:wrap}.recipient-row span{margin-left:0}.actions{flex-direction:column}.actions button{width:100%}}
  `,
})
// Profesor Regular CU12: envía archivos por correo a los estudiantes de la sección del grupo (RN-92).
export class CompartirSeccionVistaComponent {
  protected readonly grupos = inject(GruposProfesorService);
  private readonly feedback = inject(FeedbackService);
  private readonly api = inject(ProfesorRegularApiService);
  protected readonly maxArchivos = MAX_ARCHIVOS;
  protected readonly accept = EXTENSIONES.map((extension) => '.' + extension).join(',');
  protected readonly selectedGroupId = signal(this.grupos.grupoActual()?.id ?? '');
  protected readonly currentGroup = computed(() => this.grupos.grupos().find((group) => group.id === this.selectedGroupId()) ?? this.grupos.grupoActual());
  // El backend solo envía a estudiantes sin retiro.
  protected readonly recipients = computed(() => (this.currentGroup()?.estudiantes ?? []).filter((student) => student['estado'] !== 'RETIRADA'));
  // Cédulas desmarcadas: así todo estudiante nuevo del grupo queda marcado por defecto.
  private readonly excluded = signal(new Set<string>());
  protected readonly selected = computed(() => new Set(this.recipients().map((student) => student.id).filter((id) => !this.excluded().has(id))));
  protected readonly selectedCount = computed(() => this.selected().size);
  protected readonly allSelected = computed(() => this.selectedCount() === this.recipients().length);
  protected readonly showRecipients = signal(false);
  protected readonly confirmationOpen = signal(false);
  protected readonly sending = signal(false);
  protected readonly files = signal<File[]>([]);
  protected readonly totalBytes = computed(() => this.files().reduce((total, file) => total + file.size, 0));
  protected readonly fileError = computed(() => this.validarArchivos(this.files()));
  protected subject = '';
  protected body = '';

  protected puedeEnviar(): boolean {
    const asunto = this.subject.trim();
    return !this.sending() && !this.fileError() && this.selectedCount() > 0 && asunto.length >= 3 && !/[\r\n]/.test(asunto) && this.body.trim().length > 0;
  }

  protected cambiarGrupo(id: string): void { this.selectedGroupId.set(id); this.grupos.seleccionar(id); this.excluded.set(new Set()); this.showRecipients.set(false); }
  protected alternar(id: string): void { this.excluded.update((set) => { const next = new Set(set); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  protected seleccionarTodos(todos: boolean): void { this.excluded.set(todos ? new Set() : new Set(this.recipients().map((student) => student.id))); }
  protected selectFiles(event: Event): void { this.agregar(Array.from((event.target as HTMLInputElement).files ?? [])); }
  protected dropFiles(event: DragEvent): void { event.preventDefault(); this.agregar(Array.from(event.dataTransfer?.files ?? [])); }
  protected removeFile(index: number): void { this.files.update((files) => files.filter((_, i) => i !== index)); }
  protected cancelar(): void { this.confirmationOpen.set(false); this.files.set([]); this.excluded.set(new Set()); this.subject = ''; this.body = ''; }
  protected prepararEnvio(): void { if (this.puedeEnviar()) this.confirmationOpen.set(true); }

  protected confirmarEnvio(): void {
    const group = this.currentGroup();
    if (!group?.anio || !group.nivel || !group.numero) { this.confirmationOpen.set(false); this.feedback.error('No se pudo identificar la sección del grupo seleccionado.'); return; }
    // Todos marcados: sin cédulas, el backend envía a todos los estudiantes sin retiro.
    const cedulas = this.allSelected() ? [] : [...this.selected()];
    this.sending.set(true);
    this.api.enviarCorreo(group.anio, group.nivel, group.numero, { asunto: this.subject.trim(), mensaje: this.body.trim(), cedulas, adjuntos: this.files() }).subscribe({
      next: (resultado) => {
        this.sending.set(false);
        this.confirmationOpen.set(false);
        const enviados = `Se envió el correo a ${resultado.enviados.length} ${resultado.enviados.length === 1 ? 'estudiante' : 'estudiantes'} de la sección ${resultado.seccion}.`;
        if (resultado.fallidos.length) this.feedback.error(`${enviados} No se pudo enviar a: ${resultado.fallidos.map((student) => student.nombre).join(', ')}.`, 'Envío incompleto');
        else this.feedback.exito(enviados, 'Correo enviado');
        this.cancelar();
      },
      error: (error) => {
        this.sending.set(false);
        this.confirmationOpen.set(false);
        this.feedback.error(error.status === 413 ? 'Los archivos superan el tamaño máximo permitido (10 MB en total).' : error.error?.mensaje ?? 'No se pudo enviar el correo.');
      },
    });
  }

  protected formatSize(bytes: number): string { if (!bytes) return '0 B'; const units = ['B', 'KB', 'MB', 'GB']; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`; }

  private agregar(nuevos: File[]): void { if (nuevos.length) this.files.update((files) => [...files, ...nuevos]); }

  // Aviso inmediato con los mismos límites del backend (CO001 / CO002); el backend vuelve a validar.
  private validarArchivos(files: File[]): string {
    const invalido = files.find((file) => !file.name.includes('.') || !EXTENSIONES.includes(file.name.split('.').pop()?.toLowerCase() ?? ''));
    if (invalido) return `“${invalido.name}” no es un tipo de archivo permitido.`;
    if (files.some((file) => file.size === 0)) return 'No se pueden enviar archivos vacíos.';
    if (files.length > MAX_ARCHIVOS) return `Puedes adjuntar como máximo ${MAX_ARCHIVOS} archivos.`;
    if (files.reduce((total, file) => total + file.size, 0) > MAX_BYTES) return 'Los archivos superan 10 MB en total.';
    return '';
  }
}
