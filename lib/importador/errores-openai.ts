/** Mensaje claro cuando OpenAI devuelve 429 insufficient_quota u otros errores de facturación. */
export function formatearErrorOpenAI(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);

  if (
    /insufficient_quota|exceeded your current quota|billing/i.test(raw)
  ) {
    return (
      "La cuenta de OpenAI no tiene crédito disponible. " +
      "Entra en platform.openai.com → Billing y añade saldo o un método de pago. " +
      "Luego comprueba que OPENAI_API_KEY en Vercel sea la clave correcta."
    );
  }

  if (/invalid_api_key|incorrect api key/i.test(raw)) {
    return (
      "La clave OPENAI_API_KEY no es válida. Revisa la variable en Vercel " +
      "(Settings → Environment Variables) y vuelve a desplegar."
    );
  }

  if (/rate_limit|429/.test(raw) && !/quota/i.test(raw)) {
    return (
      "OpenAI está limitando peticiones (demasiadas seguidas). Espera un minuto e inténtalo de nuevo."
    );
  }

  if (raw.startsWith("OpenAI:")) {
    try {
      const jsonPart = raw.replace(/^OpenAI:\s*\d+\s*/, "");
      const parsed = JSON.parse(jsonPart) as {
        error?: { message?: string; type?: string };
      };
      if (parsed.error?.message) {
        return formatearErrorOpenAI(new Error(parsed.error.message));
      }
    } catch {
      // usar mensaje genérico
    }
  }

  return raw.length > 280 ? `${raw.slice(0, 280)}…` : raw;
}

export function esErrorSinCuotaOpenAI(error: unknown): boolean {
  const raw = error instanceof Error ? error.message : String(error);
  return /insufficient_quota|exceeded your current quota|billing/i.test(raw);
}
