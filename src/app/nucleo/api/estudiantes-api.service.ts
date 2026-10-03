import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  listar(): Observable<EstudianteApi[]> { return this.http.get<ResultadoPaginado<EstudianteApi>>(this.url).pipe(map((response) => response.elementos.map((item) => ({ ...item, idEstudiante: item.cedula })))); }
  registrar(request: EstudianteRequest): Observable<{ cedula: string }> { return this.http.post<{ cedula: string }>(this.url, request); }
  actualizar(cedula: string, request: Omit<EstudianteRequest, 'cedula'>): Observable<void> { return this.http.put<void>(`${this.url}/${encodeURIComponent(cedula)}`, request); }
  borrar(cedula: string): Observable<void> { return this.http.delete<void>(`${this.url}/${encodeURIComponent(cedula)}`); }
}
