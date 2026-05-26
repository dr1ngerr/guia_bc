import type { GuiaGenerada, ImagenParaIA } from "@/lib/importador/tipos";
import {
  SYSTEM_PROMPT_GUIA,
  normalizarGuiaIA,
} from "@/lib/importador/guia-ia-compartido";
import { formatearErrorIA } from "@/lib/importador/errores-ia";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "high" | "low" } };

export async function generarGuiaConOpenAI(
  apuntes: string,
  imagenes: ImagenParaIA[] = []
): Promise<{ guia: GuiaGenerada; usoVision: boolean }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no configurada");
  }

  const usoVision = imagenes.length > 0;
  const model = usoVision ? "gpt-4o" : "gpt-4o-mini";

  const partesUsuario: ContentPart[] = [];

  let instruccion = `Convierte este material en una guía profesional para un sustituto.\n\n`;
  if (apuntes.trim()) {
    instruccion += `TEXTO EXTRAÍDO DE DOCUMENTOS:\n${apuntes.slice(0, 24000)}\n\n`;
  }
  if (usoVision) {
    instruccion += `IMÁGENES ADJUNTAS (${imagenes.length}): capturas de pantalla. Lee texto visible, botones y menús.\n`;
  }
  partesUsuario.push({ type: "text", text: instruccion });

  for (const img of imagenes.slice(0, 15)) {
    partesUsuario.push({
      type: "image_url",
      image_url: {
        url: `data:${img.mime};base64,${img.base64}`,
        detail: "high",
      },
    });
    partesUsuario.push({ type: "text", text: `(Captura: ${img.nombre})` });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT_GUIA },
        { role: "user", content: partesUsuario },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(formatearErrorIA(new Error(`OpenAI: ${res.status} ${err}`)));
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Respuesta vacía de OpenAI");

  const parsed = JSON.parse(content) as GuiaGenerada;
  const contexto = apuntes + imagenes.map((i) => i.nombre).join(" ");

  return {
    guia: normalizarGuiaIA(parsed, contexto),
    usoVision,
  };
}

/** @deprecated Usar generarGuiaConOpenAI */
export const generarGuiaConIA = generarGuiaConOpenAI;
