import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SeccionApi {
  idSeccion: number;
  yearCiclo: number;
  seccion: string;
}

export interface SeccionRequest {
  yearCiclo: number;
  nivel: number;
  numeroSeccion: number;
}

@Injectable({ providedIn: 'root' })
// Cliente HTTP de secciones académicas.
export class SeccionesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:5149/api/secciones';

  listar(): Observable<SeccionApi[]> { return this.http.get<SeccionApi[]>(this.url); }
  registrar(request: SeccionRequest): Observable<{ idSeccion: number }> { return this.http.post<{ idSeccion: number }>(this.url, request); }
  borrar(yearCiclo: number, nivel: number, numeroSeccion: number): Observable<{ idSeccion: number }> { return this.http.delete<{ idSeccion: number }>(`${this.url}/${yearCiclo}/${nivel}/${numeroSeccion}`); }
}
