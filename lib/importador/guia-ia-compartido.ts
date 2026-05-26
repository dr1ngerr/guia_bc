import type { GuiaGenerada, PasoGenerado } from "@/lib/importador/tipos";
import {
  detectarHerramienta,
  detectarIcono,
  validarHerramienta,
  textoAHtml,
} from "@/lib/importador/utilidades";
import type { TipoAlerta } from "@/lib/supabase/tipos";

export const ESQUEMA_GUIA_JSON = `{
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

export const SYSTEM_PROMPT_GUIA = `Eres un experto en documentación de procesos administrativos (Business Central, Excel, correo, webs internas) para personal sustituto en vacaciones.

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
- Responde SOLO JSON válido: ${ESQUEMA_GUIA_JSON}`;

export function normalizarGuiaIA(
  raw: GuiaGenerada,
  contexto: string
): GuiaGenerada {
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

export function obtenerClaveGemini(): string | undefined {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GEMINI_API_KEY
  );
}

export function proveedorIADisponible(): "gemini" | "openai" | null {
  if (obtenerClaveGemini()) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}
