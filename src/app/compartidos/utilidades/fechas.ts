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

/** "Hoy" en hora de Costa Rica como aaaa-MM-dd (para comparar con fechas de la API). */
export function hoyCostaRica(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_COSTA_RICA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/** Hora actual en Costa Rica como HH:mm (RD-050: la lección se registra en hora local, no en UTC). */
export function horaCostaRica(): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: ZONA_COSTA_RICA, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}
