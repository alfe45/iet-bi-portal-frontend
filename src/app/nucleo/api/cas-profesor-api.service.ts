import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../env/environment';

export interface ProgresoCasApi {
  anio: number;
  seccion: string;
  cedulaEstudiante: string;
  nombreEstudiante: string;
  nombreProfesor: string;
  semestre: string;
  tieneInforme: boolean;
  experiencias: number;
  perfil: boolean;
  entrevistas: number;
  nota: string | null;
  notaEnviada: boolean;
}

export interface ExperienciaCasApi {
  orden: number;
  descripcion: string;
  fecha: string | null;
  creatividad: boolean;
  actividad: boolean;
  servicio: boolean;
  resultadosAprendizaje: number[];
  carpeta: boolean;
  reflexion: boolean;
  pruebas: boolean;
}

export interface InformeCasApi {
  anio: number;
  semestre: string;
  seccion: string;
  cedulaEstudiante: string;
  nombreEstudiante: string;
  emailEstudiante: string;
  cedulaProfesor: string;
  nombreProfesor: string;
  perfil: boolean;
  entrevista1: boolean;
  entrevista2: boolean;
  entrevistaFinal: boolean;
  observaciones: string | null;
  nota: string | null;
  notaEnviada: boolean;
  modificadoEn: string;
  experiencias: ExperienciaCasApi[];
}

export interface ConsultaProgresoCasApi {
  anio: number;
  semestre: string;
  nivel?: number;
  numero?: number;
}

export interface GuardarInformeCasRequest {
  perfil: boolean;
  entrevista1: boolean;
  entrevista2: boolean;
  entrevistaFinal: boolean;
  observaciones: string | null;
  experiencias: { descripcion: string; fecha: string | null; creatividad: boolean; actividad: boolean; servicio: boolean; resultadosAprendizaje: number[]; carpeta: boolean; reflexion: boolean; pruebas: boolean }[];
}

@Injectable({ providedIn: 'root' })
// Cliente HTTP de los informes CAS del Profesor CAS (solo su sección asignada; el backend valida la propiedad).
export class CasProfesorApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/profesor/cas/informes`;

  progreso(anio: number, nivel: number, numero: number, semestre: string): Observable<ProgresoCasApi[]> {
    const params = new HttpParams().set('anio', anio).set('nivel', nivel).set('numero', numero).set('semestre', semestre);
    return this.http.get<ProgresoCasApi[]>(this.url, { params });
  }

  obtener(anio: number, semestre: string, cedula: string): Observable<InformeCasApi> {
    return this.http.get<InformeCasApi>(`${this.url}/${anio}/${encodeURIComponent(semestre)}/${encodeURIComponent(cedula)}`);
  }

  guardar(anio: number, semestre: string, cedula: string, request: GuardarInformeCasRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/${anio}/${encodeURIComponent(semestre)}/${encodeURIComponent(cedula)}`, request);
  }

  progresoGeneral(consulta: ConsultaProgresoCasApi): Observable<ProgresoCasApi[]> {
    let params = new HttpParams().set('anio', consulta.anio).set('semestre', consulta.semestre);
    if (consulta.nivel !== undefined) params = params.set('nivel', consulta.nivel);
    if (consulta.numero !== undefined) params = params.set('numero', consulta.numero);
    return this.http.get<ProgresoCasApi[]>(`${environment.apiUrl}/profesor/coordinacion-cas/progreso`, { params });
  }

  informesEstudiante(anio: number, semestre: string, cedula: string): Observable<InformeCasApi[]> {
    return this.http.get<InformeCasApi[]>(`${environment.apiUrl}/profesor/coordinacion-cas/informes/${anio}/${encodeURIComponent(semestre)}/${encodeURIComponent(cedula)}`);
  }
}
