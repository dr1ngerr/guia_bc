import { obtenerClaveGemini } from "@/lib/importador/config-gemini";

/** Orden: modelos actuales primero; 2.0 queda como respaldo hasta su retirada. */
export const MODELOS_GEMINI = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash",
] as const;

export type ModeloGemini = (typeof MODELOS_GEMINI)[number];

type CuerpoGemini = Record<string, unknown>;

export type ResultadoGemini = {
  modelo: ModeloGemini;
  json: {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
};

function esModeloNoDisponible(status: number, cuerpo: string): boolean {
  if (status === 404) return true;
  return /not found|is not supported|no longer available|deprecated/i.test(cuerpo);
}

/** Llama a generateContent probando varios modelos hasta que uno responda. */
export async function llamarGeminiGenerateContent(
  cuerpo: CuerpoGemini,
  modelos: readonly string[] = MODELOS_GEMINI
): Promise<ResultadoGemini> {
  const apiKey = obtenerClaveGemini();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada en el servidor.");
  }

  const errores: string[] = [];

  for (const modelo of modelos) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });

    const texto = await res.text();

    if (res.ok) {
      try {
        const json = JSON.parse(texto) as ResultadoGemini["json"];
        return { modelo: modelo as ModeloGemini, json };
      } catch {
        errores.push(`${modelo}: respuesta JSON inválida`);
        continue;
      }
    }

    if (esModeloNoDisponible(res.status, texto)) {
      errores.push(`${modelo}: no disponible (${res.status})`);
      continue;
    }

    throw new Error(`Gemini: ${res.status} ${texto.slice(0, 500)}`);
  }

  throw new Error(
    `Ningún modelo Gemini respondió. ${errores.join("; ") || "Revisa GEMINI_API_KEY en Vercel y haz redeploy."}`
  );
}
