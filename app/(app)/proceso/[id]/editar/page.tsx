"use client";

import { useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { useProceso } from "@/hooks/useProceso";
import { useEditorStore } from "@/lib/store/useEditorStore";
import { useGuardadoAutomatico } from "@/hooks/useGuardadoAutomatico";
import { usePerfil } from "@/hooks/usePerfil";
import { ListaPasos } from "@/components/editor/ListaPasos";
import { EditorPaso } from "@/components/editor/EditorPaso";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
export default function EditarProcesoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { proceso, cargando, recargar } = useProceso(id);
  const { esAdmin, cargando: cargandoPerfil } = usePerfil();

  const {
    setProceso,
    setPasos,
    proceso: procesoEditor,
    pasos,
    guardando,
    ultimoGuardado,
    setGuardando,
    setSucio,
    setUltimoGuardado,
    reset,
  } = useEditorStore();

  useEffect(() => {
    if (!esAdmin && !cargandoPerfil) {
      router.replace(`/proceso/${id}`);
    }
  }, [esAdmin, cargandoPerfil, id, router]);

  useEffect(() => {
    if (proceso) {
      setProceso(proceso);
      setPasos(proceso.pasos);
      if (proceso.pasos[0]) {
        useEditorStore.getState().seleccionarPaso(proceso.pasos[0].id);
      }
    }
    return () => reset();
  }, [proceso, setProceso, setPasos, reset]);

  const guardarTodo = useCallback(async () => {
    if (!procesoEditor) return;
    const supabase = crearClienteSupabase();
    setGuardando(true);

    for (const paso of pasos) {
      const { error } = await supabase
        .from("pasos")
        .upsert({
          id: paso.id,
          id_proceso: procesoEditor.id,
          orden: paso.orden,
          titulo: paso.titulo,
          descripcion: paso.descripcion,
          tipo_alerta: paso.tipo_alerta,
          texto_alerta: paso.texto_alerta,
          texto_verificacion: paso.texto_verificacion,
          consejo: paso.consejo,
          url_video: paso.url_video,
        });

      if (error) throw new Error(error.message);
    }

    await supabase
      .from("procesos")
      .update({ actualizado_en: new Date().toISOString() })
      .eq("id", procesoEditor.id);

    setSucio(false);
    setUltimoGuardado(new Date());
    setGuardando(false);
  }, [procesoEditor, pasos, setGuardando, setSucio, setUltimoGuardado]);

  useGuardadoAutomatico(guardarTodo);

  const publicar = async (estado: "borrador" | "publicado") => {
    try {
      await guardarTodo();
      const supabase = crearClienteSupabase();
      await supabase
        .from("procesos")
        .update({ estado, actualizado_en: new Date().toISOString() })
        .eq("id", id);

      toast({
        title: estado === "publicado" ? "Proceso publicado" : "Guardado como borrador",
      });
      if (estado === "publicado") router.push(`/proceso/${id}`);
    } catch (e) {
      toast({
        title: "Error al guardar",
        description: e instanceof Error ? e.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const agregarPaso = async () => {
    const supabase = crearClienteSupabase();
    const orden = pasos.length;
    const { data, error } = await supabase
      .from("pasos")
      .insert({
        id_proceso: id,
        orden,
        titulo: `Paso ${orden + 1}`,
        descripcion: "",
      })
      .select()
      .single();

    if (error || !data) {
      toast({ title: "Error", description: error?.message, variant: "destructive" });
      return;
    }

    useEditorStore.getState().agregarPaso({ ...data, capturas: [] });
    recargar();
  };

  if (cargando || cargandoPerfil) {
    return <p className="p-8">Cargando editor…</p>;
  }

  if (!proceso) {
    return <p className="p-8 text-destructive">Proceso no encontrado</p>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <header className="border-b px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-semibold">{proceso.nombre}</h1>
          <p className="text-xs text-muted-foreground">
            {guardando
              ? "Guardando…"
              : ultimoGuardado
                ? `Último guardado: ${ultimoGuardado.toLocaleTimeString("es-ES")}`
                : "Sin guardar aún"}
            {" · "}
            Estado: {proceso.estado}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => guardarTodo()}>
            Guardar ahora
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => publicar("borrador")}
          >
            Borrador
          </Button>
          <Button size="sm" onClick={() => publicar("publicado")}>
            Publicar
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/proceso/${id}`}>Vista guía</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="w-64 shrink-0 border-r p-3 overflow-hidden flex flex-col">
          <ListaPasos onAgregar={agregarPaso} />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <EditorPaso onRecargarCapturas={recargar} />
        </div>
      </div>
    </div>
  );
}
