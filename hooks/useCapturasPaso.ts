"use client";

import { useCallback } from "react";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { useEditorStore } from "@/lib/store/useEditorStore";
import type { Captura } from "@/lib/supabase/tipos";

/** Recarga las capturas de un paso desde Supabase y actualiza solo el store del editor. */
export function useCapturasPaso() {
  const actualizarCapturasPaso = useEditorStore((s) => s.actualizarCapturasPaso);

  const recargarCapturas = useCallback(
    async (idPaso: string) => {
      const supabase = crearClienteSupabase();
      const { data, error } = await supabase
        .from("capturas")
        .select("*")
        .eq("id_paso", idPaso)
        .order("orden", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      actualizarCapturasPaso(idPaso, (data ?? []) as Captura[]);
    },
    [actualizarCapturasPaso]
  );

  return { recargarCapturas };
}
