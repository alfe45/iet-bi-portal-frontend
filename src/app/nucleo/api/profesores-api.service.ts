import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProfesorApi {
  idProfesor: number;
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  cedula: string;
  numeroCelular: string | null;
  email: string;
  fechaNacimiento: string;
  fechaRegistro: string;
  activo: boolean;
}

export interface ProfesorRequest {
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  cedula: string;
  numeroCelular: string | null;
  email: string;
  fechaNacimiento: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
// Cliente HTTP del CRUD de profesores; el backend aplica las reglas SQL.
export class ProfesoresApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:5149/api/profesores';

  // Consulta la vista pública de profesores.
  listar(): Observable<ProfesorApi[]> { return this.http.get<ProfesorApi[]>(this.url); }
  registrar(request: ProfesorRequest): Observable<{ idProfesor: number }> { return this.http.post<{ idProfesor: number }>(this.url, request); }
  actualizar(cedulaActual: string, request: ProfesorRequest): Observable<{ idProfesor: number }> { return this.http.put<{ idProfesor: number }>(`${this.url}/${encodeURIComponent(cedulaActual)}`, request); }
  activar(cedula: string): Observable<{ idProfesor: number }> { return this.http.patch<{ idProfesor: number }>(`${this.url}/${encodeURIComponent(cedula)}/activar`, {}); }
  desactivar(cedula: string): Observable<{ idProfesor: number }> { return this.http.patch<{ idProfesor: number }>(`${this.url}/${encodeURIComponent(cedula)}/desactivar`, {}); }
  borrar(cedula: string): Observable<{ idProfesor: number }> { return this.http.delete<{ idProfesor: number }>(`${this.url}/${encodeURIComponent(cedula)}`); }
}
