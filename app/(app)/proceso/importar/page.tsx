"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { usePerfil } from "@/hooks/usePerfil";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VistaPreviaGuia } from "@/components/importador/VistaPreviaGuia";
import { ZonaSubidaArchivos } from "@/components/importador/ZonaSubidaArchivos";
import type { ResultadoGeneracion } from "@/lib/importador/tipos";
import {
  parsearRespuestaApi,
  prepararArchivosParaSubida,
} from "@/lib/importador/preparar-archivos-cliente";
import { toast } from "@/hooks/use-toast";

export default function ImportarApuntesPage() {
  const router = useRouter();
  const { esAdmin, cargando: cargandoPerfil } = usePerfil();
  const [apuntes, setApuntes] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoGeneracion | null>(null);

  useEffect(() => {
    if (!cargandoPerfil && !esAdmin) router.replace("/panel");
  }, [esAdmin, cargandoPerfil, router]);

  const puedeGenerar =
    archivos.length > 0 || apuntes.trim().length >= 15;

  const generar = async () => {
    setGenerando(true);
    setResultado(null);
    try {
      const { archivos: listos, avisos: avisosPrep } =
        await prepararArchivosParaSubida(archivos);

      if (avisosPrep.length > 0) {
        toast({
          title: "Imágenes optimizadas",
          description: avisosPrep.slice(0, 2).join(" · "),
        });
      }

      const formData = new FormData();
      formData.append("apuntes", apuntes);
      formData.append("usarIA", "true");
      listos.forEach((f) => formData.append("archivos", f));

      const res = await fetch("/api/proceso/importar/generar", {
        method: "POST",
        body: formData,
      });
      const data = await parsearRespuestaApi(res);
      if (!res.ok) throw new Error(String(data.error ?? "Error al generar"));

      setResultado(data as unknown as ResultadoGeneracion);
      toast({
        title: "Borrador generado con IA",
        description:
          data.metodo === "ia-vision"
            ? "Capturas y documentos analizados."
            : "Texto procesado.",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo generar",
        variant: "destructive",
      });
    } finally {
      setGenerando(false);
    }
  };

  const crearGuia = async () => {
    if (!resultado?.guia) return;
    setGuardando(true);
    try {
      const res = await fetch("/api/proceso/importar/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guia: resultado.guia }),
      });
      const data = await parsearRespuestaApi(res);
      if (!res.ok) throw new Error(String(data.error ?? "Error al crear"));
      toast({ title: "Guía creada como borrador" });
      router.push(`/proceso/${String(data.id)}/editar`);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo guardar",
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  if (cargandoPerfil) {
    return <p className="p-8 text-muted-foreground">Cargando…</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/panel">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Panel
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          Importar con IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Sube capturas de pantalla, PDF o Word de los apuntes de tu compañera. La
          IA los convierte en una guía profesional con pasos, alertas y
          verificaciones. Las imágenes se optimizan automáticamente (máx. ~3,5 MB
          en total). Después añades capturas finales en el editor.
        </p>
      </div>

      {!resultado ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Archivos e imágenes</CardTitle>
              <CardDescription>
                Ideal: capturas del proceso en Business Central, Excel o correo.
                También PDF y documentos Word.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ZonaSubidaArchivos archivos={archivos} onChange={setArchivos} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Texto adicional (opcional)</CardTitle>
              <CardDescription>
                Email, notas sueltas o contexto que no esté en las imágenes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Ej: Este proceso es mensual. Contacto dudas: María ext. 234"
                className="min-h-[100px] text-sm"
                value={apuntes}
                onChange={(e) => setApuntes(e.target.value)}
              />
              <Button
                className="w-full sm:w-auto"
                size="lg"
                disabled={generando || !puedeGenerar}
                onClick={generar}
              >
                {generando
                  ? "Analizando con IA (puede tardar 1-2 min)…"
                  : "Generar guía con IA"}
              </Button>
              {!puedeGenerar && (
                <p className="text-xs text-muted-foreground">
                  Sube al menos un archivo o escribe 15+ caracteres de texto.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {resultado.avisos.length > 0 && (
            <ul className="text-sm bg-amber-50 border border-amber-200 rounded-md p-4 space-y-1 text-amber-950">
              {resultado.avisos.map((a, i) => (
                <li key={i}>• {a}</li>
              ))}
            </ul>
          )}

          <VistaPreviaGuia guia={resultado.guia} />

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={crearGuia} disabled={guardando}>
              {guardando ? "Creando…" : "Crear guía y abrir editor"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setResultado(null)}
              disabled={guardando}
            >
              Volver a importar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            En el editor podrás subir capturas definitivas con anotaciones. Los
            vídeos no se importan automáticamente (próximamente).
          </p>
        </div>
      )}
    </div>
  );
}
