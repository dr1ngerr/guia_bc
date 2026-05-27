"use client";

import { useCallback, useEffect, useState } from "react";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileText, Pencil, Printer } from "lucide-react";
import { useProceso } from "@/hooks/useProceso";
import { useProgreso } from "@/hooks/useProgreso";
import { usePerfil } from "@/hooks/usePerfil";
import { PanelPaso } from "@/components/guia/PanelPaso";
import { StepByStepGuide } from "@/components/guia/StepByStepGuide";
import { procesoAGuia } from "@/lib/guia/proceso-a-guia";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProcesoGuiaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { proceso, cargando, error } = useProceso(id);
  const { guardar } = useProgreso(id);
  const { esAdmin } = usePerfil();
  const printAll = searchParams.get("print") === "all";
  const [preparandoImpresion, setPreparandoImpresion] = useState(false);

  // Espera a que todas las imágenes carguen (o fallen) antes de imprimir.
  const esperarImagenes = useCallback(async () => {
    const imagenes = Array.from(
      document.querySelectorAll<HTMLImageElement>("img")
    );
    await Promise.all(
      imagenes.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const finalizar = () => resolve();
          img.addEventListener("load", finalizar, { once: true });
          img.addEventListener("error", finalizar, { once: true });
          // Tope de 8s por imagen para que nada bloquee la impresión.
          setTimeout(finalizar, 8000);
        });
      })
    );
  }, []);

  useEffect(() => {
    if (!printAll || !proceso) return;
    let cancelado = false;
    setPreparandoImpresion(true);

    (async () => {
      await esperarImagenes();
      // Pequeño margen para que el navegador termine el layout.
      await new Promise((r) => setTimeout(r, 200));
      if (cancelado) return;
      setPreparandoImpresion(false);
      window.print();
    })();

    const onAfterPrint = () => {
      router.replace(`/proceso/${id}`);
    };
    window.addEventListener("afterprint", onAfterPrint);

    return () => {
      cancelado = true;
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [printAll, proceso, esperarImagenes, router, id]);

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

  const imprimirPaso = useCallback(async () => {
    await esperarImagenes();
    window.print();
  }, [esperarImagenes]);

  const imprimirTodo = useCallback(() => {
    router.push(`/proceso/${id}?print=all`);
  }, [router, id]);

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label="Opciones de impresión"
          >
            <Printer className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Imprimir</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => imprimirPaso()}>
            <FileText className="h-4 w-4 mr-2" />
            Imprimir este paso
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => imprimirTodo()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir guía completa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  if (printAll) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="no-imprimir border-b p-3 flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {preparandoImpresion
              ? "Preparando impresión…"
              : "Si el diálogo de impresión no se abrió, púlsalo de nuevo."}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              disabled={preparandoImpresion}
            >
              <Printer className="h-4 w-4 mr-1" />
              Imprimir ahora
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.replace(`/proceso/${id}`)}
            >
              Volver a la guía
            </Button>
          </div>
        </div>
        <div className="space-y-8 p-4 md:p-8 overflow-y-auto">
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
