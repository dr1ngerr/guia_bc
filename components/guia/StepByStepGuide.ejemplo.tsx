"use client";

/**
 * Ejemplo de uso de StepByStepGuide (solo desarrollo / Storybook).
 * No se importa en producción.
 */
import { StepByStepGuide } from "@/components/guia/StepByStepGuide";
import { ejemploGuiaDevoluciones } from "@/lib/guia/ejemplo-devoluciones";

export function StepByStepGuideEjemplo() {
  return (
    <div className="min-h-screen flex flex-col">
      <StepByStepGuide
        guideId={ejemploGuiaDevoluciones.guideId}
        title={ejemploGuiaDevoluciones.title}
        steps={ejemploGuiaDevoluciones.steps}
        totalEstimatedTime={ejemploGuiaDevoluciones.totalEstimatedTime}
        confirmOnCheck
        onFinish={() => console.log("Guía de ejemplo finalizada")}
      />
    </div>
  );
}
