import { generarGuiaHeuristica } from "@/lib/importador/parser-heuristico";
import { generarGuiaConIA } from "@/lib/importador/parser-ia";
import {
  esErrorSinCuotaOpenAI,
  formatearErrorOpenAI,
} from "@/lib/importador/errores-openai";
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

  if (tieneImagenes && !process.env.OPENAI_API_KEY) {
    throw new Error(
      "Para importar imágenes necesitas OPENAI_API_KEY configurada (visión con IA)."
    );
  }

  if (preferirIA && process.env.OPENAI_API_KEY) {
    try {
      const { guia, usoVision } = await generarGuiaConIA(
        textoCombinado,
        imagenes
      );

      if (usoVision) {
        avisos.push(
          `Analizadas ${imagenes.length} imagen(es) con IA (GPT-4o visión). Revisa cada paso antes de publicar.`
        );
      } else {
        avisos.push(
          "Guía generada con IA a partir del texto. Revisa antes de publicar."
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
      const mensaje = formatearErrorOpenAI(e);

      // Solo imágenes: hace falta visión con OpenAI y crédito activo
      if (tieneImagenes && !tieneTexto) {
        throw new Error(mensaje);
      }

      if (tieneImagenes && tieneTexto) {
        avisos.push(
          esErrorSinCuotaOpenAI(e)
            ? "OpenAI sin crédito: no se analizaron las capturas. Se generó un borrador solo con el texto de PDF/Word."
            : `No se pudieron analizar las imágenes (${mensaje}). Borrador generado solo con texto extraído.`
        );
      } else {
        avisos.push(
          esErrorSinCuotaOpenAI(e)
            ? "OpenAI sin crédito. Se usó el analizador automático (sin IA)."
            : `IA no disponible. Se usó el analizador automático.`
        );
      }
    }
  } else if (tieneImagenes) {
    throw new Error("OPENAI_API_KEY requerida para procesar imágenes.");
  } else if (preferirIA && !process.env.OPENAI_API_KEY) {
    avisos.push(
      "Añade OPENAI_API_KEY para mejores resultados. Usando analizador automático."
    );
  }

  if (!tieneTexto) {
    throw new Error("No se pudo extraer texto; solo imágenes requieren IA activa.");
  }

  const guia = generarGuiaHeuristica(textoCombinado, avisos);
  return { guia, metodo: "heuristica", avisos, fuentes };
}
