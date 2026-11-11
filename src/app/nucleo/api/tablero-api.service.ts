import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../env/environment';

// Respuesta de GET /api/admin/tablero (RP-62). Sin cursos lectivos: periodo null y los bloques del periodo ausentes.
export interface TableroAdminApi {
  periodo: {
    anio: number;
    estado: 'PROGRAMADO' | 'EN_CURSO' | 'FINALIZADO';
    semestreActual: string | null;
    semestreNotas: string;
    inicioSemestre: string;
    finSemestre: string;
    diasParaFinSemestre: number | null;
  } | null;
  aniosDisponibles: number[];
  estudiantes?: { matriculados: number; retirados: number; nivel11: number; nivel12: number } | null;
  secciones?: { total: number; sinGuia: number } | null;
  profesores?: { activos: number; inactivos: number; sinAsignacion: number } | null;
  cargaDocente?: { asignaciones: number; seccionesSinAsignaciones: number } | null;
  notas?: {
    asignaciones: number;
    confirmadas: number;
    completasSinConfirmar: number;
    incompletas: number;
    porNivel: Array<{ nivel: number; confirmadas: number; completasSinConfirmar: number; incompletas: number }>;
  } | null;
  monografias?: {
    enCurso: number;
    terminadas: number;
    porCohorte: Array<{ cohorte: number; capacitacion: number; investigacion: number; terminada: number }>;
  } | null;
  matriculaPorSeccion?: Array<{ seccion: string; nivel: number; activos: number; retirados: number; guia: string | null }> | null;
  ausentismo?: Array<{ seccion: string; lecciones: number; injustificadas: number; justificadas: number; tardias: number; injustificadasPorLeccion: number | null }> | null;
  alertas: AlertaTableroApi[];
  actividad: Array<{ accion: string; usuario: string | null; registro: string | null; fecha: string }>;
}

export interface AlertaTableroApi {
  codigo: string;
  nivel: 'PRIORIDAD' | 'AVISO' | 'INFO';
  cantidad: number;
  diasParaCierre: number | null;
  detalle: unknown[];
}

@Injectable({ providedIn: 'root' })
export class TableroApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/admin/tablero`;

  obtener(anio?: number | null): Observable<TableroAdminApi> {
    const params = anio ? new HttpParams().set('anio', anio) : undefined;
    return this.http.get<TableroAdminApi>(this.url, { params });
  }
}
