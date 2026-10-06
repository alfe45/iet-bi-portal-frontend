export interface ResultadoPaginado<T> {
  elementos: T[];
  pagina: number;
  tamanoPagina: number;
  total: number;
}
