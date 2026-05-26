import type { GuiaGenerada, ImagenParaIA, PasoGenerado } from "@/lib/importador/tipos";
import {
  detectarHerramienta,
  detectarIcono,
  validarHerramienta,
  textoAHtml,
} from "@/lib/importador/utilidades";
import type { TipoAlerta } from "@/lib/supabase/tipos";

const ESQUEMA = `{
  "nombre": "string",
  "descripcion": "string",
  "herramienta": "Business Central | Google Sheets | Excel | Web | Email | Otra",
  "icono": "emoji",
  "categoria": "string o null",
  "duracion_minutos": number,
  "pasos": [{
    "titulo": "string",
    "descripcion": "string",
    "tipo_alerta": "peligro | advertencia | consejo | null",
    "texto_alerta": "string o null",
    "texto_verificacion": "string o null",
    "consejo": "string o null"
  }]
}`;

const SYSTEM_PROMPT = `Eres un experto en documentación de procesos administrativos (Business Central, Excel, correo, webs internas) para personal sustituto en vacaciones.

Conviertes apuntes, documentos y CAPTURAS DE PANTALLA en guías paso a paso impecables, en español de España.

Reglas:
- Un paso = una acción clara con verbo imperativo ("Abrir", "Seleccionar", "Comprobar").
- En descripcion incluye detalle de menús, botones y campos visibles en capturas.
- tipo_alerta "peligro": irreversible, borrar, confirmar definitivo, riesgo económico.
- tipo_alerta "advertencia": revisar datos antes de continuar.
- tipo_alerta "consejo": atajo o buena práctica.
- texto_verificacion: frase concreta que el sustituto debe confirmar (ej. "He comprobado que el importe coincide").
- NO incluyas pasos sobre vídeos ni enlaces a vídeo (url_video no existe en el esquema).
- Estima duracion_minutos de forma realista.
- Responde SOLO JSON válido: ${ESQUEMA}`;

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "high" | "low" } };

export async function generarGuiaConIA(
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
    instruccion += `IMÁGENES ADJUNTAS (${imagenes.length}): capturas de pantalla, fotos de apuntes o páginas. Lee el texto visible, botones, menús y el orden lógico de acciones. Combina toda la información en una sola guía coherente.\n`;
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
    partesUsuario.push({
      type: "text",
      text: `(Captura: ${img.nombre})`,
    });
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
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: partesUsuario },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI: ${res.status} ${err.slice(0, 300)}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Respuesta vacía de OpenAI");

  const parsed = JSON.parse(content) as GuiaGenerada;
  const contexto = apuntes + imagenes.map((i) => i.nombre).join(" ");

  return {
    guia: normalizarGuia(parsed, contexto),
    usoVision,
  };
}

function normalizarGuia(raw: GuiaGenerada, contexto: string): GuiaGenerada {
  const herramienta = validarHerramienta(
    raw.herramienta ?? detectarHerramienta(contexto)
  );
  const nombre = raw.nombre?.trim() || "Proceso importado";

  const pasos: PasoGenerado[] = (raw.pasos ?? []).map((p, i) => ({
    titulo: p.titulo?.trim() || `Paso ${i + 1}`,
    descripcion: p.descripcion?.includes("<")
      ? p.descripcion
      : textoAHtml(p.descripcion ?? ""),
    tipo_alerta: validarAlerta(p.tipo_alerta),
    texto_alerta: p.texto_alerta?.trim() || null,
    texto_verificacion: p.texto_verificacion?.trim() || null,
    consejo: p.consejo?.trim() || null,
  }));

  if (pasos.length === 0) {
    throw new Error("La IA no generó pasos. Añade más capturas o texto.");
  }

  return {
    nombre,
    descripcion: raw.descripcion?.includes("<")
      ? raw.descripcion
      : textoAHtml(
          raw.descripcion ??
            "Guía generada desde documentos e imágenes. Revisa y añade capturas en el editor."
        ),
    herramienta,
    icono: raw.icono || detectarIcono(herramienta, nombre),
    categoria: raw.categoria ?? null,
    duracion_minutos: Math.min(
      240,
      Math.max(10, raw.duracion_minutos ?? pasos.length * 10)
    ),
    pasos,
  };
}

function validarAlerta(t: unknown): TipoAlerta | null {
  if (t === "peligro" || t === "advertencia" || t === "consejo") return t;
  return null;
}
