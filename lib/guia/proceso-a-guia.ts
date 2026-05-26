import { formatearDuracion } from "@/lib/utils";
import type { GuideStep } from "@/lib/guia/step-by-step-types";
import type { ProcesoConPasos } from "@/lib/supabase/tipos";

/** Convierte un proceso de Supabase al formato de StepByStepGuide. */
export function procesoAGuia(proceso: ProcesoConPasos): {
  guideId: string;
  title: string;
  totalEstimatedTime: string;
  steps: GuideStep[];
} {
  const totalPasos = proceso.pasos.length || 1;
  const minutosPorPaso =
    proceso.duracion_minutos != null
      ? Math.max(1, Math.round(proceso.duracion_minutos / totalPasos))
      : undefined;

  const steps: GuideStep[] = proceso.pasos.map((paso) => ({
    title: paso.titulo,
    description: paso.descripcion ?? "",
    estimatedMinutes: minutosPorPaso,
    helpText: paso.consejo ?? paso.texto_alerta ?? undefined,
    imageUrl: paso.capturas[0]?.url,
  }));

  return {
    guideId: proceso.id,
    title: proceso.nombre,
    totalEstimatedTime: formatearDuracion(proceso.duracion_minutos),
    steps,
  };
}
