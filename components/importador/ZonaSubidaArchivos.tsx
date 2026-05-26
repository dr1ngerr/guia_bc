"use client";

import { useCallback, useRef, useState } from "react";
import { FileImage, FileText, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACEPTADOS =
  ".png,.jpg,.jpeg,.webp,.gif,.pdf,.docx,.txt,.md,.csv,image/*,application/pdf";

export function ZonaSubidaArchivos({
  archivos,
  onChange,
}: {
  archivos: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const agregar = useCallback(
    (nuevos: FileList | File[]) => {
      const lista = Array.from(nuevos);
      const combinados = [...archivos];
      for (const f of lista) {
        if (!combinados.some((a) => a.name === f.name && a.size === f.size)) {
          combinados.push(f);
        }
      }
      onChange(combinados);
    },
    [archivos, onChange]
  );

  const quitar = (indice: number) => {
    onChange(archivos.filter((_, i) => i !== indice));
  };

  const icono = (f: File) => {
    if (f.type.startsWith("image/")) return FileImage;
    return FileText;
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          if (e.dataTransfer.files.length) agregar(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          arrastrando
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium">Arrastra imágenes o documentos aquí</p>
        <p className="text-sm text-muted-foreground mt-1">
          PNG, JPG, PDF, Word (.docx), texto — varias capturas a la vez
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          La IA leerá las capturas de pantalla y extraerá los pasos automáticamente
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACEPTADOS}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) agregar(e.target.files);
          e.target.value = "";
        }}
      />

      {archivos.length > 0 && (
        <ul className="space-y-2">
          {archivos.map((f, i) => {
            const Icono = icono(f);
            const esImagen = f.type.startsWith("image/");
            return (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
              >
                {esImagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    className="h-12 w-12 object-cover rounded shrink-0"
                  />
                ) : (
                  <Icono className="h-8 w-8 text-muted-foreground shrink-0" />
                )}
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(f.size / 1024).toFixed(0)} KB
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    quitar(i);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
