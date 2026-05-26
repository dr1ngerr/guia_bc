import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatearFecha } from "@/lib/utils";

export function PantallaCompletado({
  nombreProceso,
  pasosCompletados,
  totalPasos,
  completadoEn,
}: {
  nombreProceso: string;
  pasosCompletados: number;
  totalPasos: number;
  completadoEn: Date;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto space-y-6">
      <CheckCircle2 className="h-20 w-20 text-green-600" />
      <h1 className="text-2xl font-bold">¡Proceso completado!</h1>
      <p className="text-muted-foreground">
        Has finalizado <strong>{nombreProceso}</strong> correctamente.
      </p>
      <div className="rounded-lg border bg-card p-4 w-full text-left space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Pasos completados:</span>{" "}
          {pasosCompletados} / {totalPasos}
        </p>
        <p>
          <span className="text-muted-foreground">Finalizado:</span>{" "}
          {formatearFecha(completadoEn)}{" "}
          {completadoEn.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/panel">Volver al panel</Link>
        </Button>
      </div>
    </div>
  );
}
