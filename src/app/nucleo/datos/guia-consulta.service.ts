import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AutenticacionService } from '../autenticacion/autenticacion.service';
import { ConsultaSemestreGuia, PeriodoGuiaApi, ProfesorGuiaApiService, SeccionGuiaApi } from '../api/profesor-guia-api.service';
import { etiquetaSemestre } from './profesor-regular-context.service';
import { hoyCostaRica } from '../../compartidos/utilidades/fechas';

/**
 * Criterios compartidos por las vistas del Profesor Guía (CU01 a CU10): curso lectivo, sección guía y semestre.
 * RD-054: el año se elige (la API acepta ?anio); RD-004: sin periodo en curso (404 NF005) se informa y se puede elegir
 * otro año; RD-043: un error no se presenta como "sin sección guía".
 */
@Injectable({ providedIn: 'root' })
export class GuiaConsultaService {
  private readonly auth = inject(AutenticacionService);
  private readonly api = inject(ProfesorGuiaApiService);
  private readonly periodo = signal<PeriodoGuiaApi | null>(null);
  private generacion = 0;
  private iniciado = false;

  readonly anio = signal<number | null>(null);
  readonly semestre = signal('I_SEMESTRE');
  readonly secciones = signal<SeccionGuiaApi[]>([]);
  private readonly seleccion = signal('');
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly sinPeriodo = signal(false);

  readonly seccionActual = computed(() => this.secciones().find((item) => this.clave(item) === this.seleccion()) ?? this.secciones()[0]);
  readonly aniosDisponibles = computed(() => {
    const base = this.periodo()?.anio ?? Number(hoyCostaRica().slice(0, 4));
    // El guía puede tener asignada la sección del año siguiente (se asigna antes de iniciar el curso).
    return [base + 1, base, base - 1, base - 2, base - 3];
  });
  readonly etiqueta = computed(() => {
    const anio = this.anio();
    if (!anio) return this.sinPeriodo() ? 'No hay un periodo académico en curso' : this.cargando() ? 'Cargando…' : 'No disponible';
    return `${etiquetaSemestre(this.semestre())} ${anio}`;
  });
  readonly mensajeSinSeccion = computed(() => {
    if (this.error()) return this.error();
    if (this.cargando()) return 'Cargando sección guía…';
    if (!this.anio()) return this.sinPeriodo() ? 'No hay un periodo académico en curso. Puede elegir un curso lectivo para consultar su sección guía de otro año.' : 'No hay datos para mostrar.';
    return `No tiene una sección guía asignada en el curso lectivo ${this.anio()}.`;
  });
  /** Consulta de la sección y el semestre elegidos, o null si aún no hay sección. */
  readonly consulta = computed<ConsultaSemestreGuia | null>(() => {
    const seccion = this.seccionActual();
    return seccion ? { anio: seccion.anio, nivel: seccion.nivel, numero: seccion.numero, semestre: this.semestre() } : null;
  });

  constructor() {
    effect(() => {
      this.auth.currentUsername();
      untracked(() => this.reiniciar());
    });
  }

  iniciar(): void {
    if (this.iniciado || !this.auth.hasRole('Profesor Guía')) return;
    this.iniciado = true;
    const generacion = this.generacion;
    this.cargando.set(true);
    this.api.obtenerPeriodoActual().subscribe({
      next: (periodo) => {
        if (generacion !== this.generacion) return;
        this.periodo.set(periodo);
        this.semestre.set(periodo.semestreActual ?? 'I_SEMESTRE');
        this.cambiarAnio(periodo.anio);
      },
      error: (error: { status?: number }) => {
        if (generacion !== this.generacion) return;
        this.cargando.set(false);
        if (error?.status === 404) this.sinPeriodo.set(true);
        else this.error.set('No se pudo consultar el periodo académico. Intente de nuevo más tarde.');
      },
    });
  }

  cambiarAnio(anio: number | string): void {
    const valor = Number(anio);
    if (!valor) return;
    const generacion = this.generacion;
    this.anio.set(valor);
    this.secciones.set([]);
    this.seleccion.set('');
    this.error.set('');
    this.cargando.set(true);
    this.api.listarSecciones(valor).subscribe({
      next: (secciones) => { if (generacion !== this.generacion || this.anio() !== valor) return; this.secciones.set(secciones); this.seleccion.set(this.clave(secciones[0])); this.cargando.set(false); },
      error: () => { if (generacion !== this.generacion || this.anio() !== valor) return; this.error.set('No se pudo consultar la sección guía. Intente de nuevo más tarde.'); this.cargando.set(false); },
    });
  }

  cambiarSemestre(semestre: string): void { this.semestre.set(semestre); }
  seleccionarSeccion(clave: string): void { this.seleccion.set(clave); }
  clave(section: SeccionGuiaApi | undefined): string { return section ? `${section.anio}-${section.nivel}-${section.numero}` : ''; }

  private reiniciar(): void {
    this.generacion++;
    this.iniciado = false;
    this.periodo.set(null);
    this.anio.set(null);
    this.secciones.set([]);
    this.seleccion.set('');
    this.error.set('');
    this.sinPeriodo.set(false);
    this.cargando.set(false);
    // Al cambiar de cuenta (o al crearse el servicio) se vuelve a cargar para la cuenta actual.
    this.iniciar();
  }
}
