import type { Captura } from "@/lib/supabase/tipos";
import { crearClienteSupabase } from "@/lib/supabase/cliente";

export const BUCKET_CAPTURAS = "capturas";

type ClienteSupabase = ReturnType<typeof crearClienteSupabase>;

/** Extrae la ruta interna del bucket a partir de la URL pública de Supabase Storage. */
export function rutaStorageDesdeUrl(url: string): string | null {
  const marcador = `/storage/v1/object/public/${BUCKET_CAPTURAS}/`;
  const indice = url.indexOf(marcador);
  if (indice === -1) return null;
  return decodeURIComponent(url.slice(indice + marcador.length));
}

export async function eliminarArchivosStorage(
  supabase: ClienteSupabase,
  rutas: string[]
): Promise<void> {
  const unicas = [...new Set(rutas.filter(Boolean))];
  if (unicas.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET_CAPTURAS).remove(unicas);
  if (error) {
    throw new Error(`No se pudo eliminar del almacenamiento: ${error.message}`);
  }
}

export async function eliminarArchivoPorUrl(
  supabase: ClienteSupabase,
  url: string
): Promise<void> {
  const ruta = rutaStorageDesdeUrl(url);
  if (!ruta) return;
  await eliminarArchivosStorage(supabase, [ruta]);
}

/** Elimina filas de capturas y sus archivos en Storage. */
export async function eliminarCapturas(
  supabase: ClienteSupabase,
  capturas: Captura[]
): Promise<void> {
  if (capturas.length === 0) return;

  const rutas = capturas
    .map((c) => rutaStorageDesdeUrl(c.url))
    .filter((r): r is string => r !== null);

  const ids = capturas.map((c) => c.id);

  const { error: errDb } = await supabase.from("capturas").delete().in("id", ids);
  if (errDb) {
    throw new Error(`No se pudo eliminar la captura: ${errDb.message}`);
  }

  if (rutas.length > 0) {
    try {
      await eliminarArchivosStorage(supabase, rutas);
    } catch {
      // La fila ya no existe en BD; el archivo huérfano es preferible a bloquear al usuario.
    }
  }
}

export async function eliminarCaptura(
  supabase: ClienteSupabase,
  captura: Captura
): Promise<void> {
  await eliminarCapturas(supabase, [captura]);
}

/** Elimina todas las capturas (y archivos) asociadas a un paso. */
export async function eliminarCapturasDePaso(
  supabase: ClienteSupabase,
  idPaso: string
): Promise<void> {
  const { data, error } = await supabase
    .from("capturas")
    .select("*")
    .eq("id_paso", idPaso);

  if (error) {
    throw new Error(`No se pudieron listar capturas: ${error.message}`);
  }

  await eliminarCapturas(supabase, (data ?? []) as Captura[]);
}

export async function subirImagenCaptura(
  supabase: ClienteSupabase,
  idPaso: string,
  file: File
): Promise<{ publicUrl: string; path: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${idPaso}/${crypto.randomUUID()}.${ext}`;

  const { error: errUpload } = await supabase.storage
    .from(BUCKET_CAPTURAS)
    .upload(path, file, { upsert: false });

  if (errUpload) {
    throw new Error(errUpload.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_CAPTURAS).getPublicUrl(path);

  return { publicUrl, path };
}
