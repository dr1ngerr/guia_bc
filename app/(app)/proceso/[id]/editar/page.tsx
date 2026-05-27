"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { useProceso } from "@/hooks/useProceso";
import { useEditorStore } from "@/lib/store/useEditorStore";
import { useGuardadoAutomatico } from "@/hooks/useGuardadoAutomatico";
import { usePerfil } from "@/hooks/usePerfil";
import { useCapturasPaso } from "@/hooks/useCapturasPaso";
import { ListaPasos } from "@/components/editor/ListaPasos";
import { EditorPaso } from "@/components/editor/EditorPaso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  eliminarPasoCompleto,
  guardarPasosEditor,
} from "@/lib/pasos/operaciones";

export default function EditarProcesoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { proceso, cargando } = useProceso(id);
  const { esAdmin, cargando: cargandoPerfil } = usePerfil();
  const { recargarCapturas } = useCapturasPaso();
  const [eliminandoPaso, setEliminandoPaso] = useState(false);

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
    eliminarPaso,
    agregarPaso,
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
    const { proceso: procesoActual, pasos: pasosActuales } =
      useEditorStore.getState();
    if (!procesoActual) return;
    const supabase = crearClienteSupabase();
    setGuardando(true);

    try {
      await guardarPasosEditor(supabase, procesoActual.id, pasosActuales);

      const { error: errProc } = await supabase
        .from("procesos")
        .update({
          nombre: procesoActual.nombre,
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", procesoActual.id);

      if (errProc) throw new Error(errProc.message);

      setSucio(false);
      setUltimoGuardado(new Date());
    } finally {
      setGuardando(false);
    }
  }, [setGuardando, setSucio, setUltimoGuardado]);

  useGuardadoAutomatico(guardarTodo);

  const publicar = async (estado: "borrador" | "publicado") => {
    try {
      await guardarTodo();
      const supabase = crearClienteSupabase();
      const { error } = await supabase
        .from("procesos")
        .update({ estado, actualizado_en: new Date().toISOString() })
        .eq("id", id);

      if (error) throw new Error(error.message);

      toast({
        title:
          estado === "publicado" ? "Proceso publicado" : "Guardado como borrador",
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

  const agregarPasoHandler = async () => {
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
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
      return;
    }

    agregarPaso({ ...data, capturas: [] });
    toast({ title: "Paso añadido" });
  };

  const eliminarPasoHandler = async (idPaso: string) => {
    if (pasos.length <= 1) {
      toast({
        title: "No se puede eliminar",
        description: "El proceso debe tener al menos un paso.",
        variant: "destructive",
      });
      return;
    }

    if (
      !window.confirm(
        "¿Eliminar este paso? También se borrarán sus capturas e imágenes."
      )
    ) {
      return;
    }

    setEliminandoPaso(true);
    const supabase = crearClienteSupabase();

    try {
      await eliminarPasoCompleto(supabase, idPaso);
      eliminarPaso(idPaso);
      toast({ title: "Paso eliminado" });
    } catch (e) {
      toast({
        title: "Error al eliminar",
        description: e instanceof Error ? e.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setEliminandoPaso(false);
    }
  };

  const recargarCapturasDelPasoSeleccionado = useCallback(async () => {
    const pasoId = useEditorStore.getState().pasoSeleccionadoId;
    if (!pasoId) return;
    try {
      await recargarCapturas(pasoId);
    } catch (e) {
      toast({
        title: "Error al actualizar capturas",
        description: e instanceof Error ? e.message : "Error desconocido",
        variant: "destructive",
      });
    }
  }, [recargarCapturas]);

  if (cargando || cargandoPerfil) {
    return <p className="p-8">Cargando editor…</p>;
  }

  if (!proceso) {
    return <p className="p-8 text-destructive">Proceso no encontrado</p>;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="border-b px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <Input
            className="font-semibold text-lg w-full max-w-[520px]"
            value={procesoEditor?.nombre ?? ""}
            onChange={(e) => {
              const nombreNuevo = e.target.value;
              if (!procesoEditor) return;
              setProceso({ ...procesoEditor, nombre: nombreNuevo });
              setSucio(true);
            }}
            aria-label="Título de la guía"
          />
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
          <Button
            variant="outline"
            size="sm"
            disabled={guardando}
            onClick={() =>
              guardarTodo().catch((e) =>
                toast({
                  title: "Error al guardar",
                  description:
                    e instanceof Error ? e.message : "Error desconocido",
                  variant: "destructive",
                })
              )
            }
          >
            Guardar ahora
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={guardando}
            onClick={() => publicar("borrador")}
          >
            Borrador
          </Button>
          <Button
            size="sm"
            disabled={guardando}
            onClick={() => publicar("publicado")}
          >
            Publicar
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/proceso/${id}`}>Vista guía</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="w-64 shrink-0 border-r p-3 overflow-hidden flex flex-col">
          <ListaPasos
            onAgregar={agregarPasoHandler}
            onReordenar={guardarTodo}
            onEliminar={eliminarPasoHandler}
            eliminando={eliminandoPaso}
          />
        </div>
        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          <EditorPaso onRecargarCapturas={recargarCapturasDelPasoSeleccionado} />
        </div>
      </div>
    </div>
  );
}
