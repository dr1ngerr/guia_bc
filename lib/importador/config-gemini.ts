/** Nombres de variables que Vercel puede tener (solo servidor, nunca NEXT_PUBLIC_). */
const NOMBRES_ENV_GEMINI = [
  "GEMINI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GOOGLE_API_KEY",
] as const;

export function obtenerClaveGemini(): string | undefined {
  for (const nombre of NOMBRES_ENV_GEMINI) {
    const valor = process.env[nombre]?.trim();
    if (valor && valor.length > 10) return valor;
  }
  return undefined;
}

export function estadoGeminiEnServidor() {
  for (const nombre of NOMBRES_ENV_GEMINI) {
    const valor = process.env[nombre]?.trim();
    if (valor && valor.length > 10) {
      return {
        configurada: true,
        variableDetectada: nombre,
        longitudClave: valor.length,
        prefijoValido: valor.startsWith("AIza"),
      };
    }
  }

  const intentos = NOMBRES_ENV_GEMINI.map((nombre) => {
    const raw = process.env[nombre];
    if (!raw) return { nombre, estado: "no_definida" as const };
    const t = raw.trim();
    if (!t) return { nombre, estado: "vacia" as const };
    if (t.length <= 10) return { nombre, estado: "demasiado_corta" as const };
    return { nombre, estado: "ok" as const };
  });

  return {
    configurada: false,
    variableDetectada: null,
    variablesBuscadas: [...NOMBRES_ENV_GEMINI],
    intentos,
  };
}
