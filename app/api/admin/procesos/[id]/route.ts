import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { obtenerUsuarioYAdmin } from "@/lib/auth/servidor";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { user, esAdmin } = await obtenerUsuarioYAdmin();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!esAdmin) {
    return NextResponse.json(
      { error: "Solo administradores" },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json(
      { error: "Falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL" },
      { status: 500 }
    );
  }

  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRole);

  // Cascade: public.procesos -> pasos -> capturas (y progreso via FK)
  const { error } = await supabaseAdmin.from("procesos").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Error al eliminar proceso" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

