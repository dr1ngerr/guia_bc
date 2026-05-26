import { NextResponse } from "next/server";
import { estadoGeminiEnServidor } from "@/lib/importador/config-gemini";
import { llamarGeminiGenerateContent } from "@/lib/importador/cliente-gemini";

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

  try {
    const { modelo } = await llamarGeminiGenerateContent({
      contents: [{ role: "user", parts: [{ text: 'Responde solo: {"ok":true}' }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 16 },
    });

    return NextResponse.json({
      ok: true,
      variableDetectada: estado.variableDetectada,
      modeloUsado: modelo,
      mensaje: `Gemini responde correctamente (${modelo}).`,
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Error de red";
    return NextResponse.json({
      ok: false,
      variableDetectada: estado.variableDetectada,
      error: raw.slice(0, 400),
      ayuda: /API_KEY|invalid.*key|401|403/i.test(raw)
        ? "Clave inválida. Crea una nueva en https://aistudio.google.com/apikey y redeploy en Vercel."
        : /no configurada/i.test(raw)
          ? "Añade GEMINI_API_KEY en Vercel (Production) y Redeploy."
          : "Revisa cuota en Google AI Studio o prueba otra clave.",
    });
  }
}
