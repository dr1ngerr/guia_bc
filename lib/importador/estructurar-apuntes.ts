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

  const hayGemini = proveedorIADisponible() !== null;

  if (tieneImagenes && !hayGemini) {
    throw new Error(
      "Para importar imágenes configura GEMINI_API_KEY en Vercel (Google AI Studio, plan gratuito)."
    );
  }

  if (preferirIA && hayGemini) {
    try {
      const { guia, usoVision } = await generarGuiaConProveedor(
        textoCombinado,
        imagenes
      );

      if (usoVision) {
        avisos.push(
          `Analizadas ${imagenes.length} imagen(es) con Gemini. Revisa cada paso antes de publicar.`
        );
      } else {
        avisos.push(
          "Guía generada con Gemini a partir del texto. Revisa antes de publicar."
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
          faltaGemini
            ? "No se analizaron capturas: añade GEMINI_API_KEY en Vercel y redeploy."
            : esErrorSinCuotaIA(e)
              ? "Gemini sin cuota disponible. Borrador solo con texto de PDF/Word."
              : `No se analizaron imágenes (${mensaje}). Borrador solo con texto extraído.`
        );
      } else {
        avisos.push(
          esErrorSinCuotaIA(e)
            ? "Gemini sin cuota. Se usó el analizador automático."
            : "Gemini no disponible. Se usó el analizador automático."
        );
      }
    }
  } else if (tieneImagenes) {
    throw new Error(
      "GEMINI_API_KEY requerida para procesar imágenes (Google AI Studio)."
    );
  } else if (preferirIA && !hayGemini) {
    avisos.push(
      "Añade GEMINI_API_KEY en Vercel. Usando analizador automático."
    );
  }

  if (!tieneTexto) {
    throw new Error("No se pudo extraer texto; solo imágenes requieren Gemini activo.");
  }

  const guia = generarGuiaHeuristica(textoCombinado, avisos);
  return { guia, metodo: "heuristica", avisos, fuentes };
}

export function iaConfigurada(): boolean {
  return proveedorIADisponible() !== null;
}

export function geminiConfigurada(): boolean {
  return Boolean(obtenerClaveGemini());
}
