// OCR en el navegador cuando Gemini no está disponible.
// Se carga tesseract.js desde CDN para evitar dependencias/créditos.
// Nota: OCR es menos exacto que una IA con visión, pero mantiene el flujo operativo.

"use client";

export type LoggerOCR = (mensaje: string) => void;

type TesseractReconResult = {
  data?: {
    text?: string;
  };
};

type TesseractWorker = {
  recognize: (input: Blob) => Promise<TesseractReconResult>;
  terminate: () => Promise<void>;
};

type TesseractModule = {
  createWorker: (language: string) => Promise<TesseractWorker>;
};

declare global {
  interface Window {
    Tesseract?: TesseractModule;
  }
}

function esImagen(f: File): boolean {
  return (
    f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(f.name)
  );
}

async function cargarTesseractDesdeCDN(
  logger?: LoggerOCR
): Promise<TesseractModule> {
  if (typeof window === "undefined") {
    throw new Error("OCR solo disponible en cliente.");
  }

  if (window.Tesseract) return window.Tesseract;

  logger?.("Cargando motor OCR…");

  const src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("No se pudo cargar tesseract.js desde CDN."));
    document.head.appendChild(script);
  });

  if (!window.Tesseract) {
    throw new Error("Motor OCR no disponible tras cargar el script.");
  }

  return window.Tesseract;
}

async function redimensionarParaOCR(file: File, maxAncho = 1600): Promise<Blob> {
  // Reducción para acelerar OCR.
  if (!esImagen(file)) return file;

  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxAncho / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.max(1, Math.round(bitmap.width * escala));
  const alto = Math.max(1, Math.round(bitmap.height * escala));

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82);
  });
  return blob ?? file;
}

export async function ocrImagenesParaTexto(
  archivos: File[],
  opciones?: {
    maxImagenes?: number;
    maxAncho?: number;
    logger?: LoggerOCR;
  }
): Promise<string> {
  const maxImagenes = opciones?.maxImagenes ?? 4;
  const maxAncho = opciones?.maxAncho ?? 1600;
  const logger = opciones?.logger;

  const imagenes = archivos.filter(esImagen).slice(0, maxImagenes);
  if (imagenes.length === 0) return "";

  const Tesseract = await cargarTesseractDesdeCDN(logger);

  // Usamos un único worker para reutilizar inicialización.
  logger?.("Inicializando OCR…");
  const worker = await Tesseract.createWorker("spa");

  try {
    let total = "";
    for (let idx = 0; idx < imagenes.length; idx++) {
      const f = imagenes[idx];
      logger?.(`OCR ${idx + 1}/${imagenes.length}: ${f.name}`);

      const blob = await redimensionarParaOCR(f, maxAncho);
      const res = await worker.recognize(blob);

      const texto = (res?.data?.text ?? "").trim();
      if (texto) {
        total += `\n\n--- OCR: ${f.name} ---\n${texto}`;
      } else {
        total += `\n\n--- OCR: ${f.name} ---\n[sin texto detectado]`;
      }
    }

    return total.trim();
  } finally {
    await worker.terminate().catch(() => void 0);
  }
}

