import { NextResponse } from "next/server";
import type { GuiaGenerada } from "@/lib/importador/tipos";
import { validarHerramienta } from "@/lib/importador/utilidades";
import { obtenerUsuarioYAdmin } from "@/lib/auth/servidor";

export async function POST(request: Request) {
  const { user, esAdmin, supabase } = await obtenerUsuarioYAdmin();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!esAdmin) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  let body: { guia?: GuiaGenerada };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const guia = body.guia;
  if (!guia?.nombre || !guia.pasos?.length) {
    return NextResponse.json({ error: "Guía incompleta" }, { status: 400 });
  }

  const { data: proceso, error: errProc } = await supabase
    .from("procesos")
    .insert({
      nombre: guia.nombre,
      descripcion: guia.descripcion,
      herramienta: validarHerramienta(guia.herramienta),
      icono: guia.icono || "📋",
      categoria: guia.categoria,
      duracion_minutos: guia.duracion_minutos,
      estado: "borrador",
      creado_por: user.id,
    })
    .select("id")
    .single();

  if (errProc || !proceso) {
    return NextResponse.json(
      { error: errProc?.message ?? "No se pudo crear el proceso" },
      { status: 500 }
    );
  }

  const pasosInsert = guia.pasos.map((p, orden) => ({
    id_proceso: proceso.id,
    orden,
    titulo: p.titulo,
    descripcion: p.descripcion,
    tipo_alerta: p.tipo_alerta,
    texto_alerta: p.texto_alerta,
    texto_verificacion: p.texto_verificacion,
    consejo: p.consejo,
  }));

  const { error: errPasos } = await supabase.from("pasos").insert(pasosInsert);

  if (errPasos) {
    await supabase.from("procesos").delete().eq("id", proceso.id);
    return NextResponse.json({ error: errPasos.message }, { status: 500 });
  }

  return NextResponse.json({ id: proceso.id });
}
