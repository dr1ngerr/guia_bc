"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { VisorImagenAmpliada } from "@/components/guia/VisorImagenAmpliada";
import type { Captura } from "@/lib/supabase/tipos";

export function VisorCaptura({ captura }: { captura: Captura }) {
  const [ampliada, setAmpliada] = useState(false);

  return (
    <figure className="space-y-2 guia-paso">
      <button
        type="button"
        onClick={() => setAmpliada(true)}
        className="relative block w-full overflow-hidden rounded-lg border bg-muted/30 group cursor-zoom-in"
        aria-label="Ampliar captura"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={captura.url}
          alt={captura.pie_imagen ?? "Captura de pantalla"}
          className="w-full h-auto object-contain max-h-[70vh]"
          loading="lazy"
        />
        <span className="absolute top-2 right-2 rounded-md bg-black/60 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="h-4 w-4" />
        </span>
      </button>
      {captura.pie_imagen && (
        <figcaption className="text-sm text-muted-foreground text-center">
          {captura.pie_imagen}
        </figcaption>
      )}

      <VisorImagenAmpliada
        url={ampliada ? captura.url : null}
        alt={captura.pie_imagen ?? "Captura"}
        onClose={() => setAmpliada(false)}
      />
    </figure>
  );
}
