"use client";

import { useCallback, useEffect, useState } from "react";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import type { ProcesoConPasos } from "@/lib/supabase/tipos";

interface UseProcesoOpciones {
  /**
   * Si `true`, recarga los datos cuando la pestaña vuelve a tener foco.
   * Útil en la vista guía. Desactívalo en el editor para no pisar cambios
   * locales sin guardar.
   */
  revalidarEnFoco?: boolean;
}

export function useProceso(id: string, opciones: UseProcesoOpciones = {}) {
  const { revalidarEnFoco = true } = opciones;
  const [proceso, setProceso] = useState<ProcesoConPasos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const supabase = crearClienteSupabase();

    const { data: proc, error: errProc } = await supabase
      .from("procesos")
      .select("*")
      .eq("id", id)
      .single();

    if (errProc || !proc) {
      setError(errProc?.message ?? "Proceso no encontrado");
      setCargando(false);
      return;
    }

    const { data: pasos, error: errPasos } = await supabase
      .from("pasos")
      .select("*")
      .eq("id_proceso", id)
      .order("orden", { ascending: true });

    if (errPasos) {
      setError(errPasos.message);
      setCargando(false);
      return;
    }

    const idsPasos = (pasos ?? []).map((p) => p.id);
    let capturas: import("@/lib/supabase/tipos").Captura[] = [];

    if (idsPasos.length > 0) {
      const { data: caps } = await supabase
        .from("capturas")
        .select("*")
        .in("id_paso", idsPasos)
        .order("orden", { ascending: true });
      capturas = (caps ?? []) as import("@/lib/supabase/tipos").Captura[];
    }

    const pasosConCapturas = (pasos ?? []).map((paso) => ({
      ...paso,
      capturas: capturas.filter((c) => c.id_paso === paso.id),
    }));

    setProceso({ ...proc, pasos: pasosConCapturas });
    setCargando(false);
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Refresca los datos cuando el usuario vuelve a la pestaña, para evitar
  // ver versiones obsoletas tras editar el proceso desde otra pestaña/ruta.
  useEffect(() => {
    if (!revalidarEnFoco) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        cargar();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [cargar, revalidarEnFoco]);

  return { proceso, error, cargando, recargar: cargar };
}
