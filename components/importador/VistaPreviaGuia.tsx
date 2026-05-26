"use client";

import { BloqueAlerta } from "@/components/guia/BloqueAlerta";
import { Badge } from "@/components/ui/badge";
import { EtiquetaHerramienta } from "@/components/compartido/EtiquetaHerramienta";
import type { GuiaGenerada } from "@/lib/importador/tipos";
import type { Herramienta } from "@/lib/supabase/tipos";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export function VistaPreviaGuia({ guia }: { guia: GuiaGenerada }) {
  return (
    <div className="space-y-6 border rounded-lg p-6 bg-card">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">{guia.icono}</span>
          <EtiquetaHerramienta herramienta={guia.herramienta as Herramienta} />
          <Badge variant="secondary">{guia.pasos.length} pasos</Badge>
          <Badge variant="outline">~{guia.duracion_minutos} min</Badge>
        </div>
        <h2 className="text-xl font-bold">{guia.nombre}</h2>
        <div
          className="text-sm text-muted-foreground mt-2 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: guia.descripcion }}
        />
      </header>

      <ol className="space-y-8">
        {guia.pasos.map((paso, i) => (
          <li key={i} className="border-l-4 border-primary pl-4 space-y-3">
            <h3 className="font-semibold text-lg">
              Paso {i + 1}: {paso.titulo}
            </h3>

            {paso.tipo_alerta && paso.texto_alerta && (
              <BloqueAlerta tipo={paso.tipo_alerta} texto={paso.texto_alerta} />
            )}

            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: paso.descripcion }}
            />

            {paso.texto_verificacion && (
              <div className="flex gap-2 items-start text-sm border rounded-md p-3 bg-muted/50">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span>
                  <strong>Verificación:</strong> {paso.texto_verificacion}
                </span>
              </div>
            )}

            {paso.consejo && (
              <p className="text-sm text-muted-foreground flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {paso.consejo}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
