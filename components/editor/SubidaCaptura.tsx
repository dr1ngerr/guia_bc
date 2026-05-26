"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload, Clipboard } from "lucide-react";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { Button } from "@/components/ui/button";
import { LienzoAnotacionDynamic } from "@/components/editor/LienzoAnotacionDynamic";
import type { Anotacion, Captura } from "@/lib/supabase/tipos";
import { toast } from "@/hooks/use-toast";

export function SubidaCaptura({
  idPaso,
  capturas,
  onActualizar,
}: {
  idPaso: string;
  capturas: Captura[];
  onActualizar: () => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [anotandoUrl, setAnotandoUrl] = useState<string | null>(null);
  const [capturaEditando, setCapturaEditando] = useState<Captura | null>(null);

  const subirArchivo = useCallback(
    async (file: File) => {
      setSubiendo(true);
      const supabase = crearClienteSupabase();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${idPaso}/${crypto.randomUUID()}.${ext}`;

      const { error: errUpload } = await supabase.storage
        .from("capturas")
        .upload(path, file, { upsert: false });

      if (errUpload) {
        toast({
          title: "Error al subir",
          description: errUpload.message,
          variant: "destructive",
        });
        setSubiendo(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("capturas").getPublicUrl(path);

      const { error: errDb } = await supabase.from("capturas").insert({
        id_paso: idPaso,
        url: publicUrl,
        orden: capturas.length,
        anotaciones: [],
      });

      if (errDb) {
        toast({
          title: "Error",
          description: errDb.message,
          variant: "destructive",
        });
      } else {
        setAnotandoUrl(publicUrl);
        onActualizar();
      }
      setSubiendo(false);
    },
    [idPaso, capturas.length, onActualizar]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) subirArchivo(file);
  };

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
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
    const path = `${idPaso}/${crypto.randomUUID()}-anotado.png`;

    const { error: errUpload } = await supabase.storage
      .from("capturas")
      .upload(path, blob, { contentType: "image/png" });

    if (errUpload) {
      toast({ title: "Error", description: errUpload.message, variant: "destructive" });
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("capturas").getPublicUrl(path);

    if (capturaId) {
      await supabase
        .from("capturas")
        .update({ url: publicUrl, anotaciones })
        .eq("id", capturaId);
    } else {
      const ultima = capturas[capturas.length - 1];
      if (ultima) {
        await supabase
          .from("capturas")
          .update({ url: publicUrl, anotaciones })
          .eq("id", ultima.id);
      }
    }

    setAnotandoUrl(null);
    setCapturaEditando(null);
    onActualizar();
    toast({ title: "Captura guardada con anotaciones" });
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
        <label>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={subiendo}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subirArchivo(f);
            }}
          />
          <Button type="button" variant="secondary" disabled={subiendo} asChild>
            <span>
              <Clipboard className="h-4 w-4 mr-2 inline" />
              {subiendo ? "Subiendo…" : "Seleccionar archivo"}
            </span>
          </Button>
        </label>
      </div>

      {capturas.map((c) => (
        <div key={c.id} className="border rounded-lg p-3 space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.url} alt="" className="max-h-40 rounded" />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setCapturaEditando(c);
              setAnotandoUrl(c.url);
            }}
          >
            Anotar imagen
          </Button>
        </div>
      ))}

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
