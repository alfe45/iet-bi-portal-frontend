import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, ResultadoPaginado } from './api-modelos';

export interface AsignaturaApi {
  codigo: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  imparteNivel10: boolean;
  imparteNivel11: boolean;
}

export interface AsignaturaRequest {
  codigo?: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  imparteNivel10: boolean;
  imparteNivel11: boolean;
}

@Injectable({ providedIn: 'root' })
export class AsignaturasApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/admin/asignaturas`;

  listar(): Observable<ResultadoPaginado<AsignaturaApi>> { return this.http.get<ResultadoPaginado<AsignaturaApi>>(this.url); }
  registrar(request: AsignaturaRequest): Observable<{ codigo: string }> { return this.http.post<{ codigo: string }>(this.url, request); }
  actualizar(codigo: string, request: Omit<AsignaturaRequest, 'codigo'>): Observable<void> { return this.http.put<void>(`${this.url}/${encodeURIComponent(codigo)}`, request); }
  borrar(codigo: string): Observable<void> { return this.http.delete<void>(`${this.url}/${encodeURIComponent(codigo)}`); }
}
