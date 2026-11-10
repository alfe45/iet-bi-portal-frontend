import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, catchError, concatMap, finalize, forkJoin, from, map, of, shareReplay, throwError } from 'rxjs';
import { AutenticacionService } from '../autenticacion/autenticacion.service';
import {
  ProfesorRegularApiService,
  ProfesorRegularAsignacionApi,
  ProfesorRegularAusentismoApi,
  ProfesorRegularAvisoApi,
  ProfesorRegularConsulta,
  ProfesorRegularEstadoNotasApi,
  ProfesorRegularEvaluacionApi,
  ProfesorRegularEvaluacionNota,
  ProfesorRegularEstudianteApi,
  ProfesorRegularLeccionCreateRequest,
  ProfesorRegularPeriodoApi,
} from '../api/profesor-regular-api.service';
import type { AusentismoVista, EvaluacionVista, RegistroVista } from '../modelos/datos-vista';
import { hoyCostaRica } from '../../compartidos/utilidades/fechas';

/** Semestre como texto para el profesor. */
export function etiquetaSemestre(semestre: string | null | undefined): string {
  return semestre === 'I_SEMESTRE' ? 'Primer semestre' : semestre === 'II_SEMESTRE' ? 'Segundo semestre' : 'Receso académico';
}

/** Estado de la matrícula como texto (RD-048). */
export function etiquetaEstadoMatricula(estado: unknown): string {
  return estado === 'ACTIVA' ? 'Activa' : estado === 'RETIRADA' ? 'Retirada' : estado === 'FINALIZADA' ? 'Finalizada' : String(estado ?? '');
}

export interface ProfesorRegularAsignacionView extends ProfesorRegularAsignacionApi {
  id: string;
  periodo: string;
  semestre: string;
  estudiantes: RegistroVista[];
}

export interface GrupoRegularConsulta extends ProfesorRegularConsulta {
  periodo: string;
}

export function adaptarEstudianteRegular(item: ProfesorRegularEstudianteApi): RegistroVista {
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
  private readonly estudiantesState = signal<Record<string, RegistroVista[]>>({});
  private readonly evaluacionesState = signal<Record<string, ProfesorRegularEvaluacionApi[]>>({});
  private readonly ausentismoState = signal<Record<string, ProfesorRegularAusentismoApi[]>>({});
  private readonly estadoState = signal<Record<string, ProfesorRegularEstadoNotasApi>>({});
  private readonly loadedAcademic = new Set<string>();
  private readonly academicLoads = new Map<string, Observable<void>>();
  private readonly enviados = signal<Set<string>>(new Set());
  private ultimaLeccion = 0;
  // Incrementa al cambiar de cuenta: las respuestas de la sesión anterior se descartan.
  private generacion = 0;
  // Incrementa al cambiar de curso lectivo: se descartan las respuestas de la consulta anterior.
  private consultaId = 0;
  private iniciado = false;

  constructor() {
    effect(() => {
      this.auth.currentUsername();
      untracked(() => this.reiniciarSesion());
    });
  }

  readonly cargando = signal(false);
  // Error al consultar evaluaciones o ausentismo de un grupo.
  readonly error = signal('');
  // RD-043: error al cargar el periodo o los grupos; las vistas lo muestran en lugar de "no tienes grupos".
  readonly errorGrupos = signal('');
  // RD-004: no hay un periodo académico en curso (404 NF005); aun así se puede consultar otro curso lectivo.
  readonly sinPeriodo = signal(false);
  // RD-042: pantalla principal (plazos de notas y avisos, RN-76).
  readonly avisos = signal<ProfesorRegularAvisoApi[]>([]);
  readonly errorAvisos = signal('');
  // RD-043/RD-047: curso lectivo y semestre que se consultan (por defecto, los del periodo en curso).
  readonly anioConsulta = signal<number | null>(null);
  readonly semestreConsulta = signal('I_SEMESTRE');
  readonly aniosDisponibles = computed(() => {
    const base = this.periodo()?.anio ?? Number(hoyCostaRica().slice(0, 4));
    return [base, base - 1, base - 2, base - 3];
  });
  readonly periodoActual = computed(() => this.periodo());
  readonly asignaciones = computed(() => this.asignacionesState());
  readonly activa = computed(() => this.auth.hasRole('Profesor regular'));
  readonly periodoEtiqueta = computed(() => {
    const anio = this.anioConsulta();
    const periodo = this.periodo();
    if (periodo && anio === periodo.anio) return this.etiquetaPeriodo(periodo);
    if (anio) return `Curso lectivo ${anio}`;
    if (this.sinPeriodo()) return 'No hay un periodo académico en curso';
    return this.cargando() ? 'Cargando…' : 'No disponible';
  });
  readonly profesor = computed(() => (this.asignacionesState()[0]?.nombreProfesor ?? this.auth.currentDisplayName()) || this.auth.currentUsername());

  iniciar(): void {
    if (!this.activa() || this.iniciado) return;
    this.iniciado = true;
    const generacion = this.generacion;
    this.cargando.set(true);
    this.errorGrupos.set('');
    this.cargarAvisos();
    this.api.obtenerPeriodoActual().subscribe({
      next: (periodo) => {
        if (generacion !== this.generacion) return;
        this.periodo.set(periodo);
        this.semestreConsulta.set(periodo.semestreActual ?? 'I_SEMESTRE');
        this.cambiarAnio(periodo.anio);
      },
      error: (error: { status?: number }) => {
        if (generacion !== this.generacion) return;
        this.cargando.set(false);
        // RD-004: sin periodo en curso no es un error del sistema; se informa y se permite elegir otro curso lectivo.
        if (error?.status === 404) this.sinPeriodo.set(true);
        else this.errorGrupos.set('No se pudo consultar el periodo académico. Intente de nuevo más tarde.');
      },
    });
  }

  /** RD-043: cambia el curso lectivo consultado y carga sus asignaciones y estudiantes. */
  cambiarAnio(anio: number): void {
    if (!this.activa() || !anio) return;
    const generacion = this.generacion;
    const consulta = ++this.consultaId;
    const vigente = () => generacion === this.generacion && consulta === this.consultaId;
    this.anioConsulta.set(anio);
    this.asignacionesState.set([]);
    this.estudiantesState.set({});
    this.cargando.set(true);
    this.errorGrupos.set('');
    this.api.listarAsignaciones(anio).subscribe({
      next: (asignaciones) => { if (vigente()) this.cargarEstudiantes(asignaciones, vigente); },
      error: () => { if (vigente()) { this.errorGrupos.set('No se pudieron cargar las asignaciones del curso lectivo.'); this.cargando.set(false); } },
    });
  }

  /** RD-047: semestre de las notas y el ausentismo que se consultan. */
  cambiarSemestre(semestre: string): void { this.semestreConsulta.set(semestre); }

  private cargarAvisos(): void {
    const generacion = this.generacion;
    this.errorAvisos.set('');
    this.api.obtenerAvisos().subscribe({
      next: (avisos) => { if (generacion === this.generacion) this.avisos.set(avisos); },
      error: () => { if (generacion === this.generacion) this.errorAvisos.set('No se pudieron cargar los plazos de notas.'); },
    });
  }

  private reiniciarSesion(): void {
    this.generacion++;
    this.periodo.set(null);
    this.asignacionesState.set([]);
    this.estudiantesState.set({});
    this.evaluacionesState.set({});
    this.ausentismoState.set({});
    this.estadoState.set({});
    this.loadedAcademic.clear();
    this.academicLoads.clear();
    this.enviados.set(new Set());
    this.avisos.set([]);
    this.error.set('');
    this.errorGrupos.set('');
    this.errorAvisos.set('');
    this.sinPeriodo.set(false);
    this.anioConsulta.set(null);
    this.iniciado = false;
    this.cargando.set(false);
    if (this.activa()) this.iniciar();
  }

  estudiantesDe(asignacion: ProfesorRegularAsignacionView): RegistroVista[] {
    return asignacion.estudiantes;
  }

  evaluacionDeGrupo(group: GrupoRegularConsulta, cedula: string): EvaluacionVista {
    const item = this.evaluacionesState()[this.clave(group)]?.find((evaluation) => evaluation.cedulaEstudiante === cedula);
    return { estudianteId: cedula, valor: item?.nota === null || item?.nota === undefined ? '' : String(item.nota), observacion: item?.observaciones ?? '', asignatura: group.codigoAsignatura, seccion: `${group.nivel}-${group.numero}`, periodo: group.periodo };
  }

  asistenciaDeGrupo(group: GrupoRegularConsulta, cedula: string): AusentismoVista {
    const item = this.ausentismoState()[this.clave(group)]?.find((absence) => absence.cedulaEstudiante === cedula);
    return { estudianteId: cedula, tardias: item?.tardias ?? 0, justificadas: item?.justificadas ?? 0, injustificadas: item?.injustificadas ?? 0, asignatura: group.codigoAsignatura, seccion: `${group.nivel}-${group.numero}`, periodo: group.periodo };
  }

  /** CU07: estado de las notas del grupo en el semestre (cierre, sin nota, confirmación), o null si no se ha cargado. */
  estadoNotas(group: GrupoRegularConsulta): ProfesorRegularEstadoNotasApi | null { return this.estadoState()[this.clave(group)] ?? null; }

  /** CU07: notas del semestre según la API (estudiantes que se califican, nota mínima y si aprueba), o null si no se han cargado. */
  notasDe(group: GrupoRegularConsulta): ProfesorRegularEvaluacionApi[] | null { return this.evaluacionesState()[this.clave(group)] ?? null; }

  /** Vuelve a consultar notas y ausentismo (tras guardar o eliminar, para actualizar aprobación y faltantes). */
  recargarAcademico(group: GrupoRegularConsulta): Observable<void> {
    this.loadedAcademic.delete(this.clave(group));
    return this.cargarAcademico(group);
  }

  cargarAcademico(group: GrupoRegularConsulta): Observable<void> {
    const key = this.clave(group);
    if (this.loadedAcademic.has(key)) return of(undefined);
    const pending = this.academicLoads.get(key);
    if (pending) return pending;
    const request = forkJoin({ evaluaciones: this.api.listarEvaluaciones(group), ausentismo: this.api.obtenerAusentismo(group) }).pipe(
      map(({ evaluaciones, ausentismo }) => {
        const confirmado = Boolean(evaluaciones.estado?.confirmadoEn);
        this.evaluacionesState.update((state) => ({ ...state, [key]: evaluaciones.notas }));
        this.estadoState.update((state) => ({ ...state, [key]: evaluaciones.estado }));
        if (confirmado) {
          const enviados = new Set(this.enviados());
          enviados.add(key);
          this.enviados.set(enviados);
        }
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

  guardarRegistro(group: GrupoRegularConsulta, cedula: string, valor: string, observacion: string, asistencia: AusentismoVista): Observable<void> {
    const nota = valor.trim();
    if (this.reduciriaAusentismo(group, cedula, asistencia)) return throwError(() => new Error('El backend registra ausentismo mediante lecciones y no permite reducir contadores desde esta vista.'));
    const evaluation = !valor.trim() && !observacion.trim()
      ? this.eliminarEvaluacion(group, cedula)
      : this.api.actualizarEvaluaciones(group, [{ cedulaEstudiante: cedula, nota, observaciones: observacion.trim() || null }]);
    const lesson = this.leccionParaCambio(group, cedula, asistencia);
    return forkJoin({ evaluation, lesson }).pipe(map(() => {
      const key = this.clave(group);
      this.evaluacionesState.update((state) => ({ ...state, [key]: !valor.trim() && !observacion.trim() ? (state[key] ?? []).filter((item) => item.cedulaEstudiante !== cedula) : this.reemplazarEvaluacion(state[key] ?? [], { cedulaEstudiante: cedula, nota, observaciones: observacion.trim() }) }));
      this.actualizarAusentismoVista(key, cedula, asistencia);
    }));
  }

  guardarAusentismo(group: GrupoRegularConsulta, cedula: string, asistencia: AusentismoVista): Observable<void> {
    return this.leccionParaCambio(group, cedula, asistencia).pipe(map(() => {
      this.actualizarAusentismoVista(this.clave(group), cedula, asistencia);
    }));
  }

  eliminarEvaluacion(group: GrupoRegularConsulta, cedula: string): Observable<void> {
    return this.api.borrarEvaluacion(group, cedula).pipe(map(() => {
      const key = this.clave(group);
      this.evaluacionesState.update((state) => ({ ...state, [key]: (state[key] ?? []).filter((evaluation) => evaluation.cedulaEstudiante !== cedula) }));
    }));
  }

  enviarRegistro(group: GrupoRegularConsulta): Observable<void> {
    return this.api.confirmarEvaluaciones(group).pipe(map(() => {
      const key = this.clave(group);
      const enviados = new Set(this.enviados());
      enviados.add(key);
      this.enviados.set(enviados);
      this.estadoState.update((state) => state[key] ? { ...state, [key]: { ...state[key], confirmadoEn: new Date().toISOString() } } : state);
    }));
  }

  registroEnviado(group: GrupoRegularConsulta): boolean {
    return this.enviados().has(this.clave(group));
  }

  consultaDe(group: { anio?: number; nivel?: number; numero?: number; codigoAsignatura?: string; semestre?: string; periodo?: string }): GrupoRegularConsulta | null {
    if (!group.anio || group.nivel === undefined || group.numero === undefined || !group.codigoAsignatura) return null;
    return { anio: group.anio, nivel: group.nivel, numero: group.numero, codigoAsignatura: group.codigoAsignatura, semestre: group.semestre || this.semestreConsulta(), periodo: group.periodo ?? this.periodoEtiqueta() };
  }

  private cargarEstudiantes(asignaciones: ProfesorRegularAsignacionApi[], vigente: () => boolean): void {
    const unique = [...new Map(asignaciones.map((assignment) => [`${assignment.anio}-${assignment.nivel}-${assignment.numero}`, assignment])).values()];
    const periodo = this.periodoEtiqueta();
    const publicar = (students: Record<string, RegistroVista[]>) => {
      this.estudiantesState.set(students);
      this.asignacionesState.set(asignaciones.map((assignment) => ({ ...assignment, id: `${assignment.anio}-${assignment.nivel}-${assignment.numero}-${assignment.codigoAsignatura}`, periodo, semestre: '', estudiantes: students[this.seccionKey(assignment)] ?? [] })));
      this.cargando.set(false);
    };
    // Sin asignaciones en el curso lectivo: forkJoin([]) no emite, así que se publica directamente.
    if (!unique.length) { publicar({}); return; }
    forkJoin(unique.map((assignment) => this.api.listarEstudiantes(assignment.anio, assignment.nivel, assignment.numero).pipe(map((students) => ({ key: this.seccionKey(assignment), students: students.map(adaptarEstudianteRegular) }))))).subscribe({
      next: (sections) => { if (vigente()) publicar(Object.fromEntries(sections.map((section) => [section.key, section.students]))); },
      error: () => { if (vigente()) { this.errorGrupos.set('No se pudieron cargar los estudiantes de las secciones asignadas.'); this.cargando.set(false); } },
    });
  }

  private leccionParaCambio(group: GrupoRegularConsulta, cedula: string, asistencia: AusentismoVista): Observable<unknown> {
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

  private reduciriaAusentismo(group: GrupoRegularConsulta, cedula: string, asistencia: AusentismoVista): boolean {
    const previous = this.asistenciaDeGrupo(group, cedula);
    return [asistencia.tardias, asistencia.justificadas, asistencia.injustificadas].some((value, index) => this.contador(value) < [previous.tardias, previous.justificadas, previous.injustificadas][index]);
  }

  private actualizarAusentismoVista(key: string, cedula: string, asistencia: AusentismoVista): void {
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
    if (!periodo) return 'No disponible';
    return `${etiquetaSemestre(periodo.semestreActual)} ${periodo.anio}`;
  }
}
