import type { SupabaseClient } from "@supabase/supabase-js";

/** Crea el perfil en public.perfiles si el usuario acaba de registrarse */
export async function asegurarPerfil(
  supabase: SupabaseClient,
  nombre?: string
): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "No hay sesión activa" };
  }

  const { data: existente } = await supabase
    .from("perfiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existente) {
    return { ok: true };
  }

  // Intentar vía RPC (security definer, más fiable)
  const { error: rpcError } = await supabase.rpc("crear_perfil_si_falta", {
    p_nombre: nombre ?? user.user_metadata?.nombre ?? null,
  });

  if (!rpcError) {
    return { ok: true };
  }

  // RPC no existe (falta migración 004) — seguir con inserción directa
  const rpcNoExiste =
    rpcError.message.includes("crear_perfil_si_falta") ||
    rpcError.message.includes("Could not find the function");

  if (!rpcNoExiste) {
    return { ok: false, error: rpcError.message };
  }

  // Respaldo: inserción directa con RLS
  const { data: empresa } = await supabase
    .from("empresa")
    .select("id")
    .limit(1)
    .maybeSingle();

  const { error: insertError } = await supabase.from("perfiles").insert({
    id: user.id,
    email: user.email ?? "",
    nombre:
      nombre ??
      user.user_metadata?.nombre ??
      user.email?.split("@")[0] ??
      "Usuario",
    rol: "empleado",
    empresa_id: empresa?.id ?? null,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  return { ok: true };
}
