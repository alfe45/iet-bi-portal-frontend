import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, ResultadoPaginado } from './api-modelos';

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

  listar(): Observable<ResultadoPaginado<MonografiaApi>> { return this.http.get<ResultadoPaginado<MonografiaApi>>(this.url); }
  registrar(request: RegistrarMonografiaRequest): Observable<void> { return this.http.post<void>(this.url, request); }
  actualizar(cedulaEstudiante: string, cedulaCoordinador: string, codigoAsignatura: string): Observable<void> {
    return this.http.put<void>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}`, { cedulaCoordinador, codigoAsignatura });
  }
  borrar(cedulaEstudiante: string): Observable<void> { return this.http.delete<void>(`${this.url}/${encodeURIComponent(cedulaEstudiante)}`); }
}
