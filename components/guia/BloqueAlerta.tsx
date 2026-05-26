import { AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import type { TipoAlerta } from "@/lib/supabase/tipos";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  TipoAlerta,
  {
    icono: typeof AlertTriangle;
    titulo: string;
    clases: string;
    iconoClase: string;
  }
> = {
  peligro: {
    icono: AlertTriangle,
    titulo: "CRÍTICO",
    clases:
      "bg-red-50 border-4 border-red-600 text-red-950 dark:bg-red-950/50 dark:border-red-500 dark:text-red-100",
    iconoClase: "text-red-600 dark:text-red-400",
  },
  advertencia: {
    icono: Zap,
    titulo: "ATENCIÓN",
    clases:
      "bg-amber-50 border-4 border-amber-500 text-amber-950 dark:bg-amber-950/50 dark:border-amber-400 dark:text-amber-100",
    iconoClase: "text-amber-600 dark:text-amber-400",
  },
  consejo: {
    icono: CheckCircle2,
    titulo: "CONSEJO",
    clases:
      "bg-green-50 border-4 border-green-600 text-green-950 dark:bg-green-950/50 dark:border-green-500 dark:text-green-100",
    iconoClase: "text-green-600 dark:text-green-400",
  },
};

export function BloqueAlerta({
  tipo,
  texto,
}: {
  tipo: TipoAlerta;
  texto: string;
}) {
  const cfg = CONFIG[tipo];
  const Icono = cfg.icono;

  return (
    <div
      role="alert"
      className={cn("rounded-lg p-5 flex gap-4", cfg.clases)}
    >
      <Icono className={cn("h-8 w-8 shrink-0 mt-0.5", cfg.iconoClase)} />
      <div>
        <p className="font-bold text-sm tracking-wide mb-1">{cfg.titulo}</p>
        <p className="text-base leading-relaxed font-medium">{texto}</p>
      </div>
    </div>
  );
}
