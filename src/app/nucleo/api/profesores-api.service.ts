import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ResultadoPaginado } from './api-modelos';
import { environment } from '../../../env/environment';

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
  private readonly url = `${environment.apiUrl}/admin/profesores`;

  listarPaginado(busqueda = '', pagina = 1, tamanoPagina = 20): Observable<ResultadoPaginado<ProfesorApi>> {
    let params = new HttpParams().set('pagina', pagina).set('tamanoPagina', tamanoPagina);
    if (busqueda.trim()) params = params.set('busqueda', busqueda.trim());
    return this.http.get<ResultadoPaginado<ProfesorBackend>>(this.url, { params }).pipe(map((response) => ({ ...response, elementos: response.elementos.map((item) => ({ ...item, idProfesor: item.cedula, fechaRegistro: '', activo: true })) })));
  }
  listar(busqueda = ''): Observable<ProfesorApi[]> { return this.listarPaginado(busqueda).pipe(map((response) => response.elementos)); }
  registrar(request: RegistrarProfesorRequest): Observable<{ cedula: string }> { return this.http.post<{ cedula: string }>(this.url, request); }
  actualizar(cedula: string, request: ActualizarProfesorRequest): Observable<void> { return this.http.put<void>(`${this.url}/${encodeURIComponent(cedula)}`, request); }
  borrar(cedula: string): Observable<void> { return this.http.delete<void>(`${this.url}/${encodeURIComponent(cedula)}`); }
}
