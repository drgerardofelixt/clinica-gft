-- ════════════════════════════════════════════════════════════════════════════════════
-- POLÍTICAS RLS PARA EL MÓDULO DE MEDICINA ESTÉTICA
-- ────────────────────────────────────────────────────────────────────────────────────
-- Problema: Supabase activa Row Level Security (RLS) por defecto en tablas nuevas.
-- Sin políticas, la app (anon key) NO puede leer ni escribir → catálogo vacío + errores.
-- Este script agrega una política permisiva (anon + authenticated) a cada tabla del
-- módulo, consistente con el modelo del resto de la app (acceso vía anon key + login).
-- Idempotente: se puede correr varias veces sin problema; salta tablas inexistentes.
--
-- CÓMO CORRERLO: Supabase → SQL Editor → pega TODO esto → Run.
-- ════════════════════════════════════════════════════════════════════════════════════

do $$
declare
  t text;
  tablas text[] := array[
    'categorias_producto', 'productos_esteticos', 'dosis_recomendadas_por_zona',
    'esquemas_dilucion', 'compatibilidad_productos', 'costo_por_paciente',
    'photo_analysis', 'audit_productos'
  ];
begin
  foreach t in array tablas loop
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security;', t);
      execute format('drop policy if exists %I on public.%I;', t || '_app_all', t);
      execute format(
        'create policy %I on public.%I for all to anon, authenticated using (true) with check (true);',
        t || '_app_all', t
      );
      raise notice 'Política aplicada a %', t;
    end if;
  end loop;
end $$;
