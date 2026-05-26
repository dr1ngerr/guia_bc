import type { ContenidoImportado, ImagenParaIA } from "@/lib/importador/tipos";

const MAX_ARCHIVOS = 20;
const MAX_BYTES_TOTAL = 25 * 1024 * 1024; // 25 MB
const IMAGEN_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function extraerDeArchivos(
  archivos: File[]
): Promise<ContenidoImportado> {
  if (archivos.length > MAX_ARCHIVOS) {
    throw new Error(`Máximo ${MAX_ARCHIVOS} archivos por importación.`);
  }

  let bytesTotal = 0;
  const partesTexto: string[] = [];
  const imagenes: ImagenParaIA[] = [];
  const fuentes: string[] = [];

  for (const archivo of archivos) {
    bytesTotal += archivo.size;
    if (bytesTotal > MAX_BYTES_TOTAL) {
      throw new Error("El tamaño total de archivos supera 25 MB.");
    }

    fuentes.push(archivo.name);
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const nombre = archivo.name;
    const mime = archivo.type || "application/octet-stream";

    if (IMAGEN_MIMES.has(mime) || /\.(jpe?g|png|webp|gif)$/i.test(nombre)) {
      imagenes.push({
        nombre,
        mime: mime.startsWith("image/") ? mime : "image/png",
        base64: buffer.toString("base64"),
      });
      continue;
    }

    if (mime === "application/pdf" || nombre.endsWith(".pdf")) {
      const texto = await extraerPdf(buffer);
      partesTexto.push(`--- Documento PDF: ${nombre} ---\n${texto}`);
      continue;
    }

    if (
      mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      nombre.endsWith(".docx")
    ) {
      const texto = await extraerDocx(buffer);
      partesTexto.push(`--- Documento Word: ${nombre} ---\n${texto}`);
      continue;
    }

    if (
      mime.startsWith("text/") ||
      /\.(txt|md|csv)$/i.test(nombre)
    ) {
      partesTexto.push(
        `--- Archivo de texto: ${nombre} ---\n${buffer.toString("utf-8")}`
      );
      continue;
    }

    throw new Error(
      `Formato no soportado: ${nombre}. Usa imágenes (PNG/JPG), PDF, Word (.docx) o texto.`
    );
  }

  return {
    texto: partesTexto.join("\n\n"),
    imagenes,
    fuentes,
  };
}

async function extraerPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return (data.text ?? "").trim();
}

async function extraerDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return (result.value ?? "").trim();
}
