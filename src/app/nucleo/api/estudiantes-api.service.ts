import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URL, ResultadoPaginado } from './api-modelos';

export interface EstudianteApi {
  idEstudiante: string | number;
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  cedula: string;
  numeroCelular: string | null;
  email: string;
  fechaNacimiento: string;
  fechaRegistro: string;
}

export interface EstudianteRequest {
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  cedula: string;
  numeroCelular: string | null;
  email: string;
  fechaNacimiento: string;
}

@Injectable({ providedIn: 'root' })
// Cliente HTTP de estudiantes; no contiene reglas de negocio propias.
export class EstudiantesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/admin/estudiantes`;

  listarPaginado(busqueda = '', pagina = 1, tamanoPagina = 20): Observable<ResultadoPaginado<EstudianteApi>> {
    let params = new HttpParams().set('pagina', pagina).set('tamanoPagina', tamanoPagina);
    if (busqueda.trim()) params = params.set('busqueda', busqueda.trim());
    return this.http.get<ResultadoPaginado<EstudianteApi>>(this.url, { params }).pipe(map((response) => ({ ...response, elementos: response.elementos.map((item) => ({ ...item, idEstudiante: item.cedula })) })));
  }
  listar(busqueda = ''): Observable<EstudianteApi[]> { return this.listarPaginado(busqueda).pipe(map((response) => response.elementos)); }
  obtener(cedula: string): Observable<EstudianteApi> { return this.http.get<EstudianteApi>(`${this.url}/${encodeURIComponent(cedula)}`).pipe(map((item) => ({ ...item, idEstudiante: item.cedula }))); }
  registrar(request: EstudianteRequest): Observable<{ cedula: string }> { return this.http.post<{ cedula: string }>(this.url, request); }
  actualizar(cedula: string, request: Omit<EstudianteRequest, 'cedula'>): Observable<void> { return this.http.put<void>(`${this.url}/${encodeURIComponent(cedula)}`, request); }
  borrar(cedula: string): Observable<void> { return this.http.delete<void>(`${this.url}/${encodeURIComponent(cedula)}`); }
}
