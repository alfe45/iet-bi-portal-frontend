import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResultadoPaginado } from './api-modelos';
import { environment } from '../../../env/environment';

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

// Subir la sección también copia a la 12-N el guía y las asignaciones de la 11-N (los mismos profesores los dos años).
export interface SeccionSubidaApi { seccionCreada: boolean; matriculados: string[]; omitidos: string[]; guiaCopiado: string | null; asignacionesCopiadas: string[]; asignacionesOmitidas: string[] }

export interface CambiarSeccionRequest {
  nivel: number;
  numero: number;
}

export interface ConsultaMatriculas {
  anio?: number;
  nivel?: number;
  numero?: number;
  cedulaEstudiante?: string;
  busqueda?: string;
  pagina?: number;
  tamanoPagina?: number;
}

@Injectable({ providedIn: 'root' })
// Cliente de las acciones de matrícula definidas por el SQL.
export class MatriculasApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/admin/matriculas`;

  listar(consulta: ConsultaMatriculas = {}): Observable<ResultadoPaginado<MatriculaApi>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(consulta)) {
      if (value !== undefined && value !== null && String(value).trim() !== '') params = params.set(key, String(value));
    }
    return this.http.get<ResultadoPaginado<MatriculaApi>>(this.url, { params });
  }
  registrar(request: RegistrarMatriculaRequest): Observable<void> { return this.http.post<void>(this.url, request); }
  subirSeccion(request: SubirSeccionRequest): Observable<SeccionSubidaApi> { return this.http.post<SeccionSubidaApi>(`${this.url}/subir-seccion`, request); }
  cambiarSeccion(anio: number, cedula: string, request: CambiarSeccionRequest): Observable<void> { return this.http.put<void>(`${this.url}/${anio}/${encodeURIComponent(cedula)}/seccion`, request); }
  retirar(anio: number, cedula: string, fechaRetiro: string, motivo?: string): Observable<void> { return this.http.put<void>(`${this.url}/${anio}/${encodeURIComponent(cedula)}/retiro`, { fechaRetiro, motivo }); }
  quitarRetiro(anio: number, cedula: string): Observable<void> { return this.http.delete<void>(`${this.url}/${anio}/${encodeURIComponent(cedula)}/retiro`); }
  borrar(anio: number, cedula: string): Observable<void> { return this.http.delete<void>(`${this.url}/${anio}/${encodeURIComponent(cedula)}`); }
}
