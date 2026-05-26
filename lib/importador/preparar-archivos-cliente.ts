/** Límite seguro para Vercel (body máx. ~4,5 MB en serverless). */
export const MAX_BYTES_SUBIDA = 3.5 * 1024 * 1024;
export const MAX_ARCHIVOS_SUBIDA = 12;
const MAX_ANCHO_IMAGEN = 1600;
const CALIDAD_JPEG = 0.82;

function esImagen(f: File): boolean {
  return (
    f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(f.name)
  );
}

async function comprimirImagen(file: File): Promise<File> {
  if (!esImagen(file)) return file;

  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, MAX_ANCHO_IMAGEN / bitmap.width);
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", CALIDAD_JPEG)
  );
  if (!blob) return file;

  const nombre = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], nombre, { type: "image/jpeg" });
}

export async function prepararArchivosParaSubida(
  archivos: File[]
): Promise<{ archivos: File[]; avisos: string[] }> {
  const avisos: string[] = [];

  if (archivos.length > MAX_ARCHIVOS_SUBIDA) {
    throw new Error(
      `Máximo ${MAX_ARCHIVOS_SUBIDA} archivos. Quita algunos e inténtalo de nuevo.`
    );
  }

  const preparados: File[] = [];
  for (const archivo of archivos) {
    if (esImagen(archivo)) {
      const comprimido = await comprimirImagen(archivo);
      if (comprimido.size < archivo.size) {
        avisos.push(
          `${archivo.name}: optimizada (${(archivo.size / 1024).toFixed(0)} → ${(comprimido.size / 1024).toFixed(0)} KB)`
        );
      }
      preparados.push(comprimido);
    } else {
      preparados.push(archivo);
    }
  }

  const total = preparados.reduce((s, f) => s + f.size, 0);
  if (total > MAX_BYTES_SUBIDA) {
    throw new Error(
      `El total (${(total / 1024 / 1024).toFixed(1)} MB) supera el límite de ${(MAX_BYTES_SUBIDA / 1024 / 1024).toFixed(1)} MB. Sube menos archivos o capturas más pequeñas.`
    );
  }

  return { archivos: preparados, avisos };
}

/** Parsea respuesta del API aunque Vercel devuelva texto plano (p. ej. 413). */
export async function parsearRespuestaApi(
  res: Response
): Promise<Record<string, unknown>> {
  const texto = await res.text();
  try {
    return JSON.parse(texto) as Record<string, unknown>;
  } catch {
    if (
      res.status === 413 ||
      /request entity too large/i.test(texto)
    ) {
      throw new Error(
        "Los archivos son demasiado grandes para el servidor. Se comprimirán automáticamente: usa menos capturas o archivos más ligeros (máx. ~3,5 MB en total)."
      );
    }
    throw new Error(
      texto.slice(0, 280).trim() ||
        `Error del servidor (${res.status}). Comprueba /api/diagnostico.`
    );
  }
}
