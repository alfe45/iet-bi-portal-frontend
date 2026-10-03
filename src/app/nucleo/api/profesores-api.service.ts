import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URL, ResultadoPaginado } from './api-modelos';

export interface ProfesorApi {
  idProfesor: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  cedula: string;
  numeroCelular: string | null;
  email: string;
  fechaNacimiento: string;
  idUsuario: string;
  fechaRegistro: string;
  activo: boolean;
}

interface ProfesorBackend {
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  cedula: string;
  numeroCelular: string | null;
  fechaNacimiento: string;
  idUsuario: string;
  email: string;
}

export interface RegistrarProfesorRequest {
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  cedula: string;
  numeroCelular: string | null;
  fechaNacimiento: string;
  idUsuario: string;
}

export interface ActualizarProfesorRequest {
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  numeroCelular: string | null;
  fechaNacimiento: string;
}

@Injectable({ providedIn: 'root' })
// Cliente HTTP del CRUD de profesores; el backend aplica las reglas SQL.
export class ProfesoresApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/admin/profesores`;

  listar(): Observable<ProfesorApi[]> {
    return this.http.get<ResultadoPaginado<ProfesorBackend>>(this.url).pipe(map((response) => response.elementos.map((item) => ({ ...item, idProfesor: item.cedula, fechaRegistro: '', activo: true }))));
  }
  registrar(request: RegistrarProfesorRequest): Observable<{ cedula: string }> { return this.http.post<{ cedula: string }>(this.url, request); }
  actualizar(cedula: string, request: ActualizarProfesorRequest): Observable<void> { return this.http.put<void>(`${this.url}/${encodeURIComponent(cedula)}`, request); }
  borrar(cedula: string): Observable<void> { return this.http.delete<void>(`${this.url}/${encodeURIComponent(cedula)}`); }
}
