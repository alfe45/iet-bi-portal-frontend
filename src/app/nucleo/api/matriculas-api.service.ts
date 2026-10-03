import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, ResultadoPaginado } from './api-modelos';

export interface MatriculaApi {
  anio: number;
  nivel: number;
  numero: number;
  seccion: string;
  cedulaEstudiante: string;
  nombreEstudiante: string;
  fechaMatricula: string;
  estado: string;
  fechaRetiro: string | null;
  motivoRetiro: string | null;
}

export interface RegistrarMatriculaRequest {
  anio: number;
  nivel: number;
  numero: number;
  cedulaEstudiante: string;
  fechaMatricula?: string;
}

export interface SubirSeccionRequest {
  anio: number;
  numero: number;
  fechaMatricula?: string;
}

export interface CambiarSeccionRequest {
  nivel: number;
  numero: number;
}

@Injectable({ providedIn: 'root' })
// Cliente de las acciones de matrícula definidas por el SQL.
export class MatriculasApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/admin/matriculas`;

  listar(): Observable<ResultadoPaginado<MatriculaApi>> { return this.http.get<ResultadoPaginado<MatriculaApi>>(this.url); }
  registrar(request: RegistrarMatriculaRequest): Observable<void> { return this.http.post<void>(this.url, request); }
  subirSeccion(request: SubirSeccionRequest): Observable<{ seccionCreada: boolean; matriculados: string[]; omitidos: string[] }> { return this.http.post<{ seccionCreada: boolean; matriculados: string[]; omitidos: string[] }>(`${this.url}/subir-seccion`, request); }
  cambiarSeccion(anio: number, cedula: string, request: CambiarSeccionRequest): Observable<void> { return this.http.put<void>(`${this.url}/${anio}/${encodeURIComponent(cedula)}/seccion`, request); }
  retirar(anio: number, cedula: string, fechaRetiro: string, motivo?: string): Observable<void> { return this.http.put<void>(`${this.url}/${anio}/${encodeURIComponent(cedula)}/retiro`, { fechaRetiro, motivo }); }
  quitarRetiro(anio: number, cedula: string): Observable<void> { return this.http.delete<void>(`${this.url}/${anio}/${encodeURIComponent(cedula)}/retiro`); }
  borrar(anio: number, cedula: string): Observable<void> { return this.http.delete<void>(`${this.url}/${anio}/${encodeURIComponent(cedula)}`); }
}
