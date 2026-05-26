import { generarGuiaHeuristica } from "@/lib/importador/parser-heuristico";
import { generarGuiaConProveedor } from "@/lib/importador/generar-guia-ia";
import {
  esErrorSinCuotaIA,
  formatearErrorIA,
} from "@/lib/importador/errores-ia";
import {
  obtenerClaveGemini,
  proveedorIADisponible,
} from "@/lib/importador/guia-ia-compartido";
import type { ContenidoImportado, ResultadoGeneracion } from "@/lib/importador/tipos";

export async function estructurarApuntes(
  textoApuntes: string,
  contenidoArchivos: ContenidoImportado | null,
  preferirIA = true
): Promise<ResultadoGeneracion> {
  const avisos: string[] = [];
  const fuentes = [...(contenidoArchivos?.fuentes ?? [])];

  const textoCombinado = [textoApuntes.trim(), contenidoArchivos?.texto ?? ""]
    .filter(Boolean)
    .join("\n\n");

  const imagenes = contenidoArchivos?.imagenes ?? [];
  const tieneImagenes = imagenes.length > 0;
  const tieneTexto = textoCombinado.length >= 15;

  if (!tieneTexto && !tieneImagenes) {
    throw new Error(
      "Sube al menos una imagen, PDF o documento, o pega texto en el cuadro."
    );
  }

  const hayIA = proveedorIADisponible() !== null;

  if (tieneImagenes && !hayIA) {
    throw new Error(
      "Para importar imágenes configura GEMINI_API_KEY o OPENAI_API_KEY en Vercel."
    );
  }

  if (preferirIA && hayIA) {
    try {
      const { guia, usoVision, proveedor } = await generarGuiaConProveedor(
        textoCombinado,
        imagenes
      );

      const nombreProveedor =
        proveedor === "gemini" ? "Gemini" : "OpenAI";

      if (usoVision) {
        avisos.push(
          `Analizadas ${imagenes.length} imagen(es) con ${nombreProveedor}. Revisa cada paso antes de publicar.`
        );
      } else {
        avisos.push(
          `Guía generada con ${nombreProveedor} a partir del texto. Revisa antes de publicar.`
        );
      }

      if (fuentes.length) {
        avisos.push(`Archivos procesados: ${fuentes.join(", ")}`);
      }

      return {
        guia,
        metodo: usoVision ? "ia-vision" : "ia",
        avisos,
        fuentes,
      };
    } catch (e) {
      const mensaje = formatearErrorIA(e);

      if (tieneImagenes && !tieneTexto) {
        throw new Error(mensaje);
      }

      if (tieneImagenes && tieneTexto) {
        const faltaGemini = !obtenerClaveGemini();
        avisos.push(
          faltaGemini && esErrorSinCuotaIA(e)
            ? "No se analizaron capturas: añade GEMINI_API_KEY en Vercel (Google AI Studio, plan gratuito) y redeploy."
            : esErrorSinCuotaIA(e)
              ? "OpenAI sin crédito y Gemini no disponible. Borrador solo con texto de PDF/Word."
              : `No se analizaron imágenes (${mensaje}). Borrador solo con texto extraído.`
        );
      } else {
        avisos.push(
          esErrorSinCuotaIA(e)
            ? "IA sin crédito. Se usó el analizador automático."
            : "IA no disponible. Se usó el analizador automático."
        );
      }
    }
  } else if (tieneImagenes) {
    throw new Error(
      "GEMINI_API_KEY u OPENAI_API_KEY requerida para procesar imágenes."
    );
  } else if (preferirIA && !hayIA) {
    avisos.push(
      "Añade GEMINI_API_KEY u OPENAI_API_KEY en Vercel. Usando analizador automático."
    );
  }

  if (!tieneTexto) {
    throw new Error("No se pudo extraer texto; solo imágenes requieren IA activa.");
  }

  const guia = generarGuiaHeuristica(textoCombinado, avisos);
  return { guia, metodo: "heuristica", avisos, fuentes };
}

/** Para diagnóstico */
export function iaConfigurada(): boolean {
  return proveedorIADisponible() !== null;
}

export function geminiConfigurada(): boolean {
  return Boolean(obtenerClaveGemini());
}
