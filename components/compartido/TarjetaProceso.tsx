import Link from "next/link";
import { Clock, ListOrdered } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EtiquetaHerramienta } from "@/components/compartido/EtiquetaHerramienta";
import { formatearDuracion, formatearFecha } from "@/lib/utils";
import type { Herramienta } from "@/lib/supabase/tipos";

export interface DatosTarjetaProceso {
  id: string;
  nombre: string;
  icono: string;
  herramienta: Herramienta;
  categoria: string | null;
  duracion_minutos: number | null;
  actualizado_en: string;
  numPasos: number;
}

export function TarjetaProceso({ proceso }: { proceso: DatosTarjetaProceso }) {
  return (
    <Link href={`/proceso/${proceso.id}`} className="block h-full">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-3xl" aria-hidden>
              {proceso.icono}
            </span>
            <EtiquetaHerramienta herramienta={proceso.herramienta} />
          </div>
          <CardTitle className="text-lg leading-snug">{proceso.nombre}</CardTitle>
          {proceso.categoria && (
            <p className="text-xs text-muted-foreground">{proceso.categoria}</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <ListOrdered className="h-4 w-4" />
            {proceso.numPasos} pasos
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatearDuracion(proceso.duracion_minutos)}
          </span>
          <span className="w-full text-xs">
            Actualizado: {formatearFecha(proceso.actualizado_en)}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
