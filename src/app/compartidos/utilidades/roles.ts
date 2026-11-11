// Color de la insignia de cada rol: el mismo que su tarjeta en el paso «Roles» del formulario de profesor.
// Acepta el nombre que muestra el portal o el código del backend.
export function claseInsigniaRol(rol: string): string {
  const valor = rol.trim();
  if (valor === 'Administrador' || valor === 'ADMIN') return 'insignia-rol insignia-rol--admin';
  if (valor === 'Profesor Guía' || valor === 'GUIA') return 'insignia-rol insignia-rol--guia';
  if (valor.includes('Monografía') || valor === 'COORD_MONOGRAFIA') return 'insignia-rol insignia-rol--monografia';
  if (valor.includes('CAS')) return 'insignia-rol insignia-rol--cas';
  return 'insignia-rol';
}
