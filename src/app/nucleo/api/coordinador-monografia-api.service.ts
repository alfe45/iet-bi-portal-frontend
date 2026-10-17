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
  enviadoEn: string;
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

  listar(): Observable<MonografiaApi[]> {
    return this.http.get<MonografiaApi[]>(this.url, { params: new HttpParams() });
  }

  obtener(cedulaEstudiante: string): Observable<DetalleMonografiaApi> {
    return this.http.get<DetalleMonografiaApi>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}`);
  }

  cambiarEstado(cedulaEstudiante: string, estado: EstadoMonografiaApi): Observable<void> {
    return this.http.put<void>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}/estado`, { estado });
  }

  enviarReporte(cedulaEstudiante: string, anio: number, semestre: string, observaciones: string): Observable<void> {
    return this.http.put<void>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}/reportes/${anio}/${encodeURIComponent(semestre)}`, { observaciones });
  }
}