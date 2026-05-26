/** Porcentaje de avance en una guía (0–100). */
export function calcularPorcentajeProgreso(
  numPasos: number,
  pasosCompletados: number[],
  completado: boolean
): number {
  if (completado) return 100;
  if (numPasos <= 0) return 0;
  return Math.min(
    100,
    Math.round((pasosCompletados.length / numPasos) * 100)
  );
}
