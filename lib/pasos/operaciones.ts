import { eliminarCapturasDePaso } from "@/lib/capturas/almacenamiento";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import type { PasoEditor } from "@/lib/store/useEditorStore";

type ClienteSupabase = ReturnType<typeof crearClienteSupabase>;

const DESPLAZAMIENTO_ORDEN_TEMPORAL = 100_000;

export function validarPasos(pasos: PasoEditor[]): string | null {
  for (let i = 0; i < pasos.length; i++) {
    if (!pasos[i].titulo.trim()) {
      return `El paso ${i + 1} necesita un título.`;
    }
  }
  return null;
}

/** Elimina un paso, sus capturas en BD y los archivos en Storage. */
export async function eliminarPasoCompleto(
  supabase: ClienteSupabase,
  idPaso: string
): Promise<void> {
  await eliminarCapturasDePaso(supabase, idPaso);

  const { error } = await supabase.from("pasos").delete().eq("id", idPaso);
  if (error) {
    throw new Error(`No se pudo eliminar el paso: ${error.message}`);
  }
}

/** Sincroniza pasos eliminados en la UI que aún existen en la base de datos. */
export async function eliminarPasosHuerfanos(
  supabase: ClienteSupabase,
  idProceso: string,
  idsActivos: string[]
): Promise<void> {
  const { data: pasosDb, error } = await supabase
    .from("pasos")
    .select("id")
    .eq("id_proceso", idProceso);

  if (error) {
    throw new Error(error.message);
  }

  const activos = new Set(idsActivos);
  const idsEliminar = ((pasosDb ?? []) as { id: string }[])
    .map((p) => p.id)
    .filter((id) => !activos.has(id));

  for (const id of idsEliminar) {
    await eliminarPasoCompleto(supabase, id);
  }
}

/**
 * Guarda todos los pasos del editor evitando conflictos con unique(id_proceso, orden).
 */
export async function guardarPasosEditor(
  supabase: ClienteSupabase,
  idProceso: string,
  pasos: PasoEditor[]
): Promise<void> {
  const errorValidacion = validarPasos(pasos);
  if (errorValidacion) {
    throw new Error(errorValidacion);
  }

  await eliminarPasosHuerfanos(
    supabase,
    idProceso,
    pasos.map((p) => p.id)
  );

  // Fase 1: desplazar orden para liberar valores únicos
  for (const paso of pasos) {
    const { error } = await supabase
      .from("pasos")
      .update({ orden: paso.orden + DESPLAZAMIENTO_ORDEN_TEMPORAL })
      .eq("id", paso.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  // Fase 2: valores finales y resto de campos
  for (let i = 0; i < pasos.length; i++) {
    const paso = pasos[i];
    const { error } = await supabase.from("pasos").upsert({
      id: paso.id,
      id_proceso: idProceso,
      orden: i,
      titulo: paso.titulo.trim(),
      descripcion: paso.descripcion,
      tipo_alerta: paso.tipo_alerta,
      texto_alerta: paso.texto_alerta,
      texto_verificacion: paso.texto_verificacion,
      consejo: paso.consejo,
      url_video: paso.url_video,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
