/** Mensajes claros para errores de OpenAI, Gemini y similares. */
export function formatearErrorIA(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (
    /insufficient_quota|exceeded your current quota|billing/i.test(raw)
  ) {
    return (
      "La cuenta de OpenAI no tiene crédito. Recarga en platform.openai.com " +
      "o configura GEMINI_API_KEY (Google AI Studio) en Vercel."
    );
  }

  if (/API_KEY_INVALID|API key not valid|invalid.*api.*key/i.test(raw)) {
    return (
      "La clave de IA no es válida. Revisa GEMINI_API_KEY u OPENAI_API_KEY en Vercel."
    );
  }

  if (/RESOURCE_EXHAUSTED|quota/i.test(raw) && /gemini|google/i.test(raw)) {
    return (
      "Cuota de Gemini agotada. Revisa facturación en Google AI Studio o espera unos minutos."
    );
  }

  if (/rate_limit|429/.test(raw) && !/quota/i.test(raw)) {
    return "Demasiadas peticiones a la IA. Espera un minuto e inténtalo de nuevo.";
  }

  if (raw.startsWith("OpenAI:") || raw.startsWith("Gemini:")) {
    try {
      const jsonPart = raw.replace(/^(OpenAI|Gemini):\s*\d+\s*/, "");
      const parsed = JSON.parse(jsonPart) as {
        error?: { message?: string };
      };
      if (parsed.error?.message) {
        return formatearErrorIA(new Error(parsed.error.message));
      }
    } catch {
      // seguir
    }
  }

  return raw.length > 280 ? `${raw.slice(0, 280)}…` : raw;
}

export function esErrorSinCuotaIA(error: unknown): boolean {
  const raw = error instanceof Error ? error.message : String(error);
  return /insufficient_quota|exceeded your current quota|RESOURCE_EXHAUSTED|billing/i.test(
    raw
  );
}

/** @deprecated Usar formatearErrorIA */
export const formatearErrorOpenAI = formatearErrorIA;
export const esErrorSinCuotaOpenAI = esErrorSinCuotaIA;
