"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Captura } from "@/lib/supabase/tipos";

export function VisorCaptura({ captura }: { captura: Captura }) {
  const [ampliada, setAmpliada] = useState(false);

  return (
    <figure className="space-y-2 guia-paso">
      <button
        type="button"
        onClick={() => setAmpliada(true)}
        className="relative block w-full overflow-hidden rounded-lg border bg-muted group cursor-zoom-in"
        aria-label="Ampliar captura"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={captura.url}
          alt={captura.pie_imagen ?? "Captura de pantalla"}
          className="w-full h-auto object-contain max-h-[480px]"
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

      <Dialog open={ampliada} onOpenChange={setAmpliada}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-2">
          <DialogTitle className="sr-only">
            {captura.pie_imagen ?? "Captura ampliada"}
          </DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={captura.url}
            alt={captura.pie_imagen ?? "Captura"}
            className="max-h-[85vh] w-auto mx-auto object-contain"
          />
        </DialogContent>
      </Dialog>
    </figure>
  );
}
