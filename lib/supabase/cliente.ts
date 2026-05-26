import { createClient } from "@/utils/supabase/client";

/** Cliente Supabase en el navegador */
export function crearClienteSupabase() {
  return createClient();
}
