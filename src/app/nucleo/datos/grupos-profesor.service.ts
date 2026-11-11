import { computed, Injectable, inject, signal } from '@angular/core';
import { AutenticacionService } from '../autenticacion/autenticacion.service';
import { ProfesorRegularContextService } from './profesor-regular-context.service';
import type { RegistroVista } from '../modelos/datos-vista';

export interface GrupoTrabajo {
  id: string;
  asignatura: string;
  seccion: string;
  periodo: string;
  escala: string;
  estudiantes: RegistroVista[];
  anio?: number;
  nivel?: number;
  numero?: number;
  codigoAsignatura?: string;
  semestre?: string;
}

@Injectable({ providedIn: 'root' })
// Construye los grupos de trabajo disponibles para el profesor autenticado.
export class GruposProfesorService {
  private readonly auth = inject(AutenticacionService);
  private readonly regularContext = inject(ProfesorRegularContextService);
  private readonly selectedKey = signal('');
  private readonly pendingSelection = signal<{ asignatura: string | null; seccion: string | null; periodo: string | null } | null>(null);
  readonly esProfesorRegular = computed(() => this.auth.hasRole('Profesor regular'));

  readonly periodoActivo = computed(() => this.regularContext.periodoEtiqueta());
  // RD-043: curso lectivo consultado, años elegibles y estado de la carga (para no confundir un error con "sin grupos").
  readonly anioConsulta = computed(() => this.regularContext.anioConsulta());
  readonly aniosDisponibles = computed(() => this.regularContext.aniosDisponibles());
  readonly cargando = computed(() => this.regularContext.cargando());
  readonly errorGrupos = computed(() => this.regularContext.errorGrupos());
  readonly sinPeriodo = computed(() => this.regularContext.sinPeriodo());
  /** Texto cuando no hay grupos: el error, la falta de periodo en curso (RD-004) o que no hay asignaciones en el año. */
  readonly mensajeSinGrupos = computed(() => {
    if (this.errorGrupos()) return this.errorGrupos();
    if (this.cargando()) return 'Cargando grupos…';
    if (!this.anioConsulta()) return this.sinPeriodo() ? 'No hay un periodo académico en curso. Puede elegir un curso lectivo para consultar sus grupos de otro año.' : 'No hay grupos para mostrar.';
    return `No tienes grupos asignados en el curso lectivo ${this.anioConsulta()}.`;
  });
  readonly profesor = computed(() => this.regularContext.profesor());
  readonly grupos = computed<GrupoTrabajo[]>(() => {
    return this.regularContext.asignaciones().map((item) => ({
      id: item.id,
      asignatura: item.asignatura,
      seccion: item.seccion,
      periodo: item.periodo,
      escala: this.escalaRegular(item.asignatura),
      estudiantes: item.estudiantes,
      anio: item.anio,
      nivel: item.nivel,
      numero: item.numero,
      codigoAsignatura: item.codigoAsignatura,
      semestre: this.regularContext.semestreConsulta(),
    }));
  });
  readonly asignaciones = computed<RegistroVista[]>(() => this.regularContext.asignaciones().map((item) => ({ id: item.id, anio: String(item.anio), nivel: String(item.nivel), numero: String(item.numero), profesor: item.nombreProfesor, cedulaProfesor: item.cedulaProfesor, codigo: item.codigoAsignatura, asignatura: item.asignatura, seccion: item.seccion, periodo: item.periodo, semestre: this.regularContext.semestreConsulta(), estado: 'Activa' })));
  readonly grupoActual = computed(() => {
    const groups = this.grupos();
    const pending = this.pendingSelection();
    return groups.find((grupo) => grupo.id === this.selectedKey())
      ?? groups.find((grupo) => pending && grupo.asignatura === pending.asignatura && grupo.seccion === pending.seccion && grupo.periodo === pending.periodo)
      ?? groups[0];
  });

  constructor() {
    if (this.auth.hasRole('Profesor regular')) this.regularContext.iniciar();
  }

  cambiarAnio(anio: number | string): void { this.selectedKey.set(''); this.regularContext.cambiarAnio(Number(anio)); }

  seleccionar(grupo: GrupoTrabajo | string | undefined): void {
    const key = typeof grupo === 'string' ? grupo : grupo?.id;
    if (!key) return;
    this.pendingSelection.set(null);
    this.selectedKey.set(key);
  }

  seleccionarParametros(asignatura: string | null, seccion: string | null, periodo: string | null): void {
    this.pendingSelection.set({ asignatura, seccion, periodo });
    const grupo = this.grupos().find((item) => item.asignatura === asignatura && item.seccion === seccion && item.periodo === periodo);
    if (grupo) this.seleccionar(grupo);
  }

  etiqueta(grupo: GrupoTrabajo | undefined): string { return grupo ? `${grupo.asignatura} · ${grupo.seccion}` : 'Sin grupo seleccionado'; }

  private escala(value: string | undefined): string {
    return value === '1-100' ? '1–100' : value === 'A-E' ? 'A–E' : '1–7';
  }

  private escalaRegular(value: string): string {
    return ['Estudios Sociales', 'Cívica', 'Civica'].includes(value) ? '1–100' : '1–7';
  }

  estudiantesDeSeccion(section: string): RegistroVista[] {
    const students = this.grupos().filter((group) => group.seccion === section).flatMap((group) => group.estudiantes);
    return [...new Map(students.map((student) => [student.id, student])).values()];
  }

}
