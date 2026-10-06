import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ResultadoPaginado } from './api-modelos';
import { environment } from '../../../env/environment';

export interface ConsultaSecciones {
  anio?: number;
  nivel?: number;
  pagina?: number;
  tamanoPagina?: number;
}

export interface SeccionApi {
  idSeccion: string;
  yearCiclo: number;
  seccion: string;
  anio: number;
  nivel: number;
  numero: number;
  nombre: string;
  cedulaGuia: string | null;
  nombreGuia: string | null;
  cantidadEstudiantes: number;
}

export interface SeccionRequest {
  anio: number;
  nivel: number;
  numero: number;
}

@Injectable({ providedIn: 'root' })
// Cliente HTTP de secciones académicas.
export class SeccionesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/admin/secciones`;

  listarPaginado(consulta: ConsultaSecciones = {}): Observable<ResultadoPaginado<SeccionApi>> {
    let params = new URLSearchParams();
    for (const [key, value] of Object.entries(consulta)) if (value !== undefined) params.set(key, String(value));
    return this.http.get<ResultadoPaginado<SeccionApi>>(this.url, { params: Object.fromEntries(params.entries()) }).pipe(map((response) => ({ ...response, elementos: response.elementos.map((item) => ({ ...item, idSeccion: `${item.anio}-${item.nivel}-${item.numero}`, yearCiclo: item.anio, seccion: item.nombre })) })));
  }
  listar(): Observable<SeccionApi[]> { return this.listarPaginado().pipe(map((response) => response.elementos)); }
  registrar(request: SeccionRequest): Observable<{ anio: number; nombre: string }> { return this.http.post<{ anio: number; nombre: string }>(this.url, request); }
  borrar(anio: number, nivel: number, numero: number): Observable<void> { return this.http.delete<void>(`${this.url}/${anio}/${nivel}/${numero}`); }
  asignarGuia(anio: number, nivel: number, numero: number, cedulaProfesor: string): Observable<void> { return this.http.put<void>(`${this.url}/${anio}/${nivel}/${numero}/guia`, { cedulaProfesor }); }
  quitarGuia(anio: number, nivel: number, numero: number): Observable<void> { return this.http.delete<void>(`${this.url}/${anio}/${nivel}/${numero}/guia`); }
}
