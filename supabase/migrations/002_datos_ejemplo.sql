-- Datos de ejemplo (opcional). Ejecutar tras crear un usuario administrador.
-- Sustituye USER_ADMIN_UUID por el uuid de auth.users del administrador.

-- Ejemplo: promover primer usuario a administrador
-- update public.perfiles set rol = 'administrador' where email = 'admin@empresa.com';

-- Proceso de ejemplo (descomentar y ajustar creado_por)
/*
insert into public.procesos (
  nombre, descripcion, herramienta, icono, categoria,
  duracion_minutos, estado, creado_por
) values (
  'Facturación mensual',
  'Proceso completo de facturación recurrente en Business Central.',
  'Business Central',
  '🧾',
  'Facturación',
  45,
  'publicado',
  'USER_ADMIN_UUID'
) returning id;
*/
