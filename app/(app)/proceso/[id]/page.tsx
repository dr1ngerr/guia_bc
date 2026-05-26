"use client";

import { useCallback, useEffect, useRef } from "react";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil, Printer } from "lucide-react";
import { useProceso } from "@/hooks/useProceso";
import { useProgreso } from "@/hooks/useProgreso";
import { useGuiaStore } from "@/lib/store/useGuiaStore";
import { usePerfil } from "@/hooks/usePerfil";
import { PanelLateralPasos } from "@/components/guia/PanelLateralPasos";
import { PanelPaso } from "@/components/guia/PanelPaso";
import { BarraProgreso } from "@/components/guia/BarraProgreso";
import { PantallaCompletado } from "@/components/guia/PantallaCompletado";
import { Button } from "@/components/ui/button";
import type { Herramienta } from "@/lib/supabase/tipos";

export default function ProcesoGuiaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { proceso, cargando, error } = useProceso(id);
  const { obtener, guardar } = useProgreso(id);
  const { esAdmin } = usePerfil();
  const printAll = searchParams.get("print") === "all";

  const {
    pasoActual,
    pasosCompletados,
    verificacionPasoActual,
    verificacionesMarcadas,
    completado,
    setProceso,
    setPasoActual,
    marcarPasoCompletado,
    marcarVerificacion,
    setVerificacionPasoActual,
    setCompletado,
    sincronizarProgreso,
    pasoActivo,
    puedeAvanzar,
    reset,
  } = useGuiaStore();

  const inicializado = useRef(false);

  useEffect(() => {
    if (!proceso) return;
    setProceso(proceso);

    const pasoQuery = searchParams.get("paso");
    const indiceInicial = pasoQuery
      ? Math.max(0, parseInt(pasoQuery, 10) - 1)
      : 0;

    if (!inicializado.current) {
      inicializado.current = true;
      obtener().then((prog) => {
        if (prog) {
          sincronizarProgreso(prog);
          if (!pasoQuery) setPasoActual(prog.paso_actual);
          else setPasoActual(indiceInicial);
        } else {
          setPasoActual(indiceInicial);
        }
      });
    }
  }, [
    proceso,
    searchParams,
    setProceso,
    setPasoActual,
    obtener,
    sincronizarProgreso,
  ]);

  useEffect(() => () => reset(), [reset]);

  useEffect(() => {
    if (!printAll || completado) return;
    // Esperamos a que el contenido esté renderizado para que el PDF tenga todo.
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, [printAll, completado]);

  const persistir = useCallback(async () => {
    const state = useGuiaStore.getState();
    await guardar({
      paso_actual: state.pasoActual,
      pasos_completados: state.pasosCompletados,
      verificaciones_marcadas: state.verificacionesMarcadas,
      completado_en: state.completado ? new Date().toISOString() : null,
    });
  }, [guardar]);

  const irAPaso = useCallback(
    (indice: number) => {
      if (!proceso) return;
      const max = proceso.pasos.length - 1;
      const nuevo = Math.max(0, Math.min(indice, max));
      setPasoActual(nuevo);
      router.replace(`/proceso/${id}?paso=${nuevo + 1}`, { scroll: false });
      persistir();
    },
    [proceso, id, router, setPasoActual, persistir]
  );

  const siguiente = useCallback(async () => {
    if (!proceso || !puedeAvanzar()) return;
    marcarPasoCompletado(pasoActual);

    if (pasoActual >= proceso.pasos.length - 1) {
      setCompletado(true);
      await guardar({
        paso_actual: pasoActual,
        pasos_completados: Array.from(
          new Set([
            ...useGuiaStore.getState().pasosCompletados,
            pasoActual,
          ])
        ),
        verificaciones_marcadas: useGuiaStore.getState().verificacionesMarcadas,
        completado_en: new Date().toISOString(),
      });
      return;
    }

    irAPaso(pasoActual + 1);
  }, [
    proceso,
    pasoActual,
    puedeAvanzar,
    marcarPasoCompletado,
    setCompletado,
    guardar,
    irAPaso,
  ]);

  const anterior = useCallback(() => irAPaso(pasoActual - 1), [irAPaso, pasoActual]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        siguiente();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        anterior();
      } else if (e.key === " ") {
        e.preventDefault();
        const paso = pasoActivo();
        if (paso?.texto_verificacion && !verificacionPasoActual) {
          marcarVerificacion(paso.id);
          setVerificacionPasoActual(true);
          persistir();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    siguiente,
    anterior,
    pasoActivo,
    verificacionPasoActual,
    marcarVerificacion,
    setVerificacionPasoActual,
    persistir,
  ]);

  if (cargando) {
    return (
      <p className="p-8 text-muted-foreground">Cargando guía…</p>
    );
  }

  if (error || !proceso) {
    notFound();
  }

  if (completado) {
    return (
      <PantallaCompletado
        nombreProceso={proceso.nombre}
        pasosCompletados={proceso.pasos.length}
        totalPasos={proceso.pasos.length}
        completadoEn={new Date()}
      />
    );
  }

  const paso = pasoActivo();
  const total = proceso.pasos.length;

  return (
    <div className="flex flex-1 min-h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
      <PanelLateralPasos
        nombre={proceso.nombre}
        herramienta={proceso.herramienta as Herramienta}
        icono={proceso.icono}
        pasos={proceso.pasos.map((p) => ({ orden: p.orden, titulo: p.titulo }))}
        pasoActual={pasoActual}
        pasosCompletados={pasosCompletados}
        onSeleccionar={irAPaso}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="no-imprimir border-b p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/panel">
                <ChevronLeft className="h-4 w-4" />
                Panel
              </Link>
            </Button>
            <div className="flex gap-2">
              {esAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/proceso/${id}/editar`}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Link>
                </Button>
              )}
              {!printAll && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimir paso / PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/proceso/${id}?print=all`)}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimir todo / PDF
                  </Button>
                </>
              )}
            </div>
          </div>
          <BarraProgreso actual={pasoActual} total={total} />
        </div>

        <div
          className={
            printAll
              ? "flex-1 overflow-y-auto p-0 md:p-0"
              : "flex-1 overflow-y-auto p-4 md:p-8"
          }
        >
          {printAll ? (
            <div className="space-y-8">
              <header className="px-4">
                <h1 className="text-3xl font-bold leading-tight">
                  {proceso.nombre}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {proceso.herramienta}
                </p>
              </header>
              {proceso.pasos.map((p, i) => (
                <PanelPaso
                  key={p.id}
                  paso={p}
                  indice={i}
                  verificacionMarcada={verificacionesMarcadas.includes(p.id)}
                  onVerificacionChange={(marcada) => {
                    // En impresión no persistimos cambios.
                    void marcada;
                  }}
                />
              ))}
            </div>
          ) : (
            paso && (
              <PanelPaso
                paso={paso}
                indice={pasoActual}
                verificacionMarcada={verificacionPasoActual}
                onVerificacionChange={(marcada) => {
                  if (marcada) {
                    marcarVerificacion(paso.id);
                  } else {
                    setVerificacionPasoActual(false);
                  }
                  persistir();
                }}
              />
            )
          )}
        </div>

        <footer className="no-imprimir border-t p-4 flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={anterior}
            disabled={pasoActual === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button onClick={siguiente} disabled={!puedeAvanzar()}>
            {pasoActual >= total - 1 ? "Finalizar" : "Siguiente"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </footer>
        <p className="no-imprimir text-xs text-center text-muted-foreground pb-2">
          Atajos: ← anterior · → siguiente · Espacio = marcar verificación
        </p>
      </div>
    </div>
  );
}
