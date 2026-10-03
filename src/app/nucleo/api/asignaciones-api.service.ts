import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, ResultadoPaginado } from './api-modelos';

export interface AsignacionApi {
  anio: number;
  nivel: number;
  numero: number;
  seccion: string;
  codigoAsignatura: string;
  asignatura: string;
  cedulaProfesor: string;
  nombreProfesor: string;
}

export interface RegistrarAsignacionRequest {
  anio: number;
  nivel: number;
  numero: number;
  codigoAsignatura: string;
  cedulaProfesor: string;
}

@Injectable({ providedIn: 'root' })
export class AsignacionesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/admin/asignaciones`;

  listar(): Observable<ResultadoPaginado<AsignacionApi>> { return this.http.get<ResultadoPaginado<AsignacionApi>>(this.url); }
  registrar(request: RegistrarAsignacionRequest): Observable<void> { return this.http.post<void>(this.url, request); }
  cambiarProfesor(anio: number, nivel: number, numero: number, codigo: string, cedula: string, cedulaProfesorNuevo: string): Observable<void> {
    return this.http.put<void>(`${this.url}/${anio}/${nivel}/${numero}/${encodeURIComponent(codigo)}/${encodeURIComponent(cedula)}/profesor`, { cedulaProfesorNuevo });
  }
  borrar(anio: number, nivel: number, numero: number, codigo: string, cedula: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${anio}/${nivel}/${numero}/${encodeURIComponent(codigo)}/${encodeURIComponent(cedula)}`);
  }
}
