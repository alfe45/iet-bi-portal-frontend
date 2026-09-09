export type RolUsuario =
  | 'Administrador'
  | 'Profesor regular'
  | 'Profesor Guía'
  | 'Profesor Coordinador de Monografía';

export interface TarjetaEstadistica {
  label: string;
  value: string;
  trend?: string;
  tone?: 'primary' | 'success' | 'danger' | 'neutral';
}

export interface ColumnaTabla {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'avatar' | 'actions' | 'list';
}

export interface AccionTabla {
  label: string;
  code?: string;
  tone?: 'default' | 'danger';
}
