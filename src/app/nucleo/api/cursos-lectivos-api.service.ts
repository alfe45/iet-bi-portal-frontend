import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ResultadoPaginado } from './api-modelos';
import { environment } from '../../../env/environment';

export interface CursoLectivoApi {
  idCursoLectivo: string | number;
  yearCiclo: number;
  anio: number;
  inicioSemestreI: string;
  finSemestreI: string;
  inicioSemestreII: string;
  finSemestreII: string;
  estado: string;
  semestreActual: string | null;
  fechaInicio: string;
  fechaFin: string;
}

export interface CursoLectivoRequest {
  anio: number;
  inicioSemestreI: string;
  finSemestreI: string;
  inicioSemestreII: string;
  finSemestreII: string;
}

export interface PeriodoActualApi {
  anio: number;
  inicioSemestreI: string;
  finSemestreI: string;
  inicioSemestreII: string;
  finSemestreII: string;
  estado: string;
  semestreActual: string | null;
}

@Injectable({ providedIn: 'root' })
// Cliente HTTP de cursos lectivos y sus semestres.
export class CursosLectivosApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/admin/periodos`;

  listarPaginado(pagina = 1, tamanoPagina = 20): Observable<ResultadoPaginado<CursoLectivoApi>> {
    const params = { pagina, tamanoPagina };
    return this.http.get<ResultadoPaginado<CursoLectivoApi>>(this.url, { params }).pipe(map((response) => ({ ...response, elementos: response.elementos.map((item) => ({ ...item, idCursoLectivo: String(item.anio), yearCiclo: item.anio, fechaInicio: item.inicioSemestreI, fechaFin: item.finSemestreII })) })));
  }
  listar(): Observable<CursoLectivoApi[]> { return this.listarPaginado().pipe(map((response) => response.elementos)); }
  obtenerActual(): Observable<PeriodoActualApi> { return this.http.get<PeriodoActualApi>(`${environment.apiUrl}/periodos/actual`); }
  abrir(request: CursoLectivoRequest): Observable<{ anio: number }> { return this.http.post<{ anio: number }>(this.url, request); }
  actualizar(anio: number, request: Omit<CursoLectivoRequest, 'anio'>): Observable<void> { return this.http.put<void>(`${this.url}/${anio}`, request); }
  borrar(anio: number): Observable<void> { return this.http.delete<void>(`${this.url}/${anio}`); }
}
