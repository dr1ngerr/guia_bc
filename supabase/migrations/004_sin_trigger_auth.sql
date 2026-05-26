-- =============================================================================
-- Solución definitiva: quitar trigger en auth.users y crear perfil desde la app
-- Ejecutar en Supabase → SQL Editor (después de 001, o solo este si falla el registro)
-- =============================================================================

-- 1. Quitar trigger que provoca "Database error saving new user"
drop trigger if exists on_auth_user_created on auth.users;

-- 2. Asegurar tabla empresa
insert into public.empresa (nombre)
select 'Mi Empresa'
where not exists (select 1 from public.empresa limit 1);

-- 3. Políticas para que el usuario cree su propio perfil tras registrarse
drop policy if exists "perfiles_insert_propios" on public.perfiles;
create policy "perfiles_insert_propios" on public.perfiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "perfiles_select" on public.perfiles;
create policy "perfiles_select" on public.perfiles
  for select to authenticated using (true);

drop policy if exists "perfiles_update_own" on public.perfiles;
create policy "perfiles_update_own" on public.perfiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 4. Función RPC para crear perfil (por si RLS falla en el cliente)
create or replace function public.crear_perfil_si_falta(
  p_nombre text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_empresa uuid;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  if exists (select 1 from public.perfiles where id = v_uid) then
    return;
  end if;

  select email into v_email from auth.users where id = v_uid;
  select id into v_empresa from public.empresa limit 1;

  insert into public.perfiles (id, email, nombre, rol, empresa_id)
  values (
    v_uid,
    coalesce(v_email, ''),
    coalesce(p_nombre, split_part(coalesce(v_email, 'usuario'), '@', 1)),
    'empleado',
    v_empresa
  );
end;
$$;

grant execute on function public.crear_perfil_si_falta(text) to authenticated;
