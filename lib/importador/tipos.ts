import type { Herramienta, TipoAlerta } from "@/lib/supabase/tipos";

export interface PasoGenerado {
  titulo: string;
  descripcion: string;
  tipo_alerta: TipoAlerta | null;
  texto_alerta: string | null;
  texto_verificacion: string | null;
  consejo: string | null;
}

export interface GuiaGenerada {
  nombre: string;
  descripcion: string;
  herramienta: Herramienta;
  icono: string;
  categoria: string | null;
  duracion_minutos: number;
  pasos: PasoGenerado[];
}

export type MetodoGeneracion = "ia" | "ia-vision" | "heuristica";

export interface ResultadoGeneracion {
  guia: GuiaGenerada;
  metodo: MetodoGeneracion;
  avisos: string[];
  fuentes?: string[];
}

export interface ImagenParaIA {
  nombre: string;
  mime: string;
  base64: string;
}

export interface ContenidoImportado {
  texto: string;
  imagenes: ImagenParaIA[];
  fuentes: string[];
}
