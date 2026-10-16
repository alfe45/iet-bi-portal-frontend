import { computed, Injectable, inject, Injector, signal } from '@angular/core';
import { AutenticacionService } from '../autenticacion/autenticacion.service';
import { PortalDatosService, RegistroPortal } from './portal-datos.service';
import { ProfesorRegularContextService } from './profesor-regular-context.service';

export interface GrupoTrabajo {
  id: string;
  asignatura: string;
  seccion: string;
  periodo: string;
  escala: string;
  estudiantes: RegistroPortal[];
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
  private readonly injector = inject(Injector);
  private readonly regularContext = inject(ProfesorRegularContextService);
  private readonly selectedKey = signal(this.auth.hasRole('Profesor regular') ? '' : this.loadKey());
  private readonly pendingSelection = signal<{ asignatura: string | null; seccion: string | null; periodo: string | null } | null>(null);
  readonly esProfesorRegular = computed(() => this.auth.hasRole('Profesor regular'));

  readonly periodoActivo = computed(() => this.esProfesorRegular() ? this.regularContext.periodoEtiqueta() : this.datosLocales().listar('periodos').find((periodo) => periodo['estado'] === 'Activo')?.['nombre'] ?? 'Sin periodo activo');
  readonly profesor = computed(() => {
    if (this.esProfesorRegular()) return this.regularContext.profesor();
    const username = this.auth.currentUsername();
    const datos = this.datosLocales();
    const known = datos.listar('profesores').find((item) => item['nombre'] === username)?.['nombre'];
    if (known) return known;
    const assigned = datos.asignacionesResponsabilidad().find((item) => item.cedula === username)?.profesor;
    if (assigned) return assigned;
    return datos.listar('asignaciones').find((item) => item['periodo'] === this.periodoActivo())?.['profesor'] ?? username;
  });
  readonly grupos = computed<GrupoTrabajo[]>(() => {
    if (this.esProfesorRegular()) return this.regularContext.asignaciones().map((item) => ({
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
      semestre: item.semestre,
    }));
    const datos = this.datosLocales();
    return datos.listar('asignaciones')
      .filter((item) => item['profesor'] === this.profesor() && item['periodo'] === this.periodoActivo() && item['estado'] === 'Activa')
      .map((item) => {
        const asignatura = datos.listar('asignaturas').find((subject) => subject['nombre'] === item['asignatura']);
        return {
          id: `${item['asignatura']}|${item['seccion']}|${item['periodo']}`,
          asignatura: item['asignatura'],
          seccion: item['seccion'],
          periodo: item['periodo'],
          escala: this.escala(asignatura?.['escala']),
          estudiantes: datos.estudiantes().filter((student) => student['seccion'] === item['seccion']),
        };
      });
  });
  readonly asignaciones = computed<RegistroPortal[]>(() => this.esProfesorRegular()
    ? this.regularContext.asignaciones().map((item) => ({ id: item.id, anio: String(item.anio), nivel: String(item.nivel), numero: String(item.numero), profesor: item.nombreProfesor, cedulaProfesor: item.cedulaProfesor, codigo: item.codigoAsignatura, asignatura: item.asignatura, seccion: item.seccion, periodo: item.periodo, semestre: item.semestre, estado: 'Activa' }))
    : this.datosLocales().listar('asignaciones'));
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

  seleccionar(grupo: GrupoTrabajo | string | undefined): void {
    const key = typeof grupo === 'string' ? grupo : grupo?.id;
    if (!key) return;
    this.pendingSelection.set(null);
    this.selectedKey.set(key);
    if (!this.esProfesorRegular()) {
      try { sessionStorage.setItem('iet-bi-portal:grupo-activo:v1', key); } catch { }
    }
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

  estudiantesDeSeccion(section: string): RegistroPortal[] {
    if (this.esProfesorRegular()) {
      const students = this.grupos().filter((group) => group.seccion === section).flatMap((group) => group.estudiantes);
      return [...new Map(students.map((student) => [student.id, student])).values()];
    }
    return this.datosLocales().estudiantes().filter((student) => student['seccion'] === section);
  }

  private loadKey(): string {
    try { return sessionStorage.getItem('iet-bi-portal:grupo-activo:v1') ?? ''; } catch { return ''; }
  }

  private datosLocales(): PortalDatosService { return this.injector.get(PortalDatosService); }
}
