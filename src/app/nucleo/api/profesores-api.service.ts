import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ResultadoPaginado } from './api-modelos';
import { environment } from '../../../env/environment';

// La cuenta es opcional (RN-05): sin cuenta, idUsuario, email y activo vienen en null y roles vacío.
export interface ProfesorApi {
  idProfesor: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  cedula: string;
  numeroCelular: string | null;
  email: string | null;
  fechaNacimiento: string;
  idUsuario: string | null;
  fechaRegistro: string;
  activo: boolean;
  tieneCuenta: boolean;
  roles: string[];
}

interface ProfesorBackend {
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  cedula: string;
  numeroCelular: string | null;
  fechaNacimiento: string;
  idUsuario: string | null;
  email: string | null;
  activo: boolean | null;
  roles: string[] | null;
}

// Vincular un usuario existente (idUsuario) o crear uno nuevo (email + contrasena + roles); nunca las dos formas.
export type CuentaProfesorRequest = { idUsuario: string } | { email: string; contrasena: string; roles: string[] };

export interface ActualizarProfesorRequest {
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  numeroCelular: string | null;
  fechaNacimiento: string;
}

export interface RegistrarProfesorRequest extends ActualizarProfesorRequest {
  cedula: string;
  cuenta?: CuentaProfesorRequest | null;
}

@Injectable({ providedIn: 'root' })
// Cliente HTTP del CRUD de profesores y de su cuenta; el backend aplica las reglas SQL.
export class ProfesoresApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/admin/profesores`;

  listarPaginado(busqueda = '', pagina = 1, tamanoPagina = 20): Observable<ResultadoPaginado<ProfesorApi>> {
    let params = new HttpParams().set('pagina', pagina).set('tamanoPagina', tamanoPagina);
    if (busqueda.trim()) params = params.set('busqueda', busqueda.trim());
    return this.http.get<ResultadoPaginado<ProfesorBackend>>(this.url, { params }).pipe(map((response) => ({ ...response, elementos: response.elementos.map((item) => ({ ...item, idProfesor: item.cedula, fechaRegistro: '', tieneCuenta: Boolean(item.idUsuario), activo: item.activo === true, roles: item.roles ?? [] })) })));
  }
  listar(busqueda = ''): Observable<ProfesorApi[]> { return this.listarPaginado(busqueda).pipe(map((response) => response.elementos)); }
  registrar(request: RegistrarProfesorRequest): Observable<{ cedula: string }> { return this.http.post<{ cedula: string }>(this.url, request); }
  actualizar(cedula: string, request: ActualizarProfesorRequest): Observable<void> { return this.http.put<void>(`${this.url}/${encodeURIComponent(cedula)}`, request); }
  crearCuenta(cedula: string, cuenta: CuentaProfesorRequest): Observable<{ idUsuario: string }> { return this.http.post<{ idUsuario: string }>(`${this.url}/${encodeURIComponent(cedula)}/cuenta`, cuenta); }
  quitarCuenta(cedula: string): Observable<void> { return this.http.delete<void>(`${this.url}/${encodeURIComponent(cedula)}/cuenta`); }
  borrar(cedula: string): Observable<void> { return this.http.delete<void>(`${this.url}/${encodeURIComponent(cedula)}`); }
}
