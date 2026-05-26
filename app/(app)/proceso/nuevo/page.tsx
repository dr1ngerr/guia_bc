"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { usePerfil } from "@/hooks/usePerfil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HERRAMIENTAS,
  ICONOS_PROCESO,
  type Herramienta,
} from "@/lib/supabase/tipos";
import { toast } from "@/hooks/use-toast";

export default function NuevoProcesoPage() {
  const router = useRouter();
  const { esAdmin, cargando } = usePerfil();
  const [paso, setPaso] = useState(1);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>(
    []
  );
  const [herramienta, setHerramienta] = useState<Herramienta>("Business Central");
  const [icono, setIcono] = useState("📋");
  const [duracion, setDuracion] = useState(30);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!cargando && !esAdmin) router.replace("/panel");
  }, [esAdmin, cargando, router]);

  useEffect(() => {
    crearClienteSupabase()
      .from("categorias")
      .select("id, nombre")
      .order("orden")
      .then(({ data }) => setCategorias(data ?? []));
  }, []);

  const crear = async () => {
    setGuardando(true);
    const supabase = crearClienteSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({ title: "Debes iniciar sesión", variant: "destructive" });
      setGuardando(false);
      return;
    }

    const { data, error } = await supabase
      .from("procesos")
      .insert({
        nombre,
        descripcion,
        categoria: categoria || null,
        herramienta,
        icono,
        duracion_minutos: duracion,
        estado: "borrador",
        creado_por: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
      setGuardando(false);
      return;
    }

    await supabase.from("pasos").insert({
      id_proceso: data.id,
      orden: 0,
      titulo: "Primer paso",
      descripcion: "<p>Describe aquí la primera acción.</p>",
    });

    router.push(`/proceso/${data.id}/editar`);
  };

  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo proceso</CardTitle>
          <CardDescription>Paso {paso} de 3</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paso === 1 && (
            <>
              <div>
                <Label>Nombre del proceso</Label>
                <Input
                  className="mt-1"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Facturación mensual"
                  required
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  className="mt-1"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.nombre}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!nombre.trim()}
                onClick={() => setPaso(2)}
              >
                Siguiente
              </Button>
            </>
          )}

          {paso === 2 && (
            <>
              <div>
                <Label>Herramienta principal</Label>
                <Select
                  value={herramienta}
                  onValueChange={(v) => setHerramienta(v as Herramienta)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HERRAMIENTAS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Icono</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ICONOS_PROCESO.map((i) => (
                    <button
                      key={i}
                      type="button"
                      className={`text-2xl p-2 rounded border ${
                        icono === i ? "border-primary bg-primary/10" : ""
                      }`}
                      onClick={() => setIcono(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPaso(1)}>
                  Atrás
                </Button>
                <Button className="flex-1" onClick={() => setPaso(3)}>
                  Siguiente
                </Button>
              </div>
            </>
          )}

          {paso === 3 && (
            <>
              <div>
                <Label>Duración estimada (minutos)</Label>
                <Input
                  type="number"
                  min={1}
                  className="mt-1"
                  value={duracion}
                  onChange={(e) => setDuracion(parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPaso(2)}>
                  Atrás
                </Button>
                <Button
                  className="flex-1"
                  disabled={guardando}
                  onClick={crear}
                >
                  {guardando ? "Creando…" : "Crear y abrir editor"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
