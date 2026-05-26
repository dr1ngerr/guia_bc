"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Search } from "lucide-react";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { TarjetaProceso } from "@/components/compartido/TarjetaProceso";
import { EsqueletoPanel } from "@/components/compartido/EsqueletoPanel";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePerfil } from "@/hooks/usePerfil";
import { calcularPorcentajeProgreso } from "@/lib/progreso";
import { HERRAMIENTAS, type Herramienta, type Proceso } from "@/lib/supabase/tipos";

type ProcesoConConteo = Proceso & {
  num_pasos: number;
  porcentajeProgreso?: number;
};

export default function PanelPage() {
  const { esAdmin, cargando: cargandoPerfil } = usePerfil();
  const [procesos, setProcesos] = useState<ProcesoConConteo[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [herramienta, setHerramienta] = useState<string>("todas");
  const [categoria, setCategoria] = useState<string>("todas");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setBusqueda(busquedaInput), 250);
    return () => clearTimeout(t);
  }, [busquedaInput]);

  useEffect(() => {
    if (cargandoPerfil) return;

    async function cargar() {
      setCargando(true);
      setError(null);
      const supabase = crearClienteSupabase();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let query = supabase
        .from("procesos")
        .select("*")
        .order("actualizado_en", { ascending: false });

      if (!esAdmin) {
        query = query.eq("estado", "publicado");
      }

      const { data: lista, error: errLista } = await query;

      if (errLista) {
        setError(errLista.message);
        setCargando(false);
        return;
      }

      const ids = (lista ?? []).map((p) => p.id);
      let conteos: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: pasos, error: errPasos } = await supabase
          .from("pasos")
          .select("id_proceso")
          .in("id_proceso", ids);

        if (errPasos) {
          setError(errPasos.message);
          setCargando(false);
          return;
        }

        conteos = (pasos ?? []).reduce(
          (acc, p) => {
            acc[p.id_proceso] = (acc[p.id_proceso] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

      }

      let progresoPorProceso: Record<string, number> = {};
      if (ids.length > 0 && user) {
        const { data: progresos } = await supabase
          .from("progreso_usuario")
          .select("id_proceso, pasos_completados, completado_en")
          .eq("id_usuario", user.id)
          .in("id_proceso", ids);

        progresoPorProceso = Object.fromEntries(
          (progresos ?? []).map((prog) => {
            const numPasos = conteos[prog.id_proceso] ?? 0;
            return [
              prog.id_proceso,
              calcularPorcentajeProgreso(
                numPasos,
                prog.pasos_completados ?? [],
                Boolean(prog.completado_en)
              ),
            ];
          })
        );
      }

      setProcesos(
        (lista ?? []).map((p) => ({
          ...p,
          num_pasos: conteos[p.id] ?? 0,
          porcentajeProgreso: progresoPorProceso[p.id],
        }))
      );

      const cats = Array.from(
        new Set(
          (lista ?? [])
            .map((p) => p.categoria)
            .filter((c): c is string => Boolean(c))
        )
      );
      setCategorias(cats);
      setCargando(false);
    }

    cargar();
  }, [esAdmin, cargandoPerfil]);

  const filtrados = useMemo(() => {
    return procesos.filter((p) => {
      const coincideBusqueda =
        !busqueda ||
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideHerramienta =
        herramienta === "todas" || p.herramienta === herramienta;
      const coincideCategoria =
        categoria === "todas" || p.categoria === categoria;
      return coincideBusqueda && coincideHerramienta && coincideCategoria;
    });
  }, [procesos, busqueda, herramienta, categoria]);

  const mostrarCargando = cargandoPerfil || cargando;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Panel de procesos</h1>
          <p className="text-muted-foreground">
            Guías paso a paso para cubrir vacaciones y bajas
          </p>
        </div>
        {esAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/proceso/importar">Importar apuntes</Link>
            </Button>
            <Button asChild>
              <Link href="/proceso/nuevo">Nuevo proceso</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar procesos…"
            className="pl-9"
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
            disabled={mostrarCargando}
          />
        </div>
        <Select value={herramienta} onValueChange={setHerramienta} disabled={mostrarCargando}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Herramienta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las herramientas</SelectItem>
            {HERRAMIENTAS.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoria} onValueChange={setCategoria} disabled={mostrarCargando}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div
          className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">No se pudieron cargar los procesos</p>
            <p className="mt-1 text-destructive/90">{error}</p>
            <p className="mt-2 text-muted-foreground">
              Comprueba la conexión en{" "}
              <Link href="/api/diagnostico" className="underline" target="_blank">
                /api/diagnostico
              </Link>
            </p>
          </div>
        </div>
      )}

      {mostrarCargando ? (
        <EsqueletoPanel />
      ) : filtrados.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            {procesos.length === 0
              ? esAdmin
                ? "Aún no hay procesos. Crea el primero o importa apuntes de tu compañera."
                : "No hay guías publicadas todavía. Tu administrador debe publicar procesos."
              : "No hay procesos que coincidan con los filtros."}
          </p>
          {esAdmin && procesos.length === 0 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button asChild>
                <Link href="/proceso/nuevo">Crear proceso</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/proceso/importar">Importar apuntes</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((p) => (
            <TarjetaProceso
              key={p.id}
              proceso={{
                id: p.id,
                nombre: p.nombre,
                icono: p.icono,
                herramienta: p.herramienta as Herramienta,
                categoria: p.categoria,
                duracion_minutos: p.duracion_minutos,
                actualizado_en: p.actualizado_en,
                numPasos: p.num_pasos,
                estado: p.estado,
                porcentajeProgreso: p.porcentajeProgreso,
              }}
              mostrarEstado={esAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
