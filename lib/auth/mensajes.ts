import type { AuthError } from "@supabase/supabase-js";

export function mensajeErrorAuth(error: AuthError): string {
  const msg = error.message.toLowerCase();
  const code = error.code?.toLowerCase() ?? "";

  if (
    code === "email_not_confirmed" ||
    msg.includes("email not confirmed") ||
    msg.includes("email not verified")
  ) {
    return (
      "Tu cuenta existe pero el email no está confirmado. Revisa tu bandeja de entrada " +
      "(y spam), o pide a un administrador que confirme tu usuario en Supabase → Authentication → Users."
    );
  }

  if (code === "invalid_credentials" || msg.includes("invalid login")) {
    return (
      "Email o contraseña incorrectos. Si acabas de registrarte, confirma primero tu email " +
      "antes de iniciar sesión."
    );
  }

  if (msg.includes("user already registered")) {
    return "Este email ya está registrado. Prueba a iniciar sesión o recuperar contraseña.";
  }

  return error.message;
}
