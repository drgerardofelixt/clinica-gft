-- ─────────────────────────────────────────────────────────────────────────────
-- GRANTS PARA LA DATA API DE SUPABASE  (cambio del 30 de octubre de 2025)
-- ─────────────────────────────────────────────────────────────────────────────
-- Desde el 30-oct Supabase deja de otorgar acceso automático a la Data API en las
-- tablas NUEVAS del esquema public. Las tablas EXISTENTES no se ven afectadas; este
-- archivo solo es un seguro por si se recrea alguna tabla, se corre "db reset", o se
-- levanta un proyecto/preview nuevo después de esa fecha.
--
-- IMPORTANTE: esta app (clinica-gft) LEE y ESCRIBE con la llave `anon` (no usa login
-- de Supabase Auth). Por eso `anon` necesita CRUD completo, no solo SELECT como en la
-- plantilla genérica del correo de Supabase.
--
-- Es idempotente: se puede correr cuantas veces sea sin efecto secundario.
-- Al agregar una TABLA NUEVA en el futuro, añade su nombre a la lista de abajo.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  t text;
  tablas text[] := array[
    'borradores_procedimiento',
    'categorias_producto',
    'citas',
    'configuracion',
    'consentimientos_estetica',
    'consultas_iniciales_estetica',
    'estadisticas_mensuales',
    'historias_clinicas_estetica',
    'pacientes',
    'planes_tratamiento_estetico',
    'procedimientos_esteticos',
    'productos_esteticos'
  ];
begin
  foreach t in array tablas loop
    -- Solo intenta si la tabla existe (evita error si alguna aún no se ha creado).
    if to_regclass('public.'||t) is not null then
      execute format('grant select, insert, update, delete on public.%I to anon;', t);
      execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
      execute format('grant select, insert, update, delete on public.%I to service_role;', t);
    end if;
  end loop;
end $$;
