/** Mensajes claros para errores de Gemini. */
export function formatearErrorIA(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (/API_KEY_INVALID|API key not valid|invalid.*api.*key/i.test(raw)) {
    return (
      "La clave GEMINI_API_KEY no es válida. Crea una nueva en Google AI Studio " +
      "y actualízala en Vercel → Environment Variables, luego redeploy."
    );
  }

  if (/RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw)) {
    return (
      "Cuota de Gemini agotada o límite de peticiones. Espera unos minutos o revisa " +
      "tu uso en Google AI Studio."
    );
  }

  if (/GEMINI_API_KEY no configurada/i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("Gemini:")) {
    try {
      const jsonPart = raw.replace(/^Gemini:\s*\d+\s*/, "");
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
  return /RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw);
}
