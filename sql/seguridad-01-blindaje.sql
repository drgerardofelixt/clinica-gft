-- ═══════════════════════════════════════════════════════════════════════════════
-- SEGURIDAD · PASO 1 — BLINDAJE (cerrar el acceso público a la base)
-- ═══════════════════════════════════════════════════════════════════════════════
-- PROBLEMA (verificado): hoy cualquiera con la URL de la app puede leer/escribir TODA
-- la información (pacientes, citas, etc.) SIN iniciar sesión, porque las políticas RLS
-- están abiertas al rol `anon` (la llave anon viene en el código público de la app).
--
-- ESTE SCRIPT: en todas las tablas de la app activa RLS, borra las políticas abiertas,
-- y deja acceso SOLO a usuarios AUTENTICADOS (con sesión iniciada). Revoca además los
-- privilegios al rol anónimo. Tú (que entras con tu usuario) NO te ves afectado.
--
-- Es idempotente: puedes correrlo varias veces sin problema.
-- Córrelo en Supabase → SQL Editor → New query → pega todo → Run.
-- Después me avisas y verifico que la fuga quedó cerrada.
-- ═══════════════════════════════════════════════════════════════════════════════

do $$
declare
  p record;
  t text;
  tablas text[] := array[
    'pacientes',
    'citas',
    'configuracion',
    'borradores_procedimiento',
    'categorias_producto',
    'productos_esteticos',
    'consentimientos_estetica',
    'consultas_iniciales_estetica',
    'estadisticas_mensuales',
    'historias_clinicas_estetica',
    'planes_tratamiento_estetico',
    'procedimientos_esteticos'
  ];
begin
  foreach t in array tablas loop
    if to_regclass('public.'||t) is not null then
      -- 1) Activa RLS (sin políticas, por defecto NIEGA todo salvo lo que definamos).
      execute format('alter table public.%I enable row level security;', t);
      execute format('alter table public.%I force row level security;', t);

      -- 2) Borra TODAS las políticas existentes (incluidas las que abrían a `anon`).
      for p in
        select policyname from pg_policies where schemaname='public' and tablename=t
      loop
        execute format('drop policy %I on public.%I;', p.policyname, t);
      end loop;

      -- 3) Única política: solo usuarios con sesión iniciada (authenticated).
      execute format(
        'create policy %I on public.%I for all to authenticated using (true) with check (true);',
        t||'_auth_all', t);

      -- 4) Quita privilegios al público anónimo; conserva authenticated y service_role.
      execute format('revoke all on public.%I from anon;', t);
      execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
      execute format('grant select, insert, update, delete on public.%I to service_role;', t);
    end if;
  end loop;
end $$;

-- Comprobación rápida (opcional): debe listar cada tabla con rls_habilitado = true
-- select tablename, rowsecurity as rls_habilitado
--   from pg_tables where schemaname='public' order by tablename;
