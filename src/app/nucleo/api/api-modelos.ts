export { API_URL } from './api.config';

export interface ResultadoPaginado<T> {
  elementos: T[];
  pagina: number;
  tamanoPagina: number;
  total: number;
}
