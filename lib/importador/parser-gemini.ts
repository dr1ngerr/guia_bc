import type { GuiaGenerada, ImagenParaIA } from "@/lib/importador/tipos";
import {
  SYSTEM_PROMPT_GUIA,
  normalizarGuiaIA,
  obtenerClaveGemini,
} from "@/lib/importador/guia-ia-compartido";
import { formatearErrorIA } from "@/lib/importador/errores-ia";

const MODELO_TEXTO = "gemini-2.0-flash";
const MODELO_VISION = "gemini-2.0-flash";

export async function generarGuiaConGemini(
  apuntes: string,
  imagenes: ImagenParaIA[] = []
): Promise<{ guia: GuiaGenerada; usoVision: boolean }> {
  const apiKey = obtenerClaveGemini();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada en el servidor.");
  }

  const usoVision = imagenes.length > 0;
  const model = usoVision ? MODELO_VISION : MODELO_TEXTO;

  let instruccion = `Convierte este material en una guía profesional para un sustituto.\n\n`;
  if (apuntes.trim()) {
    instruccion += `TEXTO EXTRAÍDO DE DOCUMENTOS:\n${apuntes.slice(0, 24000)}\n\n`;
  }
  if (usoVision) {
    instruccion += `IMÁGENES ADJUNTAS (${imagenes.length}): capturas de pantalla. Lee texto visible, botones y menús. Combina todo en una guía coherente.\n`;
  }

  const parts: Array<
    { text: string } | { inline_data: { mime_type: string; data: string } }
  > = [{ text: instruccion }];

  for (const img of imagenes.slice(0, 12)) {
    parts.push({
      inline_data: {
        mime_type: img.mime,
        data: img.base64,
      },
    });
    parts.push({ text: `(Captura: ${img.nombre})` });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT_GUIA }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(formatearErrorIA(new Error(`Gemini: ${res.status} ${err}`)));
  }

  const json = await res.json();
  const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error("Respuesta vacía de Gemini.");
  }

  const parsed = JSON.parse(content) as GuiaGenerada;
  const contexto = apuntes + imagenes.map((i) => i.nombre).join(" ");

  return {
    guia: normalizarGuiaIA(parsed, contexto),
    usoVision,
  };
}
