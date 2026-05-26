import type { ImagenParaIA } from "@/lib/importador/tipos";
import {
  obtenerClaveGemini,
  proveedorIADisponible,
} from "@/lib/importador/guia-ia-compartido";
import { generarGuiaConGemini } from "@/lib/importador/parser-gemini";
import { generarGuiaConOpenAI } from "@/lib/importador/parser-ia";

export type ProveedorIA = "gemini" | "openai";

export async function generarGuiaConProveedor(
  apuntes: string,
  imagenes: ImagenParaIA[] = [],
  preferido?: ProveedorIA
) {
  const orden: ProveedorIA[] =
    preferido === "openai"
      ? ["openai", "gemini"]
      : preferido === "gemini"
        ? ["gemini", "openai"]
        : proveedorIADisponible() === "openai"
          ? ["openai", "gemini"]
          : ["gemini", "openai"];

  let ultimoError: unknown;

  for (const proveedor of orden) {
    if (proveedor === "gemini" && !obtenerClaveGemini()) continue;
    if (proveedor === "openai" && !process.env.OPENAI_API_KEY) continue;

    try {
      if (proveedor === "gemini") {
        const r = await generarGuiaConGemini(apuntes, imagenes);
        return { ...r, proveedor: "gemini" as const };
      }
      const r = await generarGuiaConOpenAI(apuntes, imagenes);
      return { ...r, proveedor: "openai" as const };
    } catch (e) {
      ultimoError = e;
    }
  }

  throw ultimoError ?? new Error("Ningún proveedor de IA disponible.");
}
