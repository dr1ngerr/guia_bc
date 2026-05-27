"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Maximize, Minimize } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VisorImagenAmpliadaProps {
  url: string | null;
  alt?: string;
  onClose: () => void;
}

/**
 * Visor de imagen con dos modos:
 *  - Ajustar: la imagen entra completa en el viewport.
 *  - Tamaño real: la imagen se muestra a su resolución nativa con scroll.
 * Permite también abrirla en una pestaña nueva para inspeccionar detalles.
 */
export function VisorImagenAmpliada({
  url,
  alt = "Captura",
  onClose,
}: VisorImagenAmpliadaProps) {
  const [tamanoReal, setTamanoReal] = useState(false);

  useEffect(() => {
    if (!url) setTamanoReal(false);
  }, [url]);

  return (
    <Dialog open={!!url} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[96vw] w-[96vw] max-h-[96vh] h-[96vh] p-0 overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="flex items-center justify-end gap-1 border-b bg-background/95 p-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setTamanoReal((v) => !v)}
            aria-pressed={tamanoReal}
          >
            {tamanoReal ? (
              <>
                <Minimize className="h-4 w-4 mr-1" />
                Ajustar a pantalla
              </>
            ) : (
              <>
                <Maximize className="h-4 w-4 mr-1" />
                Tamaño real
              </>
            )}
          </Button>
          {url && (
            <Button type="button" variant="ghost" size="sm" asChild>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir imagen en una pestaña nueva"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir original
              </a>
            </Button>
          )}
        </div>
        <div
          className={cn(
            "flex-1 min-h-0 bg-background",
            tamanoReal ? "overflow-auto" : "overflow-hidden flex items-center justify-center p-2"
          )}
        >
          {url && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={alt}
                className={cn(
                  tamanoReal
                    ? "block max-w-none cursor-zoom-out"
                    : "max-w-full max-h-full object-contain cursor-zoom-in mx-auto"
                )}
                onClick={() => setTamanoReal((v) => !v)}
                draggable={false}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
