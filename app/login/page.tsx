"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { asegurarPerfil } from "@/lib/supabase/perfil";
import { mensajeErrorAuth } from "@/lib/auth/mensajes";
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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/panel";
  const registrado = searchParams.get("registrado") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(
    registrado
      ? "Si acabas de registrarte, confirma tu email antes de iniciar sesión (revisa spam)."
      : null
  );
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setAviso(null);

    const supabase = crearClienteSupabase();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (err) {
      setError(mensajeErrorAuth(err));
      setCargando(false);
      return;
    }

    const { ok, error: perfilErr } = await asegurarPerfil(supabase);
    if (!ok && perfilErr) {
      setError(
        `Sesión iniciada, pero el perfil no se creó: ${perfilErr}. Ejecuta 004_sin_trigger_auth.sql en Supabase.`
      );
      setCargando(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <BookOpen className="h-10 w-10 mx-auto text-primary mb-2" />
          <CardTitle>Guías de Procesos</CardTitle>
          <CardDescription>
            Accede con tu cuenta corporativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={iniciarSesion} className="space-y-4">
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="tu@empresa.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
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
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {aviso && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
                {aviso}
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 p-3" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? "Entrando…" : "Iniciar sesión"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            ¿Primera vez?{" "}
            <Link href="/registro" className="text-primary underline">
              Crear cuenta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
