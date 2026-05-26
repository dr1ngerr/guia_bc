"use client";

import dynamic from "next/dynamic";
import type { Anotacion } from "@/lib/supabase/tipos";

const LienzoAnotacion = dynamic(
  () =>
    import("@/components/editor/LienzoAnotacion").then((m) => m.LienzoAnotacion),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground p-4">Cargando editor de anotaciones…</p>
    ),
  }
);

export function LienzoAnotacionDynamic(props: {
  imagenUrl: string;
  anotacionesIniciales?: Anotacion[];
  onGuardar: (anotaciones: Anotacion[], imagenExportada: Blob) => void;
  onCancelar: () => void;
}) {
  return <LienzoAnotacion {...props} />;
}
