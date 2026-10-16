import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, concatMap, finalize, forkJoin, from, map, of, shareReplay, switchMap, throwError } from 'rxjs';
import { AutenticacionService } from '../autenticacion/autenticacion.service';
import {
  ProfesorRegularApiService,
  ProfesorRegularAsignacionApi,
  ProfesorRegularAusentismoApi,
  ProfesorRegularConsulta,
  ProfesorRegularEvaluacionApi,
  ProfesorRegularEvaluacionNota,
  ProfesorRegularEstudianteApi,
  ProfesorRegularLeccionCreateRequest,
  ProfesorRegularPeriodoApi,
} from '../api/profesor-regular-api.service';
import type { AusentismoLocal, EvaluacionLocal, RegistroPortal } from './portal-datos.service';

export interface ProfesorRegularAsignacionView extends ProfesorRegularAsignacionApi {
  id: string;
  periodo: string;
  semestre: string;
  estudiantes: RegistroPortal[];
}

export interface GrupoRegularConsulta extends ProfesorRegularConsulta {
  periodo: string;
}

export function adaptarEstudianteRegular(item: ProfesorRegularEstudianteApi): RegistroPortal {
  return {
    id: item.cedulaEstudiante,
    nombre: item.nombreEstudiante,
    cedula: item.cedulaEstudiante,
    seccion: item.seccion,
    correo: '',
    estado: item.estado,
    fechaMatricula: item.fechaMatricula ?? '',
    fechaRetiro: item.fechaRetiro ?? '',
    motivoRetiro: item.motivoRetiro ?? '',
  };
}

@Injectable({ providedIn: 'root' })
// Estado remoto que solo se activa para cuentas con Profesor regular.
export class ProfesorRegularContextService {
  private readonly auth = inject(AutenticacionService);
  private readonly api = inject(ProfesorRegularApiService);
  private readonly periodo = signal<ProfesorRegularPeriodoApi | null>(null);
  private readonly asignacionesState = signal<ProfesorRegularAsignacionView[]>([]);
  private readonly estudiantesState = signal<Record<string, RegistroPortal[]>>({});
  private readonly evaluacionesState = signal<Record<string, ProfesorRegularEvaluacionApi[]>>({});
  private readonly ausentismoState = signal<Record<string, ProfesorRegularAusentismoApi[]>>({});
  private readonly loadedAcademic = new Set<string>();
  private readonly academicLoads = new Map<string, Observable<void>>();
  private readonly enviados = signal<Set<string>>(new Set());
  private ultimaLeccion = 0;

  readonly cargando = signal(false);
  readonly error = signal('');
  readonly avisos = signal<unknown[]>([]);
  readonly periodoActual = computed(() => this.periodo());
  readonly asignaciones = computed(() => this.asignacionesState());
  readonly activa = computed(() => this.auth.hasRole('Profesor regular'));
  readonly periodoEtiqueta = computed(() => this.etiquetaPeriodo(this.periodo()));
  readonly profesor = computed(() => (this.asignacionesState()[0]?.nombreProfesor ?? this.auth.currentDisplayName()) || this.auth.currentUsername());

  iniciar(): void {
    if (!this.activa() || this.cargando() || this.asignacionesState().length) return;
    this.cargando.set(true);
    this.error.set('');
    this.api.obtenerPeriodoActual().pipe(
      switchMap((periodo) => {
        this.periodo.set(periodo);
        return forkJoin({ periodo: of(periodo), asignaciones: this.api.listarAsignaciones(periodo.anio), avisos: this.api.obtenerAvisos().pipe(catchError(() => of([]))) });
      }),
    ).subscribe({
      next: ({ periodo, asignaciones, avisos }) => this.cargarEstudiantes(periodo, asignaciones, avisos),
      error: () => { this.error.set('No se pudieron cargar las asignaciones del Profesor regular.'); this.cargando.set(false); },
    });
  }

  estudiantesDe(asignacion: ProfesorRegularAsignacionView): RegistroPortal[] {
    return asignacion.estudiantes;
  }

  evaluacionDeGrupo(group: GrupoRegularConsulta, cedula: string): EvaluacionLocal {
    const item = this.evaluacionesState()[this.clave(group)]?.find((evaluation) => evaluation.cedulaEstudiante === cedula);
    return { estudianteId: cedula, valor: item?.nota === null || item?.nota === undefined ? '' : String(item.nota), observacion: item?.observaciones ?? '', asignatura: group.codigoAsignatura, seccion: `${group.nivel}-${group.numero}`, periodo: group.periodo };
  }

  asistenciaDeGrupo(group: GrupoRegularConsulta, cedula: string): AusentismoLocal {
    const item = this.ausentismoState()[this.clave(group)]?.find((absence) => absence.cedulaEstudiante === cedula);
    return { estudianteId: cedula, tardias: item?.tardias ?? 0, justificadas: item?.justificadas ?? 0, injustificadas: item?.injustificadas ?? 0, asignatura: group.codigoAsignatura, seccion: `${group.nivel}-${group.numero}`, periodo: group.periodo };
  }

  cargarAcademico(group: GrupoRegularConsulta): Observable<void> {
    const key = this.clave(group);
    if (this.loadedAcademic.has(key)) return of(undefined);
    const pending = this.academicLoads.get(key);
    if (pending) return pending;
    const request = forkJoin({ evaluaciones: this.api.listarEvaluaciones(group).pipe(map((response) => response.notas)), ausentismo: this.api.obtenerAusentismo(group) }).pipe(
      map(({ evaluaciones, ausentismo }) => {
        this.evaluacionesState.update((state) => ({ ...state, [key]: evaluaciones }));
        this.ausentismoState.update((state) => ({ ...state, [key]: ausentismo }));
        this.loadedAcademic.add(key);
      }),
      map(() => undefined),
      catchError((error: unknown) => { this.error.set('No se pudieron consultar las evaluaciones y el ausentismo del grupo.'); return throwError(() => error); }),
      finalize(() => this.academicLoads.delete(key)),
      shareReplay(1),
    );
    this.academicLoads.set(key, request);
    return request;
  }

  guardarRegistro(group: GrupoRegularConsulta, cedula: string, valor: string, observacion: string, asistencia: AusentismoLocal): Observable<void> {
    const nota = valor.trim();
    if (this.reduciriaAusentismo(group, cedula, asistencia)) return throwError(() => new Error('El backend registra ausentismo mediante lecciones y no permite reducir contadores desde esta vista.'));
    const evaluation = !valor.trim() && !observacion.trim()
      ? this.eliminarEvaluacion(group, cedula)
      : this.api.actualizarEvaluaciones(group, [{ cedulaEstudiante: cedula, nota, observaciones: observacion.trim() }]);
    const lesson = this.leccionParaCambio(group, cedula, asistencia);
    return forkJoin({ evaluation, lesson }).pipe(map(() => {
      const key = this.clave(group);
      this.evaluacionesState.update((state) => ({ ...state, [key]: !valor.trim() && !observacion.trim() ? (state[key] ?? []).filter((item) => item.cedulaEstudiante !== cedula) : this.reemplazarEvaluacion(state[key] ?? [], { cedulaEstudiante: cedula, nota, observaciones: observacion.trim() }) }));
      this.actualizarAusentismoLocal(key, cedula, asistencia);
    }));
  }

  guardarAusentismo(group: GrupoRegularConsulta, cedula: string, asistencia: AusentismoLocal): Observable<void> {
    return this.leccionParaCambio(group, cedula, asistencia).pipe(map(() => {
      this.actualizarAusentismoLocal(this.clave(group), cedula, asistencia);
    }));
  }

  eliminarEvaluacion(group: GrupoRegularConsulta, cedula: string): Observable<void> {
    return this.api.borrarEvaluacion(group, cedula).pipe(map(() => {
      const key = this.clave(group);
      this.evaluacionesState.update((state) => ({ ...state, [key]: (state[key] ?? []).filter((evaluation) => evaluation.cedulaEstudiante !== cedula) }));
    }));
  }

  enviarRegistro(group: GrupoRegularConsulta): Observable<void> {
    return this.api.enviarEvaluaciones(group).pipe(map(() => {
      const enviados = new Set(this.enviados());
      enviados.add(this.clave(group));
      this.enviados.set(enviados);
    }));
  }

  registroEnviado(group: GrupoRegularConsulta): boolean {
    return this.enviados().has(this.clave(group));
  }

  consultaDe(group: { anio?: number; nivel?: number; numero?: number; codigoAsignatura?: string; semestre?: string; periodo?: string }): GrupoRegularConsulta | null {
    if (!group.anio || group.nivel === undefined || group.numero === undefined || !group.codigoAsignatura) return null;
    return { anio: group.anio, nivel: group.nivel, numero: group.numero, codigoAsignatura: group.codigoAsignatura, semestre: group.semestre ?? this.periodo()?.semestreActual ?? '', periodo: group.periodo ?? this.periodoEtiqueta() };
  }

  private cargarEstudiantes(periodo: ProfesorRegularPeriodoApi, asignaciones: ProfesorRegularAsignacionApi[], avisos: unknown[]): void {
    const unique = [...new Map(asignaciones.map((assignment) => [`${assignment.anio}-${assignment.nivel}-${assignment.numero}`, assignment])).values()];
    forkJoin(unique.map((assignment) => this.api.listarEstudiantes(assignment.anio, assignment.nivel, assignment.numero).pipe(map((students) => ({ key: this.seccionKey(assignment), students: students.map(adaptarEstudianteRegular) }))))).subscribe({
      next: (sections) => {
        const students = Object.fromEntries(sections.map((section) => [section.key, section.students]));
        this.estudiantesState.set(students);
        this.asignacionesState.set(asignaciones.map((assignment) => ({ ...assignment, id: `${assignment.anio}-${assignment.nivel}-${assignment.numero}-${assignment.codigoAsignatura}`, periodo: this.etiquetaPeriodo(periodo), semestre: periodo.semestreActual ?? '', estudiantes: students[this.seccionKey(assignment)] ?? [] })));
        this.avisos.set(avisos);
        this.cargando.set(false);
      },
      error: () => { this.error.set('No se pudieron cargar los estudiantes de las secciones asignadas.'); this.cargando.set(false); },
    });
  }

  private leccionParaCambio(group: GrupoRegularConsulta, cedula: string, asistencia: AusentismoLocal): Observable<unknown> {
    const previous = this.asistenciaDeGrupo(group, cedula);
    if (this.reduciriaAusentismo(group, cedula, asistencia)) return throwError(() => new Error('El backend registra ausentismo mediante lecciones y no permite reducir contadores desde esta vista.'));
    const cambios = [
      ...this.repetir(this.contador(asistencia.tardias) - previous.tardias).map(() => ({ justificada: false, tardia: true })),
      ...this.repetir(this.contador(asistencia.injustificadas) - previous.injustificadas).map(() => ({ justificada: false, tardia: false })),
      ...this.repetir(this.contador(asistencia.justificadas) - previous.justificadas).map(() => ({ justificada: true, tardia: false })),
    ];
    if (!cambios.length) return of(undefined);
    return from(cambios).pipe(
      concatMap((cambio) => {
        const { fecha, hora } = this.fechaHoraLeccion();
        const request: ProfesorRegularLeccionCreateRequest = {
          anio: group.anio,
          nivel: group.nivel,
          numero: group.numero,
          codigoAsignatura: group.codigoAsignatura,
          fecha,
          hora,
          tema: 'Registro de ausentismo',
          ausentes: cambio.tardia ? [] : [cedula],
          tardias: cambio.tardia ? [cedula] : [],
        };
        return this.api.registrarLeccion(request).pipe(
          concatMap(({ idLeccion }) => cambio.justificada
            ? this.api.justificarAusencia(idLeccion, cedula, 'Justificación registrada desde el registro académico.')
            : of(undefined)),
        );
      }),
      map(() => undefined),
    );
  }

  private reduciriaAusentismo(group: GrupoRegularConsulta, cedula: string, asistencia: AusentismoLocal): boolean {
    const previous = this.asistenciaDeGrupo(group, cedula);
    return [asistencia.tardias, asistencia.justificadas, asistencia.injustificadas].some((value, index) => this.contador(value) < [previous.tardias, previous.justificadas, previous.injustificadas][index]);
  }

  private actualizarAusentismoLocal(key: string, cedula: string, asistencia: AusentismoLocal): void {
    this.ausentismoState.update((state) => ({ ...state, [key]: this.reemplazarAusentismo(state[key] ?? [], { cedulaEstudiante: cedula, tardias: this.contador(asistencia.tardias), justificadas: this.contador(asistencia.justificadas), injustificadas: this.contador(asistencia.injustificadas) }) }));
  }

  private reemplazarEvaluacion(items: ProfesorRegularEvaluacionApi[], value: ProfesorRegularEvaluacionNota): ProfesorRegularEvaluacionApi[] {
    const existing = items.find((item) => item.cedulaEstudiante === value.cedulaEstudiante);
    const replacement: ProfesorRegularEvaluacionApi = existing
      ? { ...existing, ...value }
      : { ...value, nombreEstudiante: '', estadoMatricula: '', notaMinima: null, aprobada: null };
    return existing ? items.map((item) => item.cedulaEstudiante === value.cedulaEstudiante ? replacement : item) : [...items, replacement];
  }

  private reemplazarAusentismo(items: ProfesorRegularAusentismoApi[], value: Pick<ProfesorRegularAusentismoApi, 'cedulaEstudiante' | 'tardias' | 'justificadas' | 'injustificadas'>): ProfesorRegularAusentismoApi[] {
    const existing = items.find((item) => item.cedulaEstudiante === value.cedulaEstudiante);
    const replacement: ProfesorRegularAusentismoApi = existing
      ? { ...existing, ...value }
      : { ...value, nombreEstudiante: '', estadoMatricula: '', codigoAsignatura: '', asignatura: '', nombreProfesor: '', lecciones: 0, ausencias: value.justificadas + value.injustificadas, porcentajeAusentismo: 0 };
    return existing ? items.map((item) => item.cedulaEstudiante === value.cedulaEstudiante ? replacement : item) : [...items, replacement];
  }

  private contador(value: number): number { return Math.max(0, Math.trunc(Number(value) || 0)); }
  private repetir(cantidad: number): undefined[] { return Array.from({ length: Math.max(0, Math.trunc(cantidad)) }); }
  private fechaHoraLeccion(): { fecha: string; hora: string } {
    this.ultimaLeccion = Math.max(Date.now(), this.ultimaLeccion + 60_000);
    const timestamp = new Date(this.ultimaLeccion);
    return { fecha: timestamp.toISOString().slice(0, 10), hora: `${timestamp.toISOString().slice(11, 16)}:00` };
  }

  private clave(group: GrupoRegularConsulta): string { return `${group.anio}-${group.nivel}-${group.numero}-${group.codigoAsignatura}-${group.semestre}`; }
  private seccionKey(assignment: Pick<ProfesorRegularAsignacionApi, 'anio' | 'nivel' | 'numero'>): string { return `${assignment.anio}-${assignment.nivel}-${assignment.numero}`; }
  private etiquetaPeriodo(periodo: ProfesorRegularPeriodoApi | null): string {
    if (!periodo) return 'Sin periodo activo';
    const semestre = periodo.semestreActual === 'I_SEMESTRE' ? 'Primer semestre' : periodo.semestreActual === 'II_SEMESTRE' ? 'Segundo semestre' : 'Receso académico';
    return `${semestre} ${periodo.anio}`;
  }
}
