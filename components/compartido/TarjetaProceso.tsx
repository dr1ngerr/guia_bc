import Link from "next/link";
import { CheckCircle2, Clock, ListOrdered } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EtiquetaHerramienta } from "@/components/compartido/EtiquetaHerramienta";
import { formatearDuracion, formatearFecha } from "@/lib/utils";
import type { EstadoProceso, Herramienta } from "@/lib/supabase/tipos";

export interface DatosTarjetaProceso {
  id: string;
  nombre: string;
  icono: string;
  herramienta: Herramienta;
  categoria: string | null;
  duracion_minutos: number | null;
  actualizado_en: string;
  numPasos: number;
  estado?: EstadoProceso;
  porcentajeProgreso?: number;
}

export function TarjetaProceso({
  proceso,
  mostrarEstado = false,
}: {
  proceso: DatosTarjetaProceso;
  mostrarEstado?: boolean;
}) {
  const completado = proceso.porcentajeProgreso === 100;
  const enCurso =
    proceso.porcentajeProgreso !== undefined &&
    proceso.porcentajeProgreso > 0 &&
    !completado;

  return (
    <Link href={`/proceso/${proceso.id}`} className="block h-full group">
      <Card className="h-full transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-3xl" aria-hidden>
              {proceso.icono}
            </span>
            <div className="flex flex-col items-end gap-1">
              <EtiquetaHerramienta herramienta={proceso.herramienta} />
              {mostrarEstado && proceso.estado === "borrador" && (
                <Badge variant="secondary" className="text-xs">
                  Borrador
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg leading-snug">{proceso.nombre}</CardTitle>
          {proceso.categoria && (
            <p className="text-xs text-muted-foreground">{proceso.categoria}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ListOrdered className="h-4 w-4" />
              {proceso.numPasos} pasos
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatearDuracion(proceso.duracion_minutos)}
            </span>
          </div>

          {proceso.porcentajeProgreso !== undefined && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {completado ? (
                    <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completado
                    </span>
                  ) : enCurso ? (
                    "En progreso"
                  ) : (
                    "Sin empezar"
                  )}
                </span>
                <span className="font-medium tabular-nums">
                  {proceso.porcentajeProgreso}%
                </span>
              </div>
              <Progress value={proceso.porcentajeProgreso} className="h-1.5" />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Actualizado: {formatearFecha(proceso.actualizado_en)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
