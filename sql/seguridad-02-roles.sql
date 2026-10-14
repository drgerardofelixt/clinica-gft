-- ═══════════════════════════════════════════════════════════════════════════════
-- SEGURIDAD · PASO 2 — ROLES (admin / asistente) + permisos finos
-- ═══════════════════════════════════════════════════════════════════════════════
-- Requiere haber corrido antes seguridad-01-blindaje.sql.
-- Crea la tabla de perfiles, marca al doctor como 'admin' y a la asistente como
-- 'asistente', y reemplaza las políticas para que la asistente SOLO pueda:
--   • citas: ver, agendar, modificar y cancelar (sin borrado permanente)
--   • pacientes: registrar nuevos (NO puede leer el expediente clínico)
--   • configuración: solo lectura
--   • órdenes de labs: se generan como documento (no tocan la base)
-- Todo lo clínico/estético/estadístico queda SOLO para el admin.
--
-- La asistente ve nombre/teléfono por una VISTA que NO expone datos clínicos.
-- Idempotente. Córrelo en Supabase → SQL Editor → Run.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Tabla de perfiles (user_id → rol)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.perfiles (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  rol       text not null default 'asistente' check (rol in ('admin','asistente')),
  nombre    text,
  creado_en timestamptz default now()
);
alter table public.perfiles enable row level security;
alter table public.perfiles force row level security;

-- Función que devuelve el rol del usuario actual (SECURITY DEFINER: evita recursión de RLS).
create or replace function public.app_rol()
returns text language sql stable security definer set search_path = public as $$
  select rol from public.perfiles where user_id = auth.uid();
$$;
revoke all on function public.app_rol() from public, anon;
grant execute on function public.app_rol() to authenticated;

-- Políticas de perfiles: cada quien lee el suyo; el admin lee y administra todos.
drop policy if exists perfiles_self_read  on public.perfiles;
drop policy if exists perfiles_admin_write on public.perfiles;
create policy perfiles_self_read  on public.perfiles for select to authenticated
  using (user_id = auth.uid() or public.app_rol() = 'admin');
create policy perfiles_admin_write on public.perfiles for all to authenticated
  using (public.app_rol() = 'admin') with check (public.app_rol() = 'admin');

revoke all on public.perfiles from anon;
grant select on public.perfiles to authenticated;
grant all    on public.perfiles to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) SEMILLA: asistente = la cuenta creada; cualquier otro usuario = admin (tú).
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.perfiles (user_id, rol, nombre)
select id, 'asistente', 'Asistente (agenda y labs)'
  from auth.users where email = 'asistente@drgerardofelix.local'
on conflict (user_id) do update set rol = 'asistente';

insert into public.perfiles (user_id, rol, nombre)
select id, 'admin', coalesce(raw_user_meta_data->>'full_name','Dr. Gerardo Félix Tapia')
  from auth.users where email is distinct from 'asistente@drgerardofelix.local'
on conflict (user_id) do update set rol = 'admin';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Vista de directorio: SOLO contacto (sin datos_clinicos). La asistente lee de aquí.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.pacientes_directorio as
  select id, nombre, telefono, sexo from public.pacientes;
revoke all on public.pacientes_directorio from anon;
grant select on public.pacientes_directorio to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) Políticas por rol en cada tabla (reemplazan la política abierta del Paso 1)
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: para las tablas SOLO-ADMIN borramos su política del paso 1 y ponemos admin.
do $$
declare
  t text;
  solo_admin text[] := array[
    'borradores_procedimiento','categorias_producto','productos_esteticos',
    'consentimientos_estetica','consultas_iniciales_estetica','estadisticas_mensuales',
    'historias_clinicas_estetica','planes_tratamiento_estetico','procedimientos_esteticos'
  ];
begin
  foreach t in array solo_admin loop
    if to_regclass('public.'||t) is not null then
      execute format('drop policy if exists %I on public.%I;', t||'_auth_all', t);
      execute format('drop policy if exists %I on public.%I;', t||'_admin_all', t);
      execute format(
        'create policy %I on public.%I for all to authenticated using (public.app_rol()=''admin'') with check (public.app_rol()=''admin'');',
        t||'_admin_all', t);
    end if;
  end loop;
end $$;

-- CITAS — admin: todo. asistente: ver / agendar / modificar / cancelar (sin DELETE).
drop policy if exists citas_auth_all        on public.citas;
drop policy if exists citas_admin_all       on public.citas;
drop policy if exists citas_asist_select     on public.citas;
drop policy if exists citas_asist_insert     on public.citas;
drop policy if exists citas_asist_update     on public.citas;
create policy citas_admin_all    on public.citas for all    to authenticated
  using (public.app_rol()='admin') with check (public.app_rol()='admin');
create policy citas_asist_select on public.citas for select to authenticated
  using (public.app_rol()='asistente');
create policy citas_asist_insert on public.citas for insert to authenticated
  with check (public.app_rol()='asistente');
create policy citas_asist_update on public.citas for update to authenticated
  using (public.app_rol()='asistente') with check (public.app_rol()='asistente');

-- PACIENTES — admin: todo. asistente: SOLO insertar (alta 1ª vez). No lee el expediente.
drop policy if exists pacientes_auth_all     on public.pacientes;
drop policy if exists pacientes_admin_all    on public.pacientes;
drop policy if exists pacientes_asist_insert on public.pacientes;
create policy pacientes_admin_all    on public.pacientes for all    to authenticated
  using (public.app_rol()='admin') with check (public.app_rol()='admin');
create policy pacientes_asist_insert on public.pacientes for insert to authenticated
  with check (public.app_rol()='asistente');

-- CONFIGURACIÓN — lectura para todos los autenticados; escritura solo admin.
drop policy if exists configuracion_auth_all   on public.configuracion;
drop policy if exists configuracion_admin_all  on public.configuracion;
drop policy if exists configuracion_read        on public.configuracion;
drop policy if exists configuracion_admin_write on public.configuracion;
create policy configuracion_read        on public.configuracion for select to authenticated
  using (true);
create policy configuracion_admin_write on public.configuracion for all to authenticated
  using (public.app_rol()='admin') with check (public.app_rol()='admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- Comprobación (opcional): ver los roles asignados
--   select p.rol, u.email from public.perfiles p join auth.users u on u.id=p.user_id;
-- ═══════════════════════════════════════════════════════════════════════════════
