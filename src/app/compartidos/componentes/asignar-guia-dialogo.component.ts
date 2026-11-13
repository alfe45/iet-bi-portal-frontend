import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SeccionApi, SeccionesApiService } from '../../nucleo/api/secciones-api.service';
import { ProfesoresApiService } from '../../nucleo/api/profesores-api.service';
import { CursosLectivosApiService } from '../../nucleo/api/cursos-lectivos-api.service';
import { FeedbackService } from '../servicios/feedback.service';

export interface SeccionGuia { anio: number; nivel: number; numero: number }

interface ProfesorGuia { cedula: string; nombre: string; activo: boolean; roles: string[] }

// Administrador CU16: asignar o cambiar el profesor guía de una sección. Se usa en «Asignación de guías» y en «Secciones».
// Con `seccion` la sección viene dada (fila elegida); sin ella se elige entre las secciones que aún no tienen guía.
// Profesores elegibles: cuenta activa con el rol Profesor Guía y sin otra sección guía en el mismo año; en un curso
// lectivo finalizado (digitalización) no se exige el rol (RN-37). Las reglas las vuelve a validar la API.
@Component({
  selector: 'app-asignar-guia-dialogo',
  imports: [FormsModule],
  template: `
    <div class="guia-backdrop" role="presentation">
      <form class="guia-dialogo" role="dialog" aria-modal="true" aria-labelledby="guia-dialogo-titulo" (ngSubmit)="guardar()" novalidate>
        <div class="guia-head">
          <div><p class="guia-kicker">Profesor guía</p><h3 id="guia-dialogo-titulo">{{ guiaActual() ? 'Cambiar profesor guía' : 'Asignar profesor guía' }}</h3></div>
          <button type="button" class="guia-close" aria-label="Cerrar" (click)="cerrar.emit()">×</button>
        </div>

        @if (seccion(); as s) {
          <p class="guia-seccion">Sección <strong>{{ s.nivel }}-{{ s.numero }}</strong> · Curso lectivo {{ s.anio }}</p>
          @if (guiaActual()) { <p class="guia-actual">Guía actual: <strong>{{ guiaActual() }}</strong></p> }
        } @else {
          <label>Sección
            <select name="seccion" [(ngModel)]="seccionElegida" (ngModelChange)="cambiarSeccion()" required>
              <option value="">Seleccione una sección</option>
              @for (s of seccionesSinGuia(); track s.idSeccion) { <option [value]="clave(s)">{{ s.nombre }} · {{ s.anio }}</option> }
            </select>
          </label>
        }

        <label>Profesor
          <select name="profesor" [(ngModel)]="cedula" required [disabled]="!claveActual()">
            <option value="">Seleccione un profesor</option>
            @for (p of elegibles(); track p.cedula) { <option [value]="p.cedula">{{ p.nombre }}</option> }
          </select>
          @if (claveActual() && cargado() && !elegibles().length) { <small class="guia-hint">No hay profesores con el rol Profesor Guía disponibles en este curso lectivo.</small> }
        </label>

        <div class="guia-actions">
          <button type="button" class="ghost-button" (click)="cerrar.emit()">Cancelar</button>
          <button type="submit" class="primary-button" [disabled]="!cedula || !claveActual() || guardando()">Guardar</button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .guia-backdrop { position: fixed; inset: 0; z-index: 1100; display: grid; place-items: center; padding: 1rem; background: rgba(13,25,39,.52); }
    .guia-dialogo { display: grid; gap: .9rem; width: min(100%, 440px); padding: 1.3rem; border-top: 5px solid #c58b31; border-radius: 14px; background: #fff; box-shadow: 0 24px 70px rgba(18,32,49,.28); }
    .guia-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .guia-head h3 { margin: 0; color: #29344a; font-size: 1.2rem; }
    .guia-kicker { margin: 0 0 .2rem; color: #b87918; font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; }
    .guia-close { width: 32px; height: 32px; border: 0; border-radius: 50%; background: #f2f5f7; color: #667085; font-size: 1.25rem; cursor: pointer; }
    .guia-seccion { margin: 0; padding: .6rem .75rem; border-radius: 8px; background: #fff8ea; color: #5c4210; }
    .guia-actual { margin: 0; color: #667085; font-size: .85rem; }
    label { display: grid; gap: .35rem; color: #29344a; font-weight: 700; font-size: .85rem; }
    .guia-hint { color: #b42318; font-weight: 600; }
    .guia-actions { display: flex; justify-content: flex-end; gap: .6rem; }
    @media (max-width: 600px), (pointer: coarse) and (max-width: 1024px), (max-height: 520px) and (pointer: coarse) { .guia-backdrop { display: flex; flex-direction: column; overflow-y: auto; inset: 0 0 auto 0; height: 100vh; height: 100dvh; padding: .5rem .5rem calc(.5rem + env(safe-area-inset-bottom)); } .guia-backdrop::after { content: ''; flex: 0 0 4.5rem; } .guia-dialogo { margin: auto; flex: 0 0 auto; max-width: 100%; } .guia-actions { position: sticky; bottom: -.5rem; padding: .75rem 0 calc(.75rem + env(safe-area-inset-bottom)); background: #fff; } .guia-actions > button { flex: 1 1 8rem; } }
  `,
})
export class AsignarGuiaDialogoComponent {
  private readonly seccionesApi = inject(SeccionesApiService);
  private readonly profesoresApi = inject(ProfesoresApiService);
  private readonly cursosApi = inject(CursosLectivosApiService);
  private readonly feedback = inject(FeedbackService);

  readonly seccion = input<SeccionGuia | null>(null);
  readonly cerrar = output<void>();
  readonly guardado = output<void>();

  private readonly secciones = signal<SeccionApi[]>([]);
  private readonly profesores = signal<ProfesorGuia[]>([]);
  private readonly estados = signal<Record<number, string>>({});
  protected readonly cargado = signal(false);
  protected readonly guardando = signal(false);
  private readonly elegida = signal('');
  protected cedula = '';

  protected get seccionElegida(): string { return this.elegida(); }
  protected set seccionElegida(valor: string) { this.elegida.set(valor); }

  protected readonly seccionesSinGuia = computed(() => this.secciones().filter((s) => !s.cedulaGuia));
  protected readonly claveActual = computed(() => {
    const s = this.seccion();
    return s ? `${s.anio}-${s.nivel}-${s.numero}` : this.elegida();
  });
  private readonly seccionActual = computed(() => this.secciones().find((s) => this.clave(s) === this.claveActual()));
  protected readonly guiaActual = computed(() => this.seccionActual()?.nombreGuia ?? '');
  protected readonly elegibles = computed(() => {
    const clave = this.claveActual();
    if (!clave) return [];
    const anio = Number(clave.split('-')[0]);
    const finalizado = this.estados()[anio] === 'FINALIZADO';
    const ocupados = new Set(this.secciones().filter((s) => s.anio === anio && s.cedulaGuia && this.clave(s) !== clave).map((s) => s.cedulaGuia));
    const actual = this.seccionActual()?.cedulaGuia;
    return this.profesores()
      .filter((p) => finalizado || (p.activo && p.roles.includes('GUIA')))
      .filter((p) => !ocupados.has(p.cedula) && p.cedula !== actual);
  });

  constructor() {
    this.seccionesApi.listarPaginado({ pagina: 1, tamanoPagina: 100 }).subscribe({
      next: (r) => this.secciones.set(r.elementos),
      error: () => this.feedback.error('No se pudieron cargar las secciones.'),
    });
    this.cursosApi.listarPaginado(1, 100).subscribe({ next: (r) => this.estados.set(Object.fromEntries(r.elementos.map((c) => [c.anio, c.estado]))) });
    this.profesoresApi.listarPaginado('', 1, 100).subscribe({
      next: (r) => { this.profesores.set(r.elementos.map((p) => ({ cedula: p.cedula, activo: p.activo, roles: p.roles ?? [], nombre: [p.nombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(' ') }))); this.cargado.set(true); },
      error: () => this.feedback.error('No se pudieron cargar los profesores disponibles.'),
    });
  }

  protected clave(s: SeccionApi): string { return `${s.anio}-${s.nivel}-${s.numero}`; }

  // Si el profesor elegido no sirve para la nueva sección, se quita la selección.
  protected cambiarSeccion(): void {
    if (this.cedula && !this.elegibles().some((p) => p.cedula === this.cedula)) this.cedula = '';
  }

  protected guardar(): void {
    const clave = this.claveActual();
    if (!this.cedula || !clave || this.guardando()) return;
    const [anio, nivel, numero] = clave.split('-').map(Number);
    this.guardando.set(true);
    this.seccionesApi.asignarGuia(anio, nivel, numero, this.cedula).subscribe({
      next: () => { this.guardando.set(false); this.feedback.exito('El profesor guía fue asignado.'); this.guardado.emit(); },
      error: (error: { status?: number; error?: { mensaje?: string } }) => {
        this.guardando.set(false);
        this.feedback.error(error.error?.mensaje ?? 'No se pudo asignar el profesor guía.');
        // RV2 ADM16 FA4: si la sección o el profesor ya no existen, se cierra la ventana y se actualiza el listado.
        if (error.status === 404) this.guardado.emit();
      },
    });
  }
}
