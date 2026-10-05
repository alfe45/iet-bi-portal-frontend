import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, ResultadoPaginado } from './api-modelos';

export interface UsuarioAdminApi {
  id: string;
  email: string;
  activo: boolean;
  bloqueadoHasta: string | null;
  ultimoLogin: string | null;
  creadoEn: string;
  roles: string[];
  cantidadSesiones: number;
  cedulaProfesor: string | null;
  nombreProfesor: string | null;
  intentosFallidosLogin?: number;
  passwordCambiadaEn?: string | null;
  actualizadoEn?: string | null;
  tokensInvalidadosDesde?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UsuariosApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/admin/usuarios`;

  listar(busqueda = '', pagina = 1, tamanoPagina = 20): Observable<ResultadoPaginado<UsuarioAdminApi>> {
    let params = new HttpParams().set('pagina', pagina).set('tamanoPagina', tamanoPagina);
    if (busqueda.trim()) params = params.set('busqueda', busqueda.trim());
    return this.http.get<ResultadoPaginado<UsuarioAdminApi>>(this.url, { params });
  }

  obtener(id: string): Observable<UsuarioAdminApi> {
    return this.http.get<UsuarioAdminApi>(`${this.url}/${id}`);
  }

  registrar(email: string, contrasena: string): Observable<{ id: string; email: string }> {
    return this.http.post<{ id: string; email: string }>(this.url, { email, contrasena });
  }

  actualizarEmail(id: string, email: string): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/email`, { email });
  }

  resetearContrasena(id: string, contrasenaNueva: string): Observable<void> {
    return this.http.post<void>(`${this.url}/${id}/resetear-contrasena`, { contrasenaNueva });
  }

  activar(id: string): Observable<void> { return this.http.post<void>(`${this.url}/${id}/activar`, {}); }
  desactivar(id: string): Observable<void> { return this.http.post<void>(`${this.url}/${id}/desactivar`, {}); }
  agregarRol(id: string, rol: string): Observable<void> { return this.http.post<void>(`${this.url}/${id}/roles`, { rol }); }
  quitarRol(id: string, rol: string): Observable<void> { return this.http.delete<void>(`${this.url}/${id}/roles/${encodeURIComponent(rol)}`); }
  borrar(id: string): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
