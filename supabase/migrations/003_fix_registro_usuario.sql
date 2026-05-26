-- =============================================================================
-- Corrige: "Database error saving new user" al registrarse
-- Ejecutar en Supabase → SQL Editor si el registro falla
-- =============================================================================

-- Permisos para que Auth (supabase_auth_admin) ejecute el trigger
grant usage on schema public to supabase_auth_admin;
grant insert, select, update on table public.perfiles to supabase_auth_admin;
grant select on table public.empresa to supabase_auth_admin;
grant select, update on table public.invitaciones to supabase_auth_admin;

grant execute on function public.manejar_nuevo_usuario() to supabase_auth_admin;
grant execute on function public.manejar_nuevo_usuario() to service_role;

-- Política: el usuario puede crear su propio perfil (respaldo)
drop policy if exists "perfiles_insert_propios" on public.perfiles;
create policy "perfiles_insert_propios" on public.perfiles
  for insert to authenticated
  with check (id = auth.uid());

-- Asegurar que existe una fila en empresa (el trigger la referencia)
insert into public.empresa (nombre)
select 'Mi Empresa'
where not exists (select 1 from public.empresa limit 1);

-- Función más robusta (no falla si no hay invitación)
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  empresa_id uuid;
  rol_asignado text := 'empleado';
begin
  select id into empresa_id from public.empresa limit 1;

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
    empresa_id
  )
  on conflict (id) do update set
    email = excluded.email,
    nombre = excluded.nombre,
    rol = excluded.rol,
    empresa_id = excluded.empresa_id;

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

-- Recrear trigger por si no existía
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();
