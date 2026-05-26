import type { Herramienta, TipoAlerta } from "@/lib/supabase/tipos";
import { HERRAMIENTAS, ICONOS_PROCESO } from "@/lib/supabase/tipos";

export function textoAHtml(texto: string): string {
  const parrafos = texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parrafos.length === 0) return "<p></p>";

  return parrafos
    .map((p) => {
      const lineas = p.split("\n").filter(Boolean);
      if (lineas.every((l) => /^[-*•]\s/.test(l))) {
        const items = lineas
          .map((l) => `<li>${escapeHtml(l.replace(/^[-*•]\s*/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      if (lineas.every((l) => /^\d+[.)]\s/.test(l))) {
        const items = lineas
          .map((l) => `<li>${escapeHtml(l.replace(/^\d+[.)]\s*/, ""))}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }
      return `<p>${escapeHtml(p.replace(/\n/g, " "))}</p>`;
    })
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function detectarHerramienta(texto: string): Herramienta {
  const t = texto.toLowerCase();
  if (t.includes("business central") || t.includes(" bc ") || t.includes("dynamics"))
    return "Business Central";
  if (t.includes("google sheet") || t.includes("hoja de cálculo google"))
    return "Google Sheets";
  if (t.includes("excel") || t.includes(".xlsx")) return "Excel";
  if (t.includes("correo") || t.includes("email") || t.includes("outlook"))
    return "Email";
  if (t.includes("navegador") || t.includes("web") || t.includes("http"))
    return "Web";
  return "Business Central";
}

export function detectarIcono(herramienta: Herramienta, nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes("factur")) return "🧾";
  if (n.includes("compra") || n.includes("proveedor")) return "📦";
  if (n.includes("nómina") || n.includes("empleado")) return "👤";
  if (herramienta === "Email") return "📧";
  if (herramienta === "Excel" || herramienta === "Google Sheets") return "📊";
  return ICONOS_PROCESO[0];
}

export function detectarAlerta(bloque: string): {
  tipo: TipoAlerta | null;
  texto: string | null;
} {
  const lineas = bloque.split("\n");
  for (const linea of lineas) {
    const l = linea.trim();
    const lower = l.toLowerCase();

    if (
      /^(cr[ií]tico|peligro|importante|atenci[oó]n|¡?cuidado|no\s+(borrar|eliminar|des hacer))/i.test(
        lower
      ) ||
      lower.includes("no se puede deshacer") ||
      lower.includes("irreversible")
    ) {
      const tipo: TipoAlerta =
        lower.includes("consejo") || lower.startsWith("tip")
          ? "consejo"
          : lower.includes("revisa") || lower.includes("comprueba")
            ? "advertencia"
            : "peligro";
      return { tipo, texto: l.replace(/^(cr[ií]tico|peligro|importante|atenci[oó]n)[:\s]*/i, "") };
    }

    if (/^(advertencia|revisar|ojo|verificar antes)/i.test(lower)) {
      return {
        tipo: "advertencia",
        texto: l.replace(/^(advertencia|revisar)[:\s]*/i, ""),
      };
    }

    if (/^(consejo|tip|nota|truco)/i.test(lower)) {
      return { tipo: "consejo", texto: l.replace(/^(consejo|tip|nota)[:\s]*/i, "") };
    }
  }
  return { tipo: null, texto: null };
}

export function detectarVerificacion(bloque: string): string | null {
  const lineas = bloque.split("\n");
  for (const linea of lineas) {
    const l = linea.trim();
    if (
      /^(comprobar|verificar|confirmar|aseg[uú]rate|marca cuando)/i.test(l) ||
      /\[.\]\s/.test(l) ||
      /^✓\s/i.test(l)
    ) {
      return l
        .replace(/^\[.\]\s*/, "")
        .replace(/^✓\s*/, "")
        .replace(/^(comprobar|verificar|confirmar)[:\s]*/i, "");
    }
  }
  return null;
}

export function validarHerramienta(h: string): Herramienta {
  return HERRAMIENTAS.includes(h as Herramienta)
    ? (h as Herramienta)
    : "Otra";
}
