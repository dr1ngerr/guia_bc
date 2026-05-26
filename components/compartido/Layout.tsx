"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LogOut,
  Settings,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { crearClienteSupabase } from "@/lib/supabase/cliente";
import { usePerfil } from "@/hooks/usePerfil";
import { cn } from "@/lib/utils";

export function LayoutApp({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { perfil, esAdmin } = usePerfil();

  const cerrarSesion = async () => {
    const supabase = crearClienteSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const enGuia = pathname.startsWith("/proceso/") && !pathname.includes("/editar");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="no-imprimir border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/panel" className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Guías de Procesos</span>
          </Link>
          <nav className="flex items-center gap-2">
            {esAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/proceso/importar">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Importar apuntes
                </Link>
              </Button>
            )}
            {esAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/proceso/nuevo">
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo
                </Link>
              </Button>
            )}
            {esAdmin && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={cn(pathname === "/configuracion" && "bg-accent")}
              >
                <Link href="/configuracion" aria-label="Configuración">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {perfil && (
              <span className="hidden sm:inline text-sm text-muted-foreground px-2">
                {perfil.nombre ?? perfil.email}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={cerrarSesion} aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className={cn("flex-1", enGuia && "flex flex-col")}>{children}</main>
    </div>
  );
}
