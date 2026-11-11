import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../env/environment';

export type EstadoMonografiaApi = 'CAPACITACION' | 'INVESTIGACION' | 'TERMINADA';

export interface MonografiaApi {
  cedulaEstudiante: string;
  nombreEstudiante: string;
  anioInicio: number;
  anioActual: number;
  seccionActual: string;
  cedulaCoordinador: string;
  nombreCoordinador: string;
  codigoAsignatura: string;
  asignatura: string;
  estado: EstadoMonografiaApi;
  seguimientos: number;
  ultimoSeguimiento: string | null;
}

export interface SeguimientoMonografiaApi {
  idSeguimiento: number;
  cedulaEstudiante: string;
  fecha: string;
  observacion: string;
}

export interface ReporteMonografiaApi {
  cedulaEstudiante: string;
  anio: number;
  semestre: string;
  observaciones: string;
  enviadoEn: string | null;
}

export interface DetalleMonografiaApi {
  monografia: MonografiaApi;
  seguimientos: SeguimientoMonografiaApi[];
  reportes: ReporteMonografiaApi[];
}

@Injectable({ providedIn: 'root' })
export class CoordinadorMonografiaApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/profesor/monografias`;

  // CU01: filtros opcionales por año de inicio y estado.
  listar(filtros: { anioInicio?: number | null; estado?: string | null } = {}): Observable<MonografiaApi[]> {
    let params = new HttpParams();
    if (filtros.anioInicio) params = params.set('anioInicio', filtros.anioInicio);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    return this.http.get<MonografiaApi[]>(this.url, { params });
  }

  // CU03: registra un seguimiento (fecha opcional: hoy).
  registrarSeguimiento(cedulaEstudiante: string, fecha: string, observacion: string): Observable<{ idSeguimiento: number }> {
    return this.http.post<{ idSeguimiento: number }>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}/seguimientos`, { fecha, observacion });
  }

  // CU04: corrige o elimina un seguimiento.
  modificarSeguimiento(idSeguimiento: number, fecha: string, observacion: string): Observable<void> {
    return this.http.put<void>(`${this.url}/seguimientos/${idSeguimiento}`, { fecha, observacion });
  }

  eliminarSeguimiento(idSeguimiento: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/seguimientos/${idSeguimiento}`);
  }

  // CU05 FA7: retira el reporte (borrador) del semestre.
  retirarReporte(cedulaEstudiante: string, anio: number, semestre: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}/reportes/${anio}/${encodeURIComponent(semestre)}`);
  }

  obtener(cedulaEstudiante: string): Observable<DetalleMonografiaApi> {
    return this.http.get<DetalleMonografiaApi>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}`);
  }

  cambiarEstado(cedulaEstudiante: string, estado: EstadoMonografiaApi): Observable<void> {
    return this.http.put<void>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}/estado`, { estado });
  }

  confirmarReporte(cedulaEstudiante: string, anio: number, semestre: string, observaciones: string): Observable<void> {
    return this.http.put<void>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}/reportes/${anio}/${encodeURIComponent(semestre)}`, { observaciones });
  }

  /** Compatibilidad con consumidores anteriores; la operación ahora se denomina confirmar. */
  enviarReporte(cedulaEstudiante: string, anio: number, semestre: string, observaciones: string): Observable<void> {
    return this.confirmarReporte(cedulaEstudiante, anio, semestre, observaciones);
  }

  guardarBorradorReporte(cedulaEstudiante: string, anio: number, semestre: string, observaciones: string): Observable<void> {
    return this.http.put<void>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}/reportes/${anio}/${encodeURIComponent(semestre)}/borrador`, { observaciones });
  }
}
