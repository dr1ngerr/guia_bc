"use client";

import { BloqueAlerta } from "@/components/guia/BloqueAlerta";
import { CasillaVerificacion } from "@/components/guia/CasillaVerificacion";
import { VisorCaptura } from "@/components/guia/VisorCaptura";
import type { Paso } from "@/lib/supabase/tipos";
import type { Captura } from "@/lib/supabase/tipos";
import { Lightbulb } from "lucide-react";

export function PanelPaso({
  paso,
  indice,
  verificacionMarcada,
  onVerificacionChange,
}: {
  paso: Paso & { capturas: Captura[] };
  indice: number;
  verificacionMarcada: boolean;
  onVerificacionChange: (marcada: boolean) => void;
}) {
  return (
    <article className="guia-paso space-y-6 max-w-3xl">
      <header>
        <p className="text-sm font-mono text-muted-foreground mb-1">
          Paso {indice + 1}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold leading-tight">
          {paso.titulo}
        </h1>
      </header>

      {paso.tipo_alerta && paso.texto_alerta && (
        <BloqueAlerta tipo={paso.tipo_alerta} texto={paso.texto_alerta} />
      )}

      {paso.descripcion && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: paso.descripcion }}
        />
      )}

      {paso.capturas.length > 0 && (
        <div className="space-y-4">
          {paso.capturas.map((c) => (
            <VisorCaptura key={c.id} captura={c} />
          ))}
        </div>
      )}

      {paso.texto_verificacion && (
        <CasillaVerificacion
          texto={paso.texto_verificacion}
          marcada={verificacionMarcada}
          onChange={onVerificacionChange}
        />
      )}

      {paso.consejo && (
        <div className="flex gap-2 rounded-md bg-muted p-4 text-sm">
          <Lightbulb className="h-5 w-5 shrink-0 text-primary" />
          <p>{paso.consejo}</p>
        </div>
      )}

      {paso.url_video && (
        <div className="aspect-video rounded-lg overflow-hidden border">
          <iframe
            src={paso.url_video}
            title="Vídeo del paso"
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      )}
    </article>
  );
}
