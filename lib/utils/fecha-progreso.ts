/**
 * Devuelve el "día del progreso" en formato YYYY-MM-DD en hora local del navegador.
 * Se usa como clave de reset: si la fecha del progreso almacenado difiere de hoy,
 * el progreso se considera caducado y debe reiniciarse.
 */
export function diaProgresoLocal(fecha: Date = new Date()): string {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${año}-${mes}-${dia}`;
}

/** Devuelve true si el ISO string representa una fecha del día actual local. */
export function esFechaDeHoy(iso?: string | null): boolean {
  if (!iso) return false;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return false;
  return diaProgresoLocal(fecha) === diaProgresoLocal();
}
