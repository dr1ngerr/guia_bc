import { Badge } from "@/components/ui/badge";
import type { Herramienta } from "@/lib/supabase/tipos";
import { cn } from "@/lib/utils";

const COLORES: Record<Herramienta, string> = {
  "Business Central": "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  "Google Sheets": "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  Excel: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  Web: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  Email: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Otra: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function EtiquetaHerramienta({
  herramienta,
  className,
}: {
  herramienta: Herramienta;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border-0 font-normal", COLORES[herramienta], className)}
    >
      {herramienta}
    </Badge>
  );
}
