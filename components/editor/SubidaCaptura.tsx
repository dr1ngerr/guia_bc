"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Clipboard, Trash2, ImagePlus, Loader2 } from "lucide-react";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LienzoAnotacionDynamic } from "@/components/editor/LienzoAnotacionDynamic";
import type { Anotacion, Captura } from "@/lib/supabase/tipos";
import { toast } from "@/hooks/use-toast";
import {
  eliminarArchivoPorUrl,
  eliminarCaptura,
  subirImagenCaptura,
} from "@/lib/capturas/almacenamiento";

export function SubidaCaptura({
  idPaso,
  capturas,
  onActualizar,
}: {
  idPaso: string;
  capturas: Captura[];
  onActualizar: () => void | Promise<void>;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [operandoId, setOperandoId] = useState<string | null>(null);
  const [anotandoUrl, setAnotandoUrl] = useState<string | null>(null);
  const [capturaEditando, setCapturaEditando] = useState<Captura | null>(null);
  const inputNuevaRef = useRef<HTMLInputElement>(null);
  const inputsReemplazoRef = useRef<Record<string, HTMLInputElement | null>>({});

  const limpiarInput = (input: HTMLInputElement | null) => {
    if (input) input.value = "";
  };

  const subirArchivo = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Archivo no válido",
          description: "Solo se permiten imágenes.",
          variant: "destructive",
        });
        return;
      }

      setSubiendo(true);
      const supabase = crearClienteSupabase();

      try {
        const { publicUrl } = await subirImagenCaptura(supabase, idPaso, file);

        const { error: errDb } = await supabase.from("capturas").insert({
          id_paso: idPaso,
          url: publicUrl,
          orden: capturas.length,
          anotaciones: [],
        });

        if (errDb) {
          await eliminarArchivoPorUrl(supabase, publicUrl);
          throw new Error(errDb.message);
        }

        setAnotandoUrl(publicUrl);
        await onActualizar();
        toast({ title: "Imagen subida" });
      } catch (e) {
        toast({
          title: "Error al subir",
          description: e instanceof Error ? e.message : "Error desconocido",
          variant: "destructive",
        });
      } finally {
        setSubiendo(false);
        limpiarInput(inputNuevaRef.current);
      }
    },
    [idPaso, capturas.length, onActualizar]
  );

  const eliminarImagen = async (captura: Captura) => {
    if (
      !window.confirm(
        "¿Eliminar esta imagen? Se borrará del almacenamiento de forma permanente."
      )
    ) {
      return;
    }

    setOperandoId(captura.id);
    const supabase = crearClienteSupabase();

    try {
      await eliminarCaptura(supabase, captura);
      if (capturaEditando?.id === captura.id) {
        setCapturaEditando(null);
        setAnotandoUrl(null);
      }
      await onActualizar();
      toast({ title: "Imagen eliminada" });
    } catch (e) {
      toast({
        title: "Error al eliminar",
        description: e instanceof Error ? e.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setOperandoId(null);
    }
  };

  const reemplazarImagen = async (captura: Captura, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo no válido",
        description: "Solo se permiten imágenes.",
        variant: "destructive",
      });
      limpiarInput(inputsReemplazoRef.current[captura.id]);
      return;
    }

    setOperandoId(captura.id);
    const supabase = crearClienteSupabase();
    const urlAnterior = captura.url;

    try {
      const { publicUrl } = await subirImagenCaptura(supabase, idPaso, file);

      const { error: errDb } = await supabase
        .from("capturas")
        .update({ url: publicUrl, anotaciones: [] })
        .eq("id", captura.id);

      if (errDb) {
        await eliminarArchivoPorUrl(supabase, publicUrl);
        throw new Error(errDb.message);
      }

      try {
        await eliminarArchivoPorUrl(supabase, urlAnterior);
      } catch {
        // No bloquear si el archivo antiguo ya no existe
      }

      if (capturaEditando?.id === captura.id) {
        setCapturaEditando({ ...captura, url: publicUrl, anotaciones: [] });
        setAnotandoUrl(publicUrl);
      }

      await onActualizar();
      toast({ title: "Imagen reemplazada" });
    } catch (e) {
      toast({
        title: "Error al reemplazar",
        description: e instanceof Error ? e.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setOperandoId(null);
      limpiarInput(inputsReemplazoRef.current[captura.id]);
    }
  };

  const actualizarPieImagen = async (captura: Captura, pie: string) => {
    const supabase = crearClienteSupabase();
    const { error } = await supabase
      .from("capturas")
      .update({ pie_imagen: pie || null })
      .eq("id", captura.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    await onActualizar();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) subirArchivo(file);
  };

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      const activo = document.activeElement;
      if (
        activo instanceof HTMLInputElement ||
        activo instanceof HTMLTextAreaElement ||
        activo?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/")
      );
      const file = item?.getAsFile();
      if (file) subirArchivo(file);
    },
    [subirArchivo]
  );

  useEffect(() => {
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onPaste]);

  const guardarAnotacion = async (
    anotaciones: Anotacion[],
    blob: Blob,
    capturaId?: string
  ) => {
    const supabase = crearClienteSupabase();
    const captura =
      capturaId != null
        ? capturas.find((c) => c.id === capturaId)
        : capturas[capturas.length - 1];

    const urlAnterior = captura?.url;

    try {
      const path = `${idPaso}/${crypto.randomUUID()}-anotado.png`;

      const { error: errUpload } = await supabase.storage
        .from("capturas")
        .upload(path, blob, { contentType: "image/png" });

      if (errUpload) {
        throw new Error(errUpload.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("capturas").getPublicUrl(path);

      if (capturaId) {
        const { error } = await supabase
          .from("capturas")
          .update({ url: publicUrl, anotaciones })
          .eq("id", capturaId);
        if (error) throw new Error(error.message);
      } else {
        const ultima = capturas[capturas.length - 1];
        if (ultima) {
          const { error } = await supabase
            .from("capturas")
            .update({ url: publicUrl, anotaciones })
            .eq("id", ultima.id);
          if (error) throw new Error(error.message);
        }
      }

      if (urlAnterior && urlAnterior !== publicUrl) {
        try {
          await eliminarArchivoPorUrl(supabase, urlAnterior);
        } catch {
          // ignorar fallo de limpieza
        }
      }

      setAnotandoUrl(null);
      setCapturaEditando(null);
      await onActualizar();
      toast({ title: "Captura guardada con anotaciones" });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors"
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Arrastra una imagen o pega desde el portapapeles (Ctrl+V)
        </p>
        <input
          ref={inputNuevaRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={subiendo}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) subirArchivo(f);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={subiendo}
          onClick={() => inputNuevaRef.current?.click()}
        >
          {subiendo ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Subiendo…
            </>
          ) : (
            <>
              <Clipboard className="h-4 w-4 mr-2" />
              Seleccionar archivo
            </>
          )}
        </Button>
      </div>

      {capturas.map((c) => {
        const ocupado = operandoId === c.id;
        return (
          <div key={c.id} className="border rounded-lg p-3 space-y-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.url}
                alt={c.pie_imagen ?? "Captura del paso"}
                className="max-h-48 w-full object-contain rounded bg-muted/30"
              />
              {ocupado && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={(el) => {
                  inputsReemplazoRef.current[c.id] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={ocupado || subiendo}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) reemplazarImagen(c, f);
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={ocupado || subiendo}
                onClick={() => inputsReemplazoRef.current[c.id]?.click()}
              >
                <ImagePlus className="h-4 w-4 mr-1" />
                Reemplazar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={ocupado || subiendo}
                onClick={() => {
                  setCapturaEditando(c);
                  setAnotandoUrl(c.url);
                }}
              >
                Anotar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={ocupado || subiendo}
                onClick={() => eliminarImagen(c)}
                aria-label="Eliminar imagen"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <Label htmlFor={`pie-${c.id}`} className="text-xs">
                Pie de imagen (opcional)
              </Label>
              <Input
                id={`pie-${c.id}`}
                className="mt-1"
                defaultValue={c.pie_imagen ?? ""}
                placeholder="Descripción breve de la captura…"
                onBlur={(e) => {
                  const valor = e.target.value.trim();
                  if (valor !== (c.pie_imagen ?? "")) {
                    actualizarPieImagen(c, valor);
                  }
                }}
              />
            </div>
          </div>
        );
      })}

      {anotandoUrl && (
        <LienzoAnotacionDynamic
          imagenUrl={anotandoUrl}
          anotacionesIniciales={capturaEditando?.anotaciones ?? []}
          onGuardar={(anotaciones, blob) =>
            guardarAnotacion(anotaciones, blob, capturaEditando?.id)
          }
          onCancelar={() => {
            setAnotandoUrl(null);
            setCapturaEditando(null);
          }}
        />
      )}
    </div>
  );
}
