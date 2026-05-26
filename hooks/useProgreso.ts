"use client";

import { useCallback, useMemo } from "react";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import type { ProgresoUsuario } from "@/lib/supabase/tipos";

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
