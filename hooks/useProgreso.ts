"use client";

import { useCallback, useMemo } from "react";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import type { ProgresoUsuario } from "@/lib/supabase/tipos";
import { esFechaDeHoy } from "@/lib/utils/fecha-progreso";

export function useProgreso(idProceso: string) {
  const supabase = useMemo(() => crearClienteSupabase(), []);

  const obtener = useCallback(async (): Promise<ProgresoUsuario | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("progreso_usuario")
      .select("*")
      .eq("id_proceso", idProceso)
      .eq("id_usuario", user.id)
      .maybeSingle();

    if (!data) return null;

    // Reset diario: si el progreso no es de hoy, lo borramos y devolvemos null.
    if (!esFechaDeHoy(data.iniciado_en)) {
      await supabase
        .from("progreso_usuario")
        .delete()
        .eq("id_proceso", idProceso)
        .eq("id_usuario", user.id);
      return null;
    }

    return data;
  }, [idProceso, supabase]);

  const guardar = useCallback(
    async (datos: {
      paso_actual: number;
      pasos_completados: number[];
      verificaciones_marcadas: string[];
      completado_en?: string | null;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("progreso_usuario")
        .upsert(
          {
            id_usuario: user.id,
            id_proceso: idProceso,
            // Refresca `iniciado_en` con la marca del último guardado para
            // soportar el reset diario sin necesidad de columnas extra.
            iniciado_en: new Date().toISOString(),
            ...datos,
          },
          { onConflict: "id_usuario,id_proceso" }
        )
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    [idProceso, supabase]
  );

  const reiniciar = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("progreso_usuario")
      .delete()
      .eq("id_proceso", idProceso)
      .eq("id_usuario", user.id);
  }, [idProceso, supabase]);

  return { obtener, guardar, reiniciar };
}
