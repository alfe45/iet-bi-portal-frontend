import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResultadoPaginado } from './api-modelos';
import { environment } from '../../../env/environment';

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

export interface ConsultaAsignaturas {
  tipo?: string;
  nivel?: number;
  pagina?: number;
  tamanoPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class AsignaturasApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/admin/asignaturas`;

  listar(consulta: ConsultaAsignaturas = {}): Observable<ResultadoPaginado<AsignaturaApi>> {
    let params = new URLSearchParams();
    for (const [key, value] of Object.entries(consulta)) if (value !== undefined) params.set(key, String(value));
    return this.http.get<ResultadoPaginado<AsignaturaApi>>(this.url, { params: Object.fromEntries(params.entries()) });
  }
  registrar(request: AsignaturaRequest): Observable<{ codigo: string }> { return this.http.post<{ codigo: string }>(this.url, request); }
  actualizar(codigo: string, request: Omit<AsignaturaRequest, 'codigo'>): Observable<void> { return this.http.put<void>(`${this.url}/${encodeURIComponent(codigo)}`, request); }
  borrar(codigo: string): Observable<void> { return this.http.delete<void>(`${this.url}/${encodeURIComponent(codigo)}`); }
}
