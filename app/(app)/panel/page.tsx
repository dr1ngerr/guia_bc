"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { TarjetaProceso } from "@/components/compartido/TarjetaProceso";
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
import { HERRAMIENTAS, type Herramienta, type Proceso } from "@/lib/supabase/tipos";

type ProcesoConConteo = Proceso & { num_pasos: number };

export default function PanelPage() {
  const { esAdmin } = usePerfil();
  const [procesos, setProcesos] = useState<ProcesoConConteo[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [herramienta, setHerramienta] = useState<string>("todas");
  const [categoria, setCategoria] = useState<string>("todas");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const supabase = crearClienteSupabase();

      let query = supabase
        .from("procesos")
        .select("*")
        .order("actualizado_en", { ascending: false });

      if (!esAdmin) {
        query = query.eq("estado", "publicado");
      }

      const { data: lista } = await query;

      const ids = (lista ?? []).map((p) => p.id);
      let conteos: Record<string, number> = {};

      if (ids.length > 0) {
        const { data: pasos } = await supabase
          .from("pasos")
          .select("id_proceso")
          .in("id_proceso", ids);

        conteos = (pasos ?? []).reduce(
          (acc, p) => {
            acc[p.id_proceso] = (acc[p.id_proceso] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
      }

      setProcesos(
        (lista ?? []).map((p) => ({
          ...p,
          num_pasos: conteos[p.id] ?? 0,
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
  }, [esAdmin]);

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
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Select value={herramienta} onValueChange={setHerramienta}>
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
        <Select value={categoria} onValueChange={setCategoria}>
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

      {cargando ? (
        <p className="text-muted-foreground">Cargando procesos…</p>
      ) : filtrados.length === 0 ? (
        <p className="text-muted-foreground">
          No hay procesos que coincidan con los filtros.
        </p>
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
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
