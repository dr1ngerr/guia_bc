"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { asegurarPerfil } from "@/lib/supabase/perfil";
import type { Perfil } from "@/lib/supabase/tipos";

type PerfilContextValue = {
  perfil: Perfil | null;
  esAdmin: boolean;
  cargando: boolean;
};

const PerfilContext = createContext<PerfilContextValue>({
  perfil: null,
  esAdmin: false,
  cargando: true,
});

export function PerfilProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const supabase = crearClienteSupabase();
    let activo = true;

    async function cargar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!activo) return;

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

      if (activo) {
        setPerfil(data);
        setCargando(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      perfil,
      esAdmin: perfil?.rol === "administrador",
      cargando,
    }),
    [perfil, cargando]
  );

  return (
    <PerfilContext.Provider value={value}>{children}</PerfilContext.Provider>
  );
}

export function usePerfil() {
  return useContext(PerfilContext);
}
