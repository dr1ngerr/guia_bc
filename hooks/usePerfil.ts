"use client";

import { useEffect, useState } from "react";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { asegurarPerfil } from "@/lib/supabase/perfil";
import type { Perfil } from "@/lib/supabase/tipos";

export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const supabase = crearClienteSupabase();

    async function cargar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCargando(false);
        return;
      }

      let { data } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!data) {
        await asegurarPerfil(supabase);
        const res = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        data = res.data;
      }

      setPerfil(data);
      setCargando(false);
    }

    cargar();
  }, []);

  const esAdmin = perfil?.rol === "administrador";

  return { perfil, esAdmin, cargando };
}
