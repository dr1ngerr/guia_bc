import { NextResponse } from "next/server";
import { estructurarApuntes } from "@/lib/importador/estructurar-apuntes";
import { extraerDeArchivos } from "@/lib/importador/extraer-archivos";
import { obtenerUsuarioYAdmin } from "@/lib/auth/servidor";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const { user, esAdmin } = await obtenerUsuarioYAdmin();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!esAdmin) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  let apuntes = "";
  let usarIA = true;
  let archivos: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    apuntes = String(formData.get("apuntes") ?? "").trim();
    usarIA = formData.get("usarIA") !== "false";
    archivos = formData.getAll("archivos").filter((f): f is File => f instanceof File);
  } else {
    let body: { apuntes?: string; usarIA?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
    }
    apuntes = body.apuntes?.trim() ?? "";
    usarIA = body.usarIA !== false;
  }

  try {
    const contenidoArchivos =
      archivos.length > 0 ? await extraerDeArchivos(archivos) : null;

    const resultado = await estructurarApuntes(
      apuntes,
      contenidoArchivos,
      usarIA
    );

    return NextResponse.json(resultado);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al generar la guía" },
      { status: 500 }
    );
  }
}
