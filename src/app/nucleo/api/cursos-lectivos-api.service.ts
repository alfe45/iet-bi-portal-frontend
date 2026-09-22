import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CursoLectivoApi {
  idCursoLectivo: number;
  yearCiclo: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface CursoLectivoRequest {
  yearCiclo: number;
  fechaInicioI: string;
  fechaFinI: string;
  fechaInicioII: string;
  fechaFinII: string;
}

@Injectable({ providedIn: 'root' })
// Cliente HTTP de cursos lectivos y sus semestres.
export class CursosLectivosApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:5149/api/cursos-lectivos';

  listar(): Observable<CursoLectivoApi[]> { return this.http.get<CursoLectivoApi[]>(this.url); }
  abrir(request: CursoLectivoRequest): Observable<{ idCursoLectivo: number }> { return this.http.post<{ idCursoLectivo: number }>(this.url, request); }
  actualizar(request: CursoLectivoRequest): Observable<{ idCursoLectivo: number }> { return this.http.put<{ idCursoLectivo: number }>(this.url, request); }
  borrar(yearCiclo: number): Observable<{ idCursoLectivo: number }> { return this.http.delete<{ idCursoLectivo: number }>(`${this.url}/${yearCiclo}`); }
}
