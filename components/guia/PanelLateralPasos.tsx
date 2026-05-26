"use client";

import { Check, Circle } from "lucide-react";
import { EtiquetaHerramienta } from "@/components/compartido/EtiquetaHerramienta";
import type { Herramienta } from "@/lib/supabase/tipos";
import { cn } from "@/lib/utils";

interface PasoLista {
  orden: number;
  titulo: string;
}

export function PanelLateralPasos({
  nombre,
  herramienta,
  icono,
  pasos,
  pasoActual,
  pasosCompletados,
  onSeleccionar,
}: {
  nombre: string;
  herramienta: Herramienta;
  icono: string;
  pasos: PasoLista[];
  pasoActual: number;
  pasosCompletados: number[];
  onSeleccionar: (indice: number) => void;
}) {
  return (
    <aside className="no-imprimir w-full lg:w-72 shrink-0 border-r bg-card p-4 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
      <div className="mb-4">
        <span className="text-2xl">{icono}</span>
        <h2 className="font-semibold text-lg mt-1 leading-tight">{nombre}</h2>
        <EtiquetaHerramienta herramienta={herramienta} className="mt-2" />
      </div>
      <ol className="space-y-1">
        {pasos.map((paso, i) => {
          const completado = pasosCompletados.includes(i);
          const activo = i === pasoActual;
          return (
            <li key={paso.orden}>
              <button
                type="button"
                onClick={() => onSeleccionar(i)}
                className={cn(
                  "w-full text-left rounded-md px-3 py-2 text-sm flex items-start gap-2 transition-colors",
                  activo && "bg-primary text-primary-foreground",
                  !activo && completado && "text-muted-foreground",
                  !activo && !completado && "hover:bg-muted"
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {completado ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Circle
                      className={cn(
                        "h-4 w-4",
                        activo ? "fill-primary-foreground" : ""
                      )}
                    />
                  )}
                </span>
                <span>
                  <span className="font-mono text-xs opacity-70">
                    {i + 1}.
                  </span>{" "}
                  {paso.titulo}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
