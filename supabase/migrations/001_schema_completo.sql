-- =============================================================================
-- Asistente de Guías de Procesos Internos — Esquema completo
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- =============================================================================

-- Extensiones
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Empresa (configuración única)
-- -----------------------------------------------------------------------------
create table if not exists public.empresa (
  id uuid primary key default gen_random_uuid(),
  nombre text not null default 'Mi Empresa',
  logo_url text,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

insert into public.empresa (nombre)
select 'Mi Empresa'
where not exists (select 1 from public.empresa limit 1);

-- -----------------------------------------------------------------------------
-- Perfiles de usuario (vinculado a auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.perfiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  nombre text,
  rol text not null default 'empleado' check (rol in ('empleado', 'administrador')),
  empresa_id uuid references public.empresa (id) on delete set null,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- Categorías de procesos
-- -----------------------------------------------------------------------------
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int default 0,
  creado_en timestamptz default now()
);

insert into public.categorias (nombre, orden) values
  ('Facturación', 1),
  ('Compras', 2),
  ('Recursos humanos', 3),
  ('Contabilidad', 4),
  ('General', 5)
on conflict (nombre) do nothing;

-- -----------------------------------------------------------------------------
-- Procesos
-- -----------------------------------------------------------------------------
create table if not exists public.procesos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  herramienta text not null check (
    herramienta in (
      'Business Central',
      'Google Sheets',
      'Excel',
      'Web',
      'Email',
      'Otra'
    )
  ),
  icono text default '📋',
  categoria text,
  duracion_minutos int,
  estado text not null default 'borrador' check (estado in ('borrador', 'publicado')),
  creado_por uuid references auth.users,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

create index if not exists idx_procesos_estado on public.procesos (estado);
create index if not exists idx_procesos_categoria on public.procesos (categoria);
create index if not exists idx_procesos_herramienta on public.procesos (herramienta);

-- -----------------------------------------------------------------------------
-- Pasos
-- -----------------------------------------------------------------------------
create table if not exists public.pasos (
  id uuid primary key default gen_random_uuid(),
  id_proceso uuid not null references public.procesos on delete cascade,
  orden int not null,
  titulo text not null,
  descripcion text,
  tipo_alerta text check (tipo_alerta in ('peligro', 'advertencia', 'consejo')),
  texto_alerta text,
  texto_verificacion text,
  consejo text,
  url_video text,
  creado_en timestamptz default now(),
  unique (id_proceso, orden)
);

create index if not exists idx_pasos_proceso on public.pasos (id_proceso, orden);

-- -----------------------------------------------------------------------------
-- Capturas
-- -----------------------------------------------------------------------------
create table if not exists public.capturas (
  id uuid primary key default gen_random_uuid(),
  id_paso uuid not null references public.pasos on delete cascade,
  url text not null,
  pie_imagen text,
  orden int default 0,
  anotaciones jsonb default '[]'::jsonb,
  creado_en timestamptz default now()
);

create index if not exists idx_capturas_paso on public.capturas (id_paso, orden);

-- -----------------------------------------------------------------------------
-- Progreso del usuario al ejecutar una guía
-- -----------------------------------------------------------------------------
create table if not exists public.progreso_usuario (
  id uuid primary key default gen_random_uuid(),
  id_usuario uuid not null references auth.users on delete cascade,
  id_proceso uuid not null references public.procesos on delete cascade,
  paso_actual int default 0,
  pasos_completados int[] default '{}',
  verificaciones_marcadas uuid[] default '{}',
  iniciado_en timestamptz default now(),
  completado_en timestamptz,
  unique (id_usuario, id_proceso)
);

-- -----------------------------------------------------------------------------
-- Invitaciones pendientes (configuración)
-- -----------------------------------------------------------------------------
create table if not exists public.invitaciones (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  rol text not null default 'empleado' check (rol in ('empleado', 'administrador')),
  invitado_por uuid references auth.users,
  aceptada boolean default false,
  creado_en timestamptz default now(),
  unique (email)
);

-- -----------------------------------------------------------------------------
-- Funciones auxiliares
-- -----------------------------------------------------------------------------
create or replace function public.es_administrador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'administrador'
  );
$$;

create or replace function public.actualizar_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists trg_procesos_actualizado on public.procesos;
create trigger trg_procesos_actualizado
  before update on public.procesos
  for each row execute function public.actualizar_timestamp();

drop trigger if exists trg_empresa_actualizado on public.empresa;
create trigger trg_empresa_actualizado
  before update on public.empresa
  for each row execute function public.actualizar_timestamp();

drop trigger if exists trg_perfiles_actualizado on public.perfiles;
create trigger trg_perfiles_actualizado
  before update on public.perfiles
  for each row execute function public.actualizar_timestamp();

-- Crear perfil automáticamente al registrarse
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  empresa uuid;
  rol_asignado text := 'empleado';
begin
  select id into empresa from public.empresa limit 1;

  select coalesce(i.rol, 'empleado') into rol_asignado
  from public.invitaciones i
  where lower(i.email) = lower(new.email)
  limit 1;

  insert into public.perfiles (id, email, nombre, rol, empresa_id)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'nombre', split_part(coalesce(new.email, 'usuario'), '@', 1)),
    rol_asignado,
    empresa
  )
  on conflict (id) do nothing;

  begin
    update public.invitaciones
    set aceptada = true
    where lower(email) = lower(new.email);
  exception when others then
    null;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

-- Permisos para registro (evita "Database error saving new user")
grant usage on schema public to supabase_auth_admin;
grant insert, select, update on table public.perfiles to supabase_auth_admin;
grant select on table public.empresa to supabase_auth_admin;
grant select, update on table public.invitaciones to supabase_auth_admin;
grant execute on function public.manejar_nuevo_usuario() to supabase_auth_admin;
grant execute on function public.manejar_nuevo_usuario() to service_role;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.empresa enable row level security;
alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.procesos enable row level security;
alter table public.pasos enable row level security;
alter table public.capturas enable row level security;
alter table public.progreso_usuario enable row level security;
alter table public.invitaciones enable row level security;

-- Empresa: lectura para autenticados, escritura solo admin
drop policy if exists "empresa_select" on public.empresa;
create policy "empresa_select" on public.empresa
  for select to authenticated using (true);

drop policy if exists "empresa_update_admin" on public.empresa;
create policy "empresa_update_admin" on public.empresa
  for update to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());

-- Perfiles
drop policy if exists "perfiles_select" on public.perfiles;
create policy "perfiles_select" on public.perfiles
  for select to authenticated using (true);

drop policy if exists "perfiles_update_own" on public.perfiles;
create policy "perfiles_update_own" on public.perfiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "perfiles_update_admin" on public.perfiles;
create policy "perfiles_update_admin" on public.perfiles
  for update to authenticated
  using (public.es_administrador());

drop policy if exists "perfiles_insert_propios" on public.perfiles;
create policy "perfiles_insert_propios" on public.perfiles
  for insert to authenticated
  with check (id = auth.uid());

-- Categorías
drop policy if exists "categorias_select" on public.categorias;
create policy "categorias_select" on public.categorias
  for select to authenticated using (true);

drop policy if exists "categorias_admin" on public.categorias;
create policy "categorias_admin" on public.categorias
  for all to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());

-- Procesos: publicados para todos; borradores solo admin; CRUD admin
drop policy if exists "procesos_select_publicados" on public.procesos;
create policy "procesos_select_publicados" on public.procesos
  for select to authenticated
  using (estado = 'publicado' or public.es_administrador());

drop policy if exists "procesos_insert_admin" on public.procesos;
create policy "procesos_insert_admin" on public.procesos
  for insert to authenticated
  with check (public.es_administrador());

drop policy if exists "procesos_update_admin" on public.procesos;
create policy "procesos_update_admin" on public.procesos
  for update to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());

drop policy if exists "procesos_delete_admin" on public.procesos;
create policy "procesos_delete_admin" on public.procesos
  for delete to authenticated
  using (public.es_administrador());

-- Pasos (heredan visibilidad del proceso)
drop policy if exists "pasos_select" on public.pasos;
create policy "pasos_select" on public.pasos
  for select to authenticated
  using (
    exists (
      select 1 from public.procesos p
      where p.id = pasos.id_proceso
        and (p.estado = 'publicado' or public.es_administrador())
    )
  );

drop policy if exists "pasos_admin" on public.pasos;
create policy "pasos_admin" on public.pasos
  for all to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());

-- Capturas
drop policy if exists "capturas_select" on public.capturas;
create policy "capturas_select" on public.capturas
  for select to authenticated
  using (
    exists (
      select 1 from public.pasos s
      join public.procesos p on p.id = s.id_proceso
      where s.id = capturas.id_paso
        and (p.estado = 'publicado' or public.es_administrador())
    )
  );

drop policy if exists "capturas_admin" on public.capturas;
create policy "capturas_admin" on public.capturas
  for all to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());

-- Progreso: solo el propio usuario
drop policy if exists "progreso_select_own" on public.progreso_usuario;
create policy "progreso_select_own" on public.progreso_usuario
  for select to authenticated
  using (id_usuario = auth.uid());

drop policy if exists "progreso_insert_own" on public.progreso_usuario;
create policy "progreso_insert_own" on public.progreso_usuario
  for insert to authenticated
  with check (id_usuario = auth.uid());

drop policy if exists "progreso_update_own" on public.progreso_usuario;
create policy "progreso_update_own" on public.progreso_usuario
  for update to authenticated
  using (id_usuario = auth.uid())
  with check (id_usuario = auth.uid());

drop policy if exists "progreso_delete_own" on public.progreso_usuario;
create policy "progreso_delete_own" on public.progreso_usuario
  for delete to authenticated
  using (id_usuario = auth.uid());

-- Invitaciones: solo admin
drop policy if exists "invitaciones_admin" on public.invitaciones;
create policy "invitaciones_admin" on public.invitaciones
  for all to authenticated
  using (public.es_administrador())
  with check (public.es_administrador());

-- -----------------------------------------------------------------------------
-- Storage: bucket capturas
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'capturas',
  'capturas',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "capturas_storage_select" on storage.objects;
create policy "capturas_storage_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'capturas');

drop policy if exists "capturas_storage_insert" on storage.objects;
create policy "capturas_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'capturas' and public.es_administrador());

drop policy if exists "capturas_storage_update" on storage.objects;
create policy "capturas_storage_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'capturas' and public.es_administrador());

drop policy if exists "capturas_storage_delete" on storage.objects;
create policy "capturas_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'capturas' and public.es_administrador());

-- Lectura pública de capturas (bucket público para visor de guías)
drop policy if exists "capturas_storage_public_read" on storage.objects;
create policy "capturas_storage_public_read" on storage.objects
  for select to anon
  using (bucket_id = 'capturas');
