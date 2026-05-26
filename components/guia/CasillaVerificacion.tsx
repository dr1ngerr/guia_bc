"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function CasillaVerificacion({
  texto,
  marcada,
  onChange,
}: {
  texto: string;
  marcada: boolean;
  onChange: (marcada: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 p-4 flex gap-3 items-start",
        marcada
          ? "border-green-500 bg-green-50 dark:bg-green-950/30"
          : "border-primary bg-primary/5"
      )}
    >
      <Checkbox
        id="verificacion-paso"
        checked={marcada}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <Label
        htmlFor="verificacion-paso"
        className="text-base font-medium leading-snug cursor-pointer"
      >
        {texto}
      </Label>
    </div>
  );
}
