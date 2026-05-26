"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { usePerfil } from "@/hooks/usePerfil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type { RolUsuario } from "@/lib/supabase/tipos";
import { Trash2 } from "lucide-react";

export default function ConfiguracionPage() {
  const router = useRouter();
  const { esAdmin, cargando } = usePerfil();

  const [empresaNombre, setEmpresaNombre] = useState("");
  const [empresaLogo, setEmpresaLogo] = useState("");
  const [categorias, setCategorias] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [usuarios, setUsuarios] = useState<
    { id: string; email: string; nombre: string | null; rol: RolUsuario }[]
  >([]);
  const [invitaciones, setInvitaciones] = useState<
    { id: string; email: string; rol: RolUsuario }[]
  >([]);
  const [emailInvitar, setEmailInvitar] = useState("");
  const [rolInvitar, setRolInvitar] = useState<RolUsuario>("empleado");
  const [usuarioActualId, setUsuarioActualId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!cargando && !esAdmin) router.replace("/panel");
  }, [esAdmin, cargando, router]);

  const cargar = async () => {
    const supabase = crearClienteSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUsuarioActualId(user?.id ?? null);

    const { data: emp } = await supabase.from("empresa").select("*").limit(1).single();
    if (emp) {
      setEmpresaNombre(emp.nombre);
      setEmpresaLogo(emp.logo_url ?? "");
    }

    const { data: cats } = await supabase
      .from("categorias")
      .select("*")
      .order("orden");
    setCategorias(cats ?? []);

    const { data: perfs } = await supabase.from("perfiles").select("*");
    setUsuarios(perfs ?? []);

    const { data: invs } = await supabase.from("invitaciones").select("*");
    setInvitaciones(invs ?? []);
  };

  useEffect(() => {
    if (esAdmin) cargar();
  }, [esAdmin]);

  const guardarEmpresa = async () => {
    const supabase = crearClienteSupabase();
    const { data: emp } = await supabase.from("empresa").select("id").limit(1).single();
    if (!emp) return;

    await supabase
      .from("empresa")
      .update({ nombre: empresaNombre, logo_url: empresaLogo || null })
      .eq("id", emp.id);

    toast({ title: "Empresa actualizada" });
  };

  const agregarCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    const supabase = crearClienteSupabase();
    await supabase.from("categorias").insert({
      nombre: nuevaCategoria.trim(),
      orden: categorias.length + 1,
    });
    setNuevaCategoria("");
    cargar();
    toast({ title: "Categoría añadida" });
  };

  const eliminarCategoria = async (id: string) => {
    const supabase = crearClienteSupabase();
    await supabase.from("categorias").delete().eq("id", id);
    cargar();
  };

  const invitarUsuario = async () => {
    const supabase = crearClienteSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("invitaciones").insert({
      email: emailInvitar.trim().toLowerCase(),
      rol: rolInvitar,
      invitado_por: user?.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setEmailInvitar("");
    cargar();
    toast({
      title: "Invitación registrada",
      description: "El usuario recibirá el rol al registrarse con ese email.",
    });
  };

  const cambiarRol = async (id: string, rol: RolUsuario) => {
    const supabase = crearClienteSupabase();
    await supabase.from("perfiles").update({ rol }).eq("id", id);
    cargar();
    toast({ title: "Rol actualizado" });
  };

  const eliminarUsuario = async (id: string) => {
    if (!esAdmin) return;
    if (!id) return;
    if (usuarioActualId && id === usuarioActualId) {
      toast({
        title: "Acción no permitida",
        description: "No puedes eliminar tu propia cuenta desde aquí.",
        variant: "destructive",
      });
      return;
    }

    const ok = window.confirm(
      "¿Eliminar este usuario del sistema? Se eliminarán sus datos relacionados."
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(data.error ?? "Error al eliminar"));

      toast({ title: "Usuario eliminado" });
      cargar();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo eliminar",
        variant: "destructive",
      });
    }
  };

  if (cargando) return <p className="p-8">Cargando…</p>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
          <CardDescription>Nombre y logotipo mostrados en la aplicación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre de la empresa</Label>
            <Input
              className="mt-1"
              value={empresaNombre}
              onChange={(e) => setEmpresaNombre(e.target.value)}
            />
          </div>
          <div>
            <Label>URL del logotipo</Label>
            <Input
              className="mt-1"
              value={empresaLogo}
              onChange={(e) => setEmpresaLogo(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <Button onClick={guardarEmpresa}>Guardar empresa</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {categorias.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded border px-3 py-2"
              >
                <span>{c.nombre}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => eliminarCategoria(c.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              placeholder="Nueva categoría"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
            />
            <Button onClick={agregarCategoria}>Añadir</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>
            Invita por email; el rol se asigna al registrarse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="email@empresa.com"
              value={emailInvitar}
              onChange={(e) => setEmailInvitar(e.target.value)}
              className="flex-1"
            />
            <Select
              value={rolInvitar}
              onValueChange={(v) => setRolInvitar(v as RolUsuario)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empleado">Empleado</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={invitarUsuario}>Invitar</Button>
          </div>

          {invitaciones.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Invitaciones pendientes</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {invitaciones.map((i) => (
                  <li key={i.id}>
                    {i.email} — {i.rol}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className="space-y-2">
            {usuarios.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2"
              >
                <div>
                  <p className="font-medium">{u.nombre ?? u.email}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={u.rol}
                    onValueChange={(v) => cambiarRol(u.id, v as RolUsuario)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empleado">Empleado</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    disabled={usuarioActualId ? usuarioActualId === u.id : false}
                    onClick={() => eliminarUsuario(u.id)}
                    aria-label={`Eliminar usuario ${u.email}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
