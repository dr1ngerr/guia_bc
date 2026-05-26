"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { usePerfil } from "@/hooks/usePerfil";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VistaPreviaGuia } from "@/components/importador/VistaPreviaGuia";
import { ZonaSubidaArchivos } from "@/components/importador/ZonaSubidaArchivos";
import { CuadroApuntes } from "@/components/importador/CuadroApuntes";
import type { ResultadoGeneracion } from "@/lib/importador/tipos";
import {
  parsearRespuestaApi,
  prepararArchivosParaSubida,
} from "@/lib/importador/preparar-archivos-cliente";
import { toast } from "@/hooks/use-toast";

export default function ImportarApuntesPage() {
  const router = useRouter();
  const { esAdmin, cargando: cargandoPerfil } = usePerfil();
  const textoRef = useRef<HTMLTextAreaElement>(null);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [textoSuficiente, setTextoSuficiente] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoGeneracion | null>(null);
  const [iaGeminiActiva, setIaGeminiActiva] = useState<boolean | null>(null);

  const onArchivosChange = useCallback((files: File[]) => {
    setArchivos(files);
  }, []);

  useEffect(() => {
    if (!cargandoPerfil && !esAdmin) router.replace("/panel");
  }, [esAdmin, cargandoPerfil, router]);

  useEffect(() => {
    fetch("/api/diagnostico")
      .then((r) => r.json())
      .then((d) => setIaGeminiActiva(Boolean(d.iaGemini)))
      .catch(() => setIaGeminiActiva(null));
  }, []);

  const puedeGenerar = archivos.length > 0 || textoSuficiente;

  const generar = async () => {
    const apuntes = textoRef.current?.value ?? "";
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
      const descripcion =
        e instanceof Error ? e.message : "No se pudo generar";
      toast({
        title:
          descripcion.includes("cuota") ||
          descripcion.includes("GEMINI") ||
          descripcion.includes("Gemini")
            ? "Gemini no disponible"
            : "Error",
        description: descripcion,
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
          Sube capturas, PDF o Word. La IA usa{" "}
          <strong>Google Gemini</strong> (plan gratuito en AI Studio). Las imágenes
          se optimizan al subir (máx. ~3,5 MB).
        </p>
      </div>

      {iaGeminiActiva === false && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">Gemini no está configurado en producción</p>
          <p className="mt-1">
            Para analizar capturas con IA gratis, añade{" "}
            <code className="text-xs bg-amber-100 px-1 rounded">GEMINI_API_KEY</code>{" "}
            en Vercel (clave de{" "}
            <a
              href="https://aistudio.google.com/apikey"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Google AI Studio
            </a>
            ) y haz redeploy. Sin eso solo se extrae texto de PDF/Word.
          </p>
        </div>
      )}

      {!resultado ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Archivos e imágenes</CardTitle>
              <CardDescription>
                Ideal: capturas del proceso en Business Central, Excel o correo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ZonaSubidaArchivos
                archivos={archivos}
                onChange={onArchivosChange}
              />
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
              <CuadroApuntes
                textoRef={textoRef}
                onSuficienteChange={setTextoSuficiente}
                disabled={generando}
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
        </div>
      )}
    </div>
  );
}
