import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const resultado: Record<string, unknown> = {
    urlConfigurada: !!url,
    claveConfigurada: !!key,
    tipoClave: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      ? "publishable"
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "anon"
        : "ninguna",
    urlProyecto: url ? url.replace(/https:\/\/([^.]+).*/, "$1") : null,
  };

  if (!url || !key) {
    return NextResponse.json({
      ...resultado,
      conectado: false,
      error: "Faltan NEXT_PUBLIC_SUPABASE_URL o la clave pública en .env.local",
    });
  }

  const supabase = createClient(url, key);

  const { data: authData, error: authError } = await supabase.auth.getSession();

  const { data: empresa, error: empresaError } = await supabase
    .from("empresa")
    .select("id, nombre")
    .limit(1);

  const { error: perfilesError } = await supabase
    .from("perfiles")
    .select("id")
    .limit(1);

  resultado.conectado = !perfilesError;
  resultado.authOk = !authError;
  resultado.tablaEmpresa = empresaError
    ? {
        error: empresaError.message,
        nota: "Sin sesión, RLS puede ocultar filas aunque existan en la BD",
      }
    : {
        filasVisibles: empresa?.length ?? 0,
        nota: "Si es 0 sin login, mira Table Editor en Supabase o ejecuta 005_datos_iniciales_y_confirmacion.sql",
      };
  resultado.tablaPerfiles = perfilesError
    ? { error: perfilesError.message, hint: perfilesError.hint }
    : { accesible: true, nota: "Los perfiles solo se crean al iniciar sesión con sesión activa" };
  resultado.sesion = authData.session ? "activa" : "ninguna";
  resultado.confirmacionEmail =
    "Si el registro 'funciona' pero el login falla, desactiva Confirm email en Supabase o confirma el usuario en Authentication → Users";

  if (empresaError?.message?.includes("does not exist")) {
    resultado.accion =
      "Ejecuta supabase/migrations/001_schema_completo.sql en el SQL Editor";
  } else if (perfilesError) {
    resultado.accion = "Revisa RLS o ejecuta 004_sin_trigger_auth.sql";
  } else {
    resultado.accion =
      "BD conectada. Si el registro falla, ejecuta 004_sin_trigger_auth.sql";
  }

  return NextResponse.json(resultado);
}
