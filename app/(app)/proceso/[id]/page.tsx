"use client";

import { useCallback, useEffect } from "react";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, Printer } from "lucide-react";
import { useProceso } from "@/hooks/useProceso";
import { useProgreso } from "@/hooks/useProgreso";
import { usePerfil } from "@/hooks/usePerfil";
import { PanelPaso } from "@/components/guia/PanelPaso";
import { StepByStepGuide } from "@/components/guia/StepByStepGuide";
import { procesoAGuia } from "@/lib/guia/proceso-a-guia";
import { Button } from "@/components/ui/button";

export default function ProcesoGuiaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { proceso, cargando, error } = useProceso(id);
  const { guardar } = useProgreso(id);
  const { esAdmin } = usePerfil();
  const printAll = searchParams.get("print") === "all";

  useEffect(() => {
    if (!printAll || !proceso) return;
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, [printAll, proceso]);

  const persistirProgreso = useCallback(
    async (pasoActual: number, pasosCompletados: number[]) => {
      await guardar({
        paso_actual: pasoActual,
        pasos_completados: pasosCompletados,
        verificaciones_marcadas: [],
        completado_en: null,
      });
    },
    [guardar]
  );

  const finalizarEnServidor = useCallback(async () => {
    const total = proceso?.pasos.length ?? 0;
    await guardar({
      paso_actual: Math.max(0, total - 1),
      pasos_completados: Array.from({ length: total }, (_, i) => i),
      verificaciones_marcadas: [],
      completado_en: new Date().toISOString(),
    });
  }, [guardar, proceso?.pasos.length]);

  if (cargando) {
    return <p className="p-8 text-muted-foreground">Cargando guía…</p>;
  }

  if (error || !proceso) {
    notFound();
  }

  const guia = procesoAGuia(proceso);

  const accionesCabecera = (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/panel">
          <ChevronLeft className="h-4 w-4" />
          Panel
        </Link>
      </Button>
      {esAdmin && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/proceso/${id}/editar`}>
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Link>
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-1" />
        Imprimir paso
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/proceso/${id}?print=all`)}
      >
        <Printer className="h-4 w-4 mr-1" />
        Imprimir todo
      </Button>
    </>
  );

  if (printAll) {
    return (
      <div className="space-y-8 p-4 md:p-8">
        <header>
          <h1 className="text-3xl font-bold leading-tight">{proceso.nombre}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {proceso.herramienta}
          </p>
        </header>
        {proceso.pasos.map((p, i) => (
          <PanelPaso
            key={p.id}
            paso={p}
            indice={i}
            verificacionMarcada={false}
            onVerificacionChange={() => undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <StepByStepGuide
      guideId={guia.guideId}
      title={guia.title}
      steps={guia.steps}
      totalEstimatedTime={guia.totalEstimatedTime}
      confirmOnCheck={false}
      headerActions={accionesCabecera}
      onStepChange={persistirProgreso}
      onFinish={finalizarEnServidor}
    />
  );
}
