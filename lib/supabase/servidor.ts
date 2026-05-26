import { createClient } from "@/utils/supabase/server";

/** Cliente Supabase en el servidor (Server Components, Route Handlers) */
export async function crearClienteSupabaseServidor() {
  return createClient();
}
