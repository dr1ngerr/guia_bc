import { Progress } from "@/components/ui/progress";

export function BarraProgreso({
  actual,
  total,
}: {
  actual: number;
  total: number;
}) {
  const porcentaje = total > 0 ? Math.round(((actual + 1) / total) * 100) : 0;

  return (
    <div className="space-y-1 no-imprimir">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          Paso {actual + 1} de {total}
        </span>
        <span>{porcentaje}%</span>
      </div>
      <Progress value={porcentaje} className="h-2" />
    </div>
  );
}
