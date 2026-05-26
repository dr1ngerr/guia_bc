import type { GuideProgressState } from "@/lib/guia/step-by-step-types";

const VERSION = 1;

export function claveProgresoGuia(guideId: string): string {
  return `guide_progress_${guideId}`;
}

export function estadoInicialProgreso(): GuideProgressState {
  return {
    currentStep: 0,
    completedSteps: [],
    isFullscreenMode: false,
    timerStartedAt: null,
    elapsedSeconds: 0,
    feedback: {},
    finished: false,
  };
}

export function cargarProgresoGuia(guideId: string): GuideProgressState {
  if (typeof window === "undefined") return estadoInicialProgreso();

  try {
    const raw = localStorage.getItem(claveProgresoGuia(guideId));
    if (!raw) return estadoInicialProgreso();

    const parsed = JSON.parse(raw) as GuideProgressState & { v?: number };
    if (parsed.v !== VERSION) return estadoInicialProgreso();

    return {
      ...estadoInicialProgreso(),
      ...parsed,
      completedSteps: Array.isArray(parsed.completedSteps)
        ? parsed.completedSteps.filter((n) => typeof n === "number")
        : [],
      feedback:
        parsed.feedback && typeof parsed.feedback === "object"
          ? parsed.feedback
          : {},
    };
  } catch {
    return estadoInicialProgreso();
  }
}

export function guardarProgresoGuia(
  guideId: string,
  estado: GuideProgressState
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      claveProgresoGuia(guideId),
      JSON.stringify({ ...estado, v: VERSION })
    );
  } catch {
    // Cuota superada u otro error: ignorar
  }
}

export function reiniciarProgresoGuia(guideId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(claveProgresoGuia(guideId));
}

/** Suma minutos estimados de pasos no completados desde el índice actual. */
export function minutosRestantes(
  steps: { estimatedMinutes?: number }[],
  desdeIndice: number,
  completados: number[]
): number {
  return steps.reduce((acc, paso, i) => {
    if (i < desdeIndice || completados.includes(i)) return acc;
    return acc + (paso.estimatedMinutes ?? 0);
  }, 0);
}

export function formatearMinutosRestantes(minutos: number): string {
  if (minutos <= 0) return "~0 min";
  if (minutos < 60) return `~${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `~${h}h ${m}min` : `~${h}h`;
}

export function formatearTiempoTranscurrido(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
