import { NextResponse } from "next/server";
import { obtenerClaveGemini, estadoGeminiEnServidor } from "@/lib/importador/config-gemini";

export const runtime = "nodejs";

/** Prueba rápida: la clave existe y Gemini responde. */
export async function GET() {
  const estado = estadoGeminiEnServidor();

  if (!estado.configurada) {
    return NextResponse.json({
      ok: false,
      ...estado,
      ayuda:
        "En Vercel: Settings → Environment Variables → GEMINI_API_KEY → Production → Redeploy.",
    });
  }

  const apiKey = obtenerClaveGemini()!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: 'Responde solo: {"ok":true}' }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 16 },
      }),
    });

    const texto = await res.text();

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        variableDetectada: estado.variableDetectada,
        status: res.status,
        error: texto.slice(0, 400),
        ayuda:
          res.status === 400
            ? "Clave inválida o API no habilitada. Crea otra clave en AI Studio."
            : "Revisa cuota o facturación en Google AI Studio.",
      });
    }

    return NextResponse.json({
      ok: true,
      variableDetectada: estado.variableDetectada,
      mensaje: "Gemini responde correctamente en producción.",
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "Error de red",
    });
  }
}
