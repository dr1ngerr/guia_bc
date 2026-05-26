"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TipoAlerta } from "@/lib/supabase/tipos";

export function EditorAlerta({
  tipo,
  texto,
  onChange,
}: {
  tipo: TipoAlerta | null;
  texto: string;
  onChange: (tipo: TipoAlerta | null, texto: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Tipo de alerta</Label>
        <Select
          value={tipo ?? "ninguna"}
          onValueChange={(v) =>
            onChange(
              v === "ninguna" ? null : (v as TipoAlerta),
              texto
            )
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ninguna">Ninguna</SelectItem>
            <SelectItem value="peligro">🔴 Crítico (peligro)</SelectItem>
            <SelectItem value="advertencia">⚡ Atención</SelectItem>
            <SelectItem value="consejo">✅ Consejo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {tipo && (
        <div>
          <Label>Texto de la alerta</Label>
          <Textarea
            className="mt-1"
            value={texto}
            onChange={(e) => onChange(tipo, e.target.value)}
            placeholder="Ej: Esta acción NO se puede deshacer…"
            rows={3}
          />
        </div>
      )}
    </div>
  );
}
