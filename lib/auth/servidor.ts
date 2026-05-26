import { createClient } from "@/utils/supabase/server";

export async function obtenerUsuarioYAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, esAdmin: false, supabase };
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  return {
    user,
    esAdmin: perfil?.rol === "administrador",
    supabase,
  };
}
