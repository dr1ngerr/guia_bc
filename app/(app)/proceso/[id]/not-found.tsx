import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProcesoNoEncontrado() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
      <h1 className="text-xl font-semibold">Guía no encontrada</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Este proceso no existe o no tienes permiso para verlo. Si eres empleado,
        solo aparecen guías publicadas.
      </p>
      <Button asChild className="mt-6">
        <Link href="/panel">Volver al panel</Link>
      </Button>
    </div>
  );
}
