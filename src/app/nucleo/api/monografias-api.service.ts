import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, ResultadoPaginado } from './api-modelos';

export interface ConsultaMonografias {
  pagina?: number;
  tamanoPagina?: number;
  anioInicio?: number;
  cedulaCoordinador?: string;
  codigoAsignatura?: string;
  estado?: string;
}

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
  estado: string;
  seguimientos: number;
  ultimoSeguimiento: string | null;
}

export interface RegistrarMonografiaRequest {
  anio: number;
  cedulaEstudiante: string;
  cedulaCoordinador: string;
  codigoAsignatura: string;
}

@Injectable({ providedIn: 'root' })
export class MonografiasApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/admin/monografias`;

  listar(consulta: ConsultaMonografias = {}): Observable<ResultadoPaginado<MonografiaApi>> {
    const params = Object.fromEntries(Object.entries(consulta).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]));
    return this.http.get<ResultadoPaginado<MonografiaApi>>(this.url, { params });
  }
  registrar(request: RegistrarMonografiaRequest): Observable<void> { return this.http.post<void>(this.url, request); }
  actualizar(cedulaEstudiante: string, cedulaCoordinador: string, codigoAsignatura: string): Observable<void> {
    return this.http.put<void>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}`, { cedulaCoordinador, codigoAsignatura });
  }
  borrar(cedulaEstudiante: string): Observable<void> { return this.http.delete<void>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}`); }
}
