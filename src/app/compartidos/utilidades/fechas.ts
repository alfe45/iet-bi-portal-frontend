/** Zona horaria del Instituto: "hoy" y las fechas de registro se muestran en hora de Costa Rica (RD-018). */
export const ZONA_COSTA_RICA = 'America/Costa_Rica';

/**
 * Fecha-hora de la API (UTC) como dd/MM/aaaa en hora de Costa Rica. Una fecha sin hora (aaaa-MM-dd)
 * se muestra tal cual, sin pasar por UTC, para no correrla un día.
 */
export function fechaCostaRica(valor: string | null | undefined): string {
  if (!valor) return '';
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (soloFecha) return `${soloFecha[3]}/${soloFecha[2]}/${soloFecha[1]}`;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return new Intl.DateTimeFormat('es-CR', { timeZone: ZONA_COSTA_RICA, day: '2-digit', month: '2-digit', year: 'numeric' }).format(fecha);
}
