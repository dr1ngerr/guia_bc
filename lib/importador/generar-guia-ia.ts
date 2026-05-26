import type { ImagenParaIA } from "@/lib/importador/tipos";
import { obtenerClaveGemini } from "@/lib/importador/guia-ia-compartido";
import { generarGuiaConGemini } from "@/lib/importador/parser-gemini";

export async function generarGuiaConProveedor(
  apuntes: string,
  imagenes: ImagenParaIA[] = []
) {
  if (!obtenerClaveGemini()) {
    throw new Error(
      "GEMINI_API_KEY no configurada. Añádela en Vercel (Google AI Studio) y redeploy."
    );
  }

  const r = await generarGuiaConGemini(apuntes, imagenes);
  return { ...r, proveedor: "gemini" as const };
}
