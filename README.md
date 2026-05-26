# Asistente de Guías de Procesos Internos

Aplicación full stack para documentar y ejecutar procesos administrativos paso a paso (Business Central, Excel, etc.).

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, Storage)
- TipTap, Konva.js, Zustand, dnd-kit

## Configuración inicial

### 1. Variables de entorno

Copia `.env.example` a `.env.local` y completa las claves de tu proyecto Supabase:

```bash
cp .env.example .env.local
```

### 2. Base de datos Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** → **New query**
3. Ejecuta el contenido de `supabase/migrations/001_schema_completo.sql`
4. (Opcional) Datos de ejemplo en `002_datos_ejemplo.sql`

### 3. Autenticación

En Supabase → **Authentication** → **Providers**, activa **Email** y desactiva confirmación de email si quieres desarrollo rápido.

### Error al registrarse: "Database error saving new user"

1. Abre **http://localhost:3000/api/diagnostico** — debe mostrar `"conectado": true`.
2. En Supabase → **SQL Editor**, ejecuta **`supabase/migrations/004_sin_trigger_auth.sql`**.
3. Borra usuarios fallidos en **Authentication → Users**.
4. En **Authentication → Providers → Email**, desactiva **Confirm email** (desarrollo).
5. Comprueba en `.env.local` que tengas la clave correcta (ver abajo).

**Clave API:** en Dashboard → Settings → API puedes usar:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (empieza por `eyJ…`) — la más compatible, o
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`)

### 4. Primer administrador

Tras registrarte en `/registro`, ejecuta en SQL Editor:

```sql
update public.perfiles set rol = 'administrador' where email = 'tu@email.com';
```

### 5. Instalar y ejecutar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Despliegue en Vercel (producción)

### 1. Subir el código a GitHub

```bash
git add .
git commit -m "App lista para producción"
git remote add origin https://github.com/TU_USUARIO/guia-bc.git
git push -u origin master
```

(Si aún no tienes repo, créalo en GitHub primero.)

### 2. Importar en Vercel

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → importa el repo.
2. Framework: **Next.js** (detectado automáticamente).
3. **Environment Variables** (mismas que en `.env.local`):

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wfqmjudujyhkwjewmxrg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave **anon** de Supabase → Settings → API |

4. **Deploy**.

### 3. Configurar Supabase para la URL de producción

Cuando Vercel te dé la URL (ej. `https://guia-bc.vercel.app`):

1. **Authentication** → **URL Configuration**:
   - **Site URL**: `https://tu-proyecto.vercel.app`
   - **Redirect URLs**: añade `https://tu-proyecto.vercel.app/**`
2. **Authentication** → **Providers** → **Email**:
   - Para equipo interno: puedes dejar **Confirm email** desactivado.
   - Si lo activas, cada compañero debe confirmar su correo.

### 4. Dar acceso a tu compañero

**Solo seguir guías (empleado):**

1. Comparte la URL de Vercel.
2. Tu compañero va a `/registro`, crea cuenta.
3. En Supabase **Table Editor** → `perfiles` verifica que tenga `rol = empleado` (por defecto).
4. Tú publicas procesos; él los ve en `/panel`.

**Crear y editar procesos (administrador):**

Tras registrarse, en SQL Editor:

```sql
update public.perfiles set rol = 'administrador' where email = 'compañero@empresa.com';
```

O invítalo desde **Configuración** en la app (solo si ya eres admin).

### 5. Comprobar producción

- Abre `https://tu-proyecto.vercel.app/api/diagnostico` → `"conectado": true`
- Login con tu usuario admin → crear y **publicar** un proceso de prueba
- Tu compañero entra y lo ve en el panel

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/panel` | Listado de procesos |
| `/proceso/[id]` | Vista de guía (ejecución) |
| `/proceso/[id]/editar` | Editor (solo admin) |
| `/proceso/nuevo` | Asistente de creación |
| `/configuracion` | Empresa, categorías, usuarios |

## Estructura

Ver especificación del proyecto en la documentación interna del repositorio.
