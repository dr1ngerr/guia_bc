"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store/useEditorStore";
import { toast } from "@/hooks/use-toast";

type GuardarFn = () => Promise<void>;

export function useGuardadoAutomatico(
  guardar: GuardarFn,
  intervaloMs = 30000
) {
  const sucio = useEditorStore((s) => s.sucio);
  const guardando = useEditorStore((s) => s.guardando);
  const guardarRef = useRef(guardar);
  guardarRef.current = guardar;

  useEffect(() => {
    if (!sucio || guardando) return;

    const timer = setInterval(async () => {
      if (!useEditorStore.getState().sucio) return;
      try {
        useEditorStore.getState().setGuardando(true);
        await guardarRef.current();
        useEditorStore.getState().setSucio(false);
        useEditorStore.getState().setUltimoGuardado(new Date());
      } catch {
        toast({
          title: "Error al guardar",
          description:
            "No se pudo guardar automáticamente. Revisa tu conexión.",
          variant: "destructive",
        });
      } finally {
        useEditorStore.getState().setGuardando(false);
      }
    }, intervaloMs);

    return () => clearInterval(timer);
  }, [sucio, guardando, intervaloMs]);
}
