"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { EditorTextoEnriquecido } from "@/components/editor/EditorTextoEnriquecido";
import { EditorAlerta } from "@/components/editor/EditorAlerta";
import { SubidaCaptura } from "@/components/editor/SubidaCaptura";
import { useEditorStore } from "@/lib/store/useEditorStore";
import type { TipoAlerta } from "@/lib/supabase/tipos";

export function EditorPaso({ onRecargarCapturas }: { onRecargarCapturas: () => void }) {
  const paso = useEditorStore((s) => s.pasoSeleccionado());
  const actualizarPaso = useEditorStore((s) => s.actualizarPaso);

  if (!paso) {
    return (
      <p className="text-muted-foreground text-center py-12">
        Selecciona un paso o crea uno nuevo
      </p>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto p-4">
      <div>
        <Label htmlFor="titulo-paso">Título del paso</Label>
        <Input
          id="titulo-paso"
          className="mt-1 text-lg"
          value={paso.titulo}
          onChange={(e) =>
            actualizarPaso(paso.id, { titulo: e.target.value })
          }
          placeholder="Ej: Abrir el módulo de facturación"
        />
      </div>

      <div>
        <Label>Descripción</Label>
        <div className="mt-1">
          <EditorTextoEnriquecido
            contenido={paso.descripcion ?? ""}
            onChange={(html) =>
              actualizarPaso(paso.id, { descripcion: html })
            }
          />
        </div>
      </div>

      <div>
        <Label>Capturas de pantalla</Label>
        <div className="mt-1">
          <SubidaCaptura
            idPaso={paso.id}
            capturas={paso.capturas}
            onActualizar={onRecargarCapturas}
          />
        </div>
      </div>

      <EditorAlerta
        tipo={paso.tipo_alerta}
        texto={paso.texto_alerta ?? ""}
        onChange={(tipo, texto) =>
          actualizarPaso(paso.id, {
            tipo_alerta: tipo as TipoAlerta | null,
            texto_alerta: texto || null,
          })
        }
      />

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="verificacion-activa"
            checked={!!paso.texto_verificacion}
            onCheckedChange={(checked) =>
              actualizarPaso(paso.id, {
                texto_verificacion: checked
                  ? "He completado esta acción correctamente"
                  : null,
              })
            }
          />
          <Label htmlFor="verificacion-activa">
            Casilla de verificación obligatoria
          </Label>
        </div>
        {paso.texto_verificacion && (
          <Input
            value={paso.texto_verificacion}
            onChange={(e) =>
              actualizarPaso(paso.id, {
                texto_verificacion: e.target.value,
              })
            }
            placeholder="Texto de la casilla…"
          />
        )}
      </div>

      <div>
        <Label>Consejo adicional</Label>
        <Textarea
          className="mt-1"
          value={paso.consejo ?? ""}
          onChange={(e) =>
            actualizarPaso(paso.id, { consejo: e.target.value || null })
          }
          placeholder="Atajo, buena práctica…"
          rows={2}
        />
      </div>

      <div>
        <Label>URL de vídeo (opcional)</Label>
        <Input
          className="mt-1"
          value={paso.url_video ?? ""}
          onChange={(e) =>
            actualizarPaso(paso.id, { url_video: e.target.value || null })
          }
          placeholder="https://…"
        />
      </div>
    </div>
  );
}
