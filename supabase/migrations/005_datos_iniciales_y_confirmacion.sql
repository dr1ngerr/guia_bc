-- =============================================================================
-- Datos iniciales + confirmar usuario manualmente (desarrollo)
-- =============================================================================

-- Fila en empresa (el diagnóstico puede mostrar 0 por RLS sin sesión; esto la crea)
insert into public.empresa (nombre)
select 'Mi Empresa'
where not exists (select 1 from public.empresa limit 1);

-- Confirmar un usuario por email (CAMBIA el email y ejecuta):
-- update auth.users
-- set email_confirmed_at = coalesce(email_confirmed_at, now()),
--     confirmed_at = coalesce(confirmed_at, now())
-- where email = 'tu@email.com';

-- Crear perfil manualmente si ya existe en Auth pero no en perfiles:
-- insert into public.perfiles (id, email, nombre, rol, empresa_id)
-- select u.id, u.email, split_part(u.email, '@', 1), 'empleado', (select id from public.empresa limit 1)
-- from auth.users u
-- where u.email = 'tu@email.com'
-- on conflict (id) do nothing;
