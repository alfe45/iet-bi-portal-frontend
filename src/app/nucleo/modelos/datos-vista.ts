export type FuncionalidadAdministrativa =
  | 'profesores'
  | 'estudiantes'
  | 'periodos'
  | 'secciones'
  | 'matriculas'
  | 'asignaturas'
  | 'asignaciones';

export interface RegistroVista {
  id: string;
  [key: string]: string;
}

export interface EvaluacionVista {
  estudianteId: string;
  valor: string;
  observacion: string;
  asignatura?: string;
  seccion?: string;
  periodo?: string;
}

export interface AusentismoVista {
  estudianteId: string;
  tardias: number;
  justificadas: number;
  injustificadas: number;
  asignatura?: string;
  seccion?: string;
  periodo?: string;
}
