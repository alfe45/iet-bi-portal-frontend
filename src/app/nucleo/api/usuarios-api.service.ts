import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}

@Injectable({ providedIn: 'root' })
export class UsuariosApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/admin/usuarios`;

  listar(): Observable<ResultadoPaginado<UsuarioAdminApi>> {
    return this.http.get<ResultadoPaginado<UsuarioAdminApi>>(this.url);
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
