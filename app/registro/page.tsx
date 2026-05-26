"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { asegurarPerfil } from "@/lib/supabase/perfil";
import { mensajeErrorAuth } from "@/lib/auth/mensajes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const registrarse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setMensaje(null);

    const supabase = crearClienteSupabase();

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
        emailRedirectTo: `${window.location.origin}/login?registrado=1`,
      },
    });

    if (err) {
      let texto = mensajeErrorAuth(err);
      if (err.message.includes("Database error saving new user")) {
        texto =
          "Error en la base de datos. Ejecuta supabase/migrations/004_sin_trigger_auth.sql en Supabase SQL Editor.";
      }
      setError(texto);
      setCargando(false);
      return;
    }

    // Sesión activa = email sin confirmación obligatoria
    if (data.session) {
      const { ok, error: perfilErr } = await asegurarPerfil(supabase, nombre);
      if (!ok) {
        setError(
          perfilErr ??
            "Cuenta creada pero falló el perfil. Ejecuta 004_sin_trigger_auth.sql en Supabase."
        );
        setCargando(false);
        return;
      }
      router.push("/panel");
      router.refresh();
      return;
    }

    // Sin sesión = hay que confirmar el email antes de poder entrar
    setMensaje(null);
    setError(null);
    setMensaje(
      "Cuenta creada en Auth, pero debes confirmar tu email antes de iniciar sesión. " +
        "Revisa tu bandeja (y spam). El perfil se creará automáticamente al entrar."
    );
    setCargando(false);
    setTimeout(() => router.push("/login?registrado=1"), 4000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>
            Registro para empleados de la empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={registrarse} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setMostrarPassword((v) => !v)}
                  aria-label={
                    mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && (
              <div className="text-sm text-destructive space-y-2" role="alert">
                <p>{error}</p>
              </div>
            )}
            {mensaje && (
              <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-3">
                {mensaje}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? "Creando…" : "Registrarse"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            Desarrollo: en Supabase → Authentication → Providers → Email, desactiva
            &quot;Confirm email&quot; para entrar sin confirmar.
          </p>
          <p className="text-center text-sm mt-4">
            <Link href="/login" className="text-primary underline">
              Ya tengo cuenta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
