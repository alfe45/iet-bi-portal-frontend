import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../env/environment';

export interface PeriodoGuiaApi {
  anio: number;
  semestreActual: string | null;
}

export interface SeccionGuiaApi {
  anio: number;
  nivel: number;
  numero: number;
  nombre: string;
  cedulaGuia: string | null;
  nombreGuia: string | null;
  cantidadEstudiantes: number;
}

export interface EstudianteGuiaApi {
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

export interface SeguimientoGuiaApi {
  idSeguimiento: number;
  cedulaEstudiante: string;
  fecha: string;
  observacion: string;
}

export interface MonografiaGuiaApi {
  cedulaEstudiante: string;
  nombreEstudiante: string;
  anioInicio: number;
  anioActual: number;
  seccionActual: string;
  cedulaCoordinador: string;
  nombreCoordinador: string;
  codigoAsignatura: string;
  asignatura: string;
  estado: string;
  seguimientos: number;
  ultimoSeguimiento: string | null;
}

export interface MonografiaSeguimientoGuiaApi {
  monografia: MonografiaGuiaApi;
  seguimientos: SeguimientoGuiaApi[];
}

export interface ReporteMonografiaGuiaApi {
  cedulaEstudiante: string;
  nombreEstudiante: string;
  codigoAsignatura: string;
  asignatura: string;
  nombreCoordinador: string;
  estado: string;
  observaciones: string | null;
  enviadoEn: string | null;
}

export interface BandaAsignaturaGuiaApi {
  codigoAsignatura: string;
  asignatura: string;
  tipoAsignatura: string;
  nombreProfesor: string;
  notaMinima: string | null;
  nota: string | null;
  aprobada: boolean | null;
  tardias: number;
  injustificadas: number;
  justificadas: number;
  observaciones: string | null;
  confirmada: boolean;
}

export interface MonografiaReporteGuiaApi {
  codigoAsignatura: string;
  area: string;
  nombreCoordinador: string;
  estado: string;
  observaciones: string | null;
  enviadoEn: string | null;
}

export interface ReporteBandasGuiaApi {
  anio: number;
  semestre: string;
  nivel: number;
  seccion: string;
  cedulaEstudiante: string;
  nombreEstudiante: string;
  nombreGuia: string | null;
  asignaturas: BandaAsignaturaGuiaApi[];
  monografia: MonografiaReporteGuiaApi | null;
}

export interface ConsultaSeccionGuia {
  anio: number;
  nivel: number;
  numero: number;
}

export interface ConsultaSemestreGuia extends ConsultaSeccionGuia {
  semestre: string;
}

@Injectable({ providedIn: 'root' })
// Cliente HTTP de las funciones exclusivas del Profesor Guía.
export class ProfesorGuiaApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/profesor/guia`;

  obtenerPeriodoActual(): Observable<PeriodoGuiaApi> {
    return this.http.get<PeriodoGuiaApi>(`${environment.apiUrl}/periodos/actual`);
  }

  listarSecciones(anio?: number): Observable<SeccionGuiaApi[]> {
    const params = anio === undefined ? undefined : new HttpParams().set('anio', anio);
    return this.http.get<SeccionGuiaApi[]>(`${this.url}/secciones`, { params });
  }

  listarEstudiantes(consulta: ConsultaSeccionGuia): Observable<EstudianteGuiaApi[]> {
    return this.http.get<EstudianteGuiaApi[]>(`${environment.apiUrl}/profesor/secciones/${consulta.anio}/${consulta.nivel}/${consulta.numero}/estudiantes`);
  }

  listarMonografias(consulta: ConsultaSeccionGuia): Observable<MonografiaSeguimientoGuiaApi[]> {
    return this.http.get<MonografiaSeguimientoGuiaApi[]>(`${this.url}/monografias`, { params: this.params(consulta) });
  }

  listarReportesMonografia(consulta: ConsultaSemestreGuia): Observable<ReporteMonografiaGuiaApi[]> {
    return this.http.get<ReporteMonografiaGuiaApi[]>(`${this.url}/monografias/reportes`, { params: this.params(consulta) });
  }

  permitirCambiosReporteMonografia(consulta: ConsultaSemestreGuia, cedulaEstudiante: string): Observable<void> {
    return this.http.put<void>(`${this.url}/monografias/reportes/${consulta.anio}/${consulta.nivel}/${consulta.numero}/${encodeURIComponent(cedulaEstudiante)}/permitir-cambios/${encodeURIComponent(consulta.semestre)}`, {});
  }

  listarReportesBandas(consulta: ConsultaSemestreGuia): Observable<ReporteBandasGuiaApi[]> {
    return this.http.get<ReporteBandasGuiaApi[]>(`${this.url}/reporte-bandas`, { params: this.params(consulta) });
  }

  obtenerReporteBandas(cedula: string, consulta: ConsultaSemestreGuia): Observable<ReporteBandasGuiaApi> {
    return this.http.get<ReporteBandasGuiaApi>(`${this.url}/reporte-bandas/${encodeURIComponent(cedula)}`, { params: this.params(consulta) });
  }

  reactivarBandasSeccion(consulta: ConsultaSemestreGuia): Observable<void> {
    return this.http.put<void>(`${this.url}/reporte-bandas/${consulta.anio}/${consulta.nivel}/${consulta.numero}/reactivar/${encodeURIComponent(consulta.semestre)}`, {});
  }

  private params(consulta: ConsultaSeccionGuia & Partial<Pick<ConsultaSemestreGuia, 'semestre'>>): HttpParams {
    let params = new HttpParams().set('anio', consulta.anio).set('nivel', consulta.nivel).set('numero', consulta.numero);
    if (consulta.semestre) params = params.set('semestre', consulta.semestre);
    return params;
  }
}
