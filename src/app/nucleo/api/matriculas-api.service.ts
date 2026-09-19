import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MatriculaApi {
  idMatricula: number;
  yearCiclo: number;
  idSeccion: number;
  seccion: string;
  fechaMatricula: string;
  estado: string;
  fechaFinalizacion: string | null;
}

export interface MatriculaNivel10Request {
  cedulaEstudiante: string;
  yearCiclo: number;
  numeroSeccion: number;
}

@Injectable({ providedIn: 'root' })
// Cliente de las acciones de matrícula definidas por el SQL.
export class MatriculasApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:5149/api/matriculas';

  listarPorCedula(cedula: string): Observable<MatriculaApi[]> { return this.http.get<MatriculaApi[]>(`${this.url}/estudiante/${encodeURIComponent(cedula)}`); }
  registrarNivel10(request: MatriculaNivel10Request): Observable<{ idMatricula: number }> { return this.http.post<{ idMatricula: number }>(`${this.url}/nivel-10`, request); }
  registrarNivel11(cedula: string): Observable<{ idMatricula: number }> { return this.http.post<{ idMatricula: number }>(`${this.url}/nivel-11`, JSON.stringify(cedula), { headers: { 'Content-Type': 'application/json' } }); }
  finalizar(idMatricula: number): Observable<{ idMatricula: number }> { return this.http.patch<{ idMatricula: number }>(`${this.url}/${idMatricula}/finalizar`, {}); }
  borrar(idMatricula: number): Observable<{ idMatricula: number }> { return this.http.delete<{ idMatricula: number }>(`${this.url}/${idMatricula}`); }
}
