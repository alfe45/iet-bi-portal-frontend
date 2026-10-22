import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../env/environment';

export interface ProfesorRegularPeriodoApi {
  anio: number;
  inicioSemestreI: string;
  finSemestreI: string;
  inicioSemestreII: string;
  finSemestreII: string;
  estado: string;
  semestreActual: string | null;
}

export interface ProfesorRegularAsignacionApi {
  anio: number;
  nivel: number;
  numero: number;
  seccion: string;
  codigoAsignatura: string;
  asignatura: string;
  cedulaProfesor: string;
  nombreProfesor: string;
}

export interface ProfesorRegularEstudianteApi {
  anio: number;
  nivel: number;
  numero: number;
  seccion: string;
  cedulaEstudiante: string;
  nombreEstudiante: string;
  fechaMatricula: string | null;
  estado: string;
  fechaRetiro: string | null;
  motivoRetiro: string | null;
}

export interface ProfesorRegularEvaluacionApi {
  cedulaEstudiante: string;
  nombreEstudiante: string;
  estadoMatricula: string;
  nota: string | null;
  notaMinima: string | null;
  aprobada: boolean | null;
  observaciones: string | null;
}

export interface ProfesorRegularEvaluacionNota {
  cedulaEstudiante: string;
  nota: string;
  observaciones: string | null;
}

export interface ProfesorRegularAusentismoApi {
  cedulaEstudiante: string;
  nombreEstudiante: string;
  estadoMatricula: string;
  codigoAsignatura: string;
  asignatura: string;
  nombreProfesor: string;
  lecciones: number;
  ausencias: number;
  justificadas: number;
  injustificadas: number;
  tardias: number;
  porcentajeAusentismo: number;
}

export interface ProfesorRegularLeccionApi {
  idLeccion: string | number;
  anio: number;
  nivel: number;
  numero: number;
  seccion: string;
  codigoAsignatura: string;
  asignatura: string;
  fecha: string;
  hora: string;
  tema: string;
  semestre: string;
  ausentes: number;
  justificadas: number;
  tardias: number;
}

export interface ProfesorRegularLeccionCreateRequest {
  anio: number;
  nivel: number;
  numero: number;
  codigoAsignatura: string;
  fecha: string;
  hora: string;
  tema: string;
  ausentes: string[];
  tardias: string[];
}

export interface ProfesorRegularLeccionUpdateRequest {
  fecha: string;
  hora: string;
  tema: string;
  ausentes: string[];
  tardias: string[];
}

export interface ProfesorRegularAusenciaApi {
  cedulaEstudiante: string;
  nombreEstudiante: string;
  tardia: boolean;
  justificada: boolean;
  justificacion: string | null;
}

export interface ProfesorRegularLeccionDetalleApi {
  leccion: ProfesorRegularLeccionApi;
  ausentes: ProfesorRegularAusenciaApi[];
}

export interface ProfesorRegularLeccionesResponse {
  elementos: ProfesorRegularLeccionApi[];
  pagina: number;
  tamanoPagina: number;
  total: number;
}

export interface ProfesorRegularEvaluacionesResponse {
  estado: Record<string, unknown>;
  notas: ProfesorRegularEvaluacionApi[];
}

export interface ProfesorRegularConsulta {
  anio: number;
  nivel: number;
  numero: number;
  codigoAsignatura: string;
  semestre: string;
}

@Injectable({ providedIn: 'root' })
// Cliente HTTP exclusivo del trabajo del Profesor regular.
export class ProfesorRegularApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/profesor`;

  obtenerPeriodoActual(): Observable<ProfesorRegularPeriodoApi> {
    return this.http.get<ProfesorRegularPeriodoApi>(`${environment.apiUrl}/periodos/actual`);
  }

  listarAsignaciones(anio: number): Observable<ProfesorRegularAsignacionApi[]> {
    return this.http.get<unknown>(`${this.url}/asignaciones`, { params: this.params({ anio }) }).pipe(map((response) => this.coleccion<ProfesorRegularAsignacionApi>(response)));
  }

  listarEstudiantes(anio: number, nivel: number, numero: number): Observable<ProfesorRegularEstudianteApi[]> {
    return this.http.get<unknown>(`${this.url}/secciones/${anio}/${nivel}/${numero}/estudiantes`).pipe(map((response) => this.coleccion<ProfesorRegularEstudianteApi>(response)));
  }

  obtenerEstudiante(anio: number, nivel: number, numero: number, cedula: string): Observable<ProfesorRegularEstudianteApi> {
    return this.http.get<ProfesorRegularEstudianteApi>(`${this.url}/secciones/${anio}/${nivel}/${numero}/estudiantes/${encodeURIComponent(cedula)}`);
  }

  obtenerAvisos(): Observable<unknown[]> {
    return this.http.get<unknown>(`${this.url}/pantalla-principal`).pipe(map((response) => this.coleccion<unknown>(response)));
  }

  listarEvaluaciones(consulta: ProfesorRegularConsulta): Observable<ProfesorRegularEvaluacionesResponse> {
    return this.http.get<ProfesorRegularEvaluacionesResponse>(`${this.url}/evaluaciones`, { params: this.consultaParams(consulta) });
  }

  actualizarEvaluaciones(consulta: ProfesorRegularConsulta, notas: ProfesorRegularEvaluacionNota[]): Observable<void> {
    return this.http.put<void>(`${this.url}/evaluaciones`, { ...consulta, notas });
  }

  borrarEvaluacion(consulta: ProfesorRegularConsulta, cedula: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/evaluaciones/${this.segmentosEvaluacion(consulta, cedula)}`);
  }

  confirmarEvaluaciones(consulta: ProfesorRegularConsulta): Observable<void> {
    return this.http.post<void>(`${this.url}/evaluaciones/confirmacion`, consulta);
  }

  listarLecciones(consulta: ProfesorRegularConsulta): Observable<ProfesorRegularLeccionesResponse> {
    return this.http.get<ProfesorRegularLeccionesResponse>(`${this.url}/lecciones`, { params: this.consultaParams(consulta) });
  }

  obtenerLeccion(id: string | number): Observable<ProfesorRegularLeccionDetalleApi> {
    return this.http.get<ProfesorRegularLeccionDetalleApi>(`${this.url}/lecciones/${encodeURIComponent(String(id))}`);
  }

  registrarLeccion(request: ProfesorRegularLeccionCreateRequest): Observable<{ idLeccion: string | number }> {
    return this.http.post<{ idLeccion: string | number }>(`${this.url}/lecciones`, request);
  }

  actualizarLeccion(id: string | number, request: ProfesorRegularLeccionUpdateRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/lecciones/${encodeURIComponent(String(id))}`, request);
  }

  justificarAusencia(leccionId: string | number, cedula: string, justificacion: string): Observable<void> {
    return this.http.put<void>(`${this.url}/lecciones/${encodeURIComponent(String(leccionId))}/ausencias/${encodeURIComponent(cedula)}/justificacion`, { justificacion });
  }

  quitarJustificacion(leccionId: string | number, cedula: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/lecciones/${encodeURIComponent(String(leccionId))}/ausencias/${encodeURIComponent(cedula)}/justificacion`);
  }

  obtenerAusentismo(consulta: ProfesorRegularConsulta): Observable<ProfesorRegularAusentismoApi[]> {
    return this.http.get<ProfesorRegularAusentismoApi[]>(`${this.url}/ausentismo`, { params: this.consultaParams(consulta) });
  }

  private consultaParams(consulta: ProfesorRegularConsulta): HttpParams {
    return this.params({ ...consulta });
  }

  private segmentosEvaluacion(consulta: ProfesorRegularConsulta, cedula: string): string {
    return [consulta.anio, consulta.nivel, consulta.numero, consulta.codigoAsignatura, consulta.semestre, cedula].map((value) => encodeURIComponent(String(value))).join('/');
  }

  private params(values: Record<string, string | number>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) params = params.set(key, String(value));
    return params;
  }

  private coleccion<T>(response: unknown): T[] {
    if (Array.isArray(response)) return response as T[];
    if (!response || typeof response !== 'object') return [];
    const value = response as { elementos?: unknown; datos?: unknown; items?: unknown; avisos?: unknown };
    if (Array.isArray(value.elementos)) return value.elementos as T[];
    if (Array.isArray(value.datos)) return value.datos as T[];
    if (Array.isArray(value.items)) return value.items as T[];
    if (Array.isArray(value.avisos)) return value.avisos as T[];
    return [];
  }
}
