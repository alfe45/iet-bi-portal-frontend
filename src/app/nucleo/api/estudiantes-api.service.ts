import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EstudianteApi {
  idEstudiante: number;
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
  private readonly url = 'http://localhost:5149/api/estudiantes';

  listar(): Observable<EstudianteApi[]> { return this.http.get<EstudianteApi[]>(this.url); }
  registrar(request: EstudianteRequest): Observable<{ idEstudiante: number }> { return this.http.post<{ idEstudiante: number }>(this.url, request); }
  actualizar(cedulaActual: string, request: EstudianteRequest): Observable<{ idEstudiante: number }> { return this.http.put<{ idEstudiante: number }>(`${this.url}/${encodeURIComponent(cedulaActual)}`, request); }
  borrar(cedula: string): Observable<{ idEstudiante: number }> { return this.http.delete<{ idEstudiante: number }>(`${this.url}/${encodeURIComponent(cedula)}`); }
}
