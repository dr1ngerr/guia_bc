import { NextResponse } from "next/server";
import { obtenerUsuarioYAdmin } from "@/lib/auth/servidor";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { user, esAdmin, supabase } = await obtenerUsuarioYAdmin();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!esAdmin) {
    return NextResponse.json(
      { error: "Solo administradores" },
      { status: 403 }
    );
  }

  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  // RLS: política procesos_delete_admin (no requiere service role en Vercel)
  const { error } = await supabase.from("procesos").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Error al eliminar proceso" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

