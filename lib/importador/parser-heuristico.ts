import type { GuiaGenerada, PasoGenerado } from "@/lib/importador/tipos";
import {
  detectarAlerta,
  detectarHerramienta,
  detectarIcono,
  detectarVerificacion,
  textoAHtml,
} from "@/lib/importador/utilidades";

function dividirEnPasos(texto: string): string[] {
  const normalizado = texto.replace(/\r\n/g, "\n").trim();

  // Separadores explícitos
  if (/^---+\s*$/m.test(normalizado) || /^===+\s*$/m.test(normalizado)) {
    return normalizado
      .split(/^[-=]{3,}\s*$/m)
      .map((b) => b.trim())
      .filter(Boolean);
  }

  // "Paso 1", "PASO 2:", etc.
  const porPaso = normalizado.split(/(?=^paso\s+\d+)/gim);
  if (porPaso.length > 1) {
    return porPaso.map((b) => b.trim()).filter(Boolean);
  }

  // Listas numeradas al inicio de línea: 1. 2) 3-
  const porNumero = normalizado.split(/(?=^\s*\d+[.)]\s+)/m);
  if (porNumero.length > 1) {
    return porNumero.map((b) => b.trim()).filter(Boolean);
  }

  // Párrafos largos separados por doble salto
  const parrafos = normalizado.split(/\n\s*\n/).filter(Boolean);
  if (parrafos.length >= 2) return parrafos;

  return [normalizado];
}

function extraerTituloProceso(lineas: string[]): string {
  const primera = lineas.find((l) => l.trim())?.trim() ?? "Proceso importado";
  if (primera.startsWith("#")) return primera.replace(/^#+\s*/, "");
  if (primera.length < 120 && !/^\d+[.)]/.test(primera)) return primera;
  return "Proceso importado";
}

function parsearPaso(bloque: string, indice: number): PasoGenerado {
  const lineas = bloque.split("\n").map((l) => l.trim());
  let titulo = lineas[0] ?? `Paso ${indice + 1}`;

  titulo = titulo
    .replace(/^paso\s+\d+[:\s.-]*/i, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim();

  if (!titulo) titulo = `Paso ${indice + 1}`;

  const cuerpoLineas = lineas.slice(1).filter((l) => {
    const lower = l.toLowerCase();
    if (/^(cr[ií]tico|peligro|advertencia|consejo|tip|importante)[:\s]/i.test(lower))
      return true;
    if (/^(comprobar|verificar|confirmar)/i.test(lower)) return true;
    return l.length > 0;
  });

  const alerta = detectarAlerta(bloque);
  const verificacion = detectarVerificacion(bloque);

  let consejo: string | null = null;
  const consejoMatch = bloque.match(/^(?:consejo|tip|nota)[:\s]+(.+)$/im);
  if (consejoMatch) consejo = consejoMatch[1].trim();

  const descripcionTexto = cuerpoLineas
    .filter((l) => {
      if (alerta.texto && l.includes(alerta.texto)) return false;
      if (verificacion && l.includes(verificacion)) return false;
      return true;
    })
    .join("\n\n");

  return {
    titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1),
    descripcion: textoAHtml(descripcionTexto || bloque),
    tipo_alerta: alerta.tipo,
    texto_alerta: alerta.texto,
    texto_verificacion: verificacion,
    consejo,
  };
}

export function generarGuiaHeuristica(
  apuntes: string,
  avisos: string[]
): GuiaGenerada {
  const texto = apuntes.trim();
  if (texto.length < 20) {
    throw new Error("Los apuntes son demasiado cortos. Pega al menos un párrafo o varios pasos.");
  }

  const lineas = texto.split("\n");
  const nombre = extraerTituloProceso(lineas);

  // Quitar título del cuerpo si era la primera línea
  let cuerpo = texto;
  if (lineas[0]?.trim() === nombre || lineas[0]?.includes(nombre)) {
    cuerpo = lineas.slice(1).join("\n").trim() || texto;
  }

  const bloques = dividirEnPasos(cuerpo);
  const pasos = bloques.map((b, i) => parsearPaso(b, i));

  if (pasos.length === 0) {
    pasos.push(parsearPaso(cuerpo, 0));
  }

  if (pasos.length === 1 && pasos[0].descripcion.length < 30) {
    avisos.push(
      "No se detectaron pasos numerados. Se creó un solo paso; edítalo o divide los apuntes con '1.', '2.', o 'Paso 1'."
    );
  }

  const herramienta = detectarHerramienta(texto);
  const duracion = Math.max(15, Math.min(180, pasos.length * 8));

  return {
    nombre,
    descripcion: `<p>Guía generada a partir de apuntes. Revisa cada paso antes de publicar.</p>`,
    herramienta,
    icono: detectarIcono(herramienta, nombre),
    categoria: null,
    duracion_minutos: duracion,
    pasos,
  };
}
