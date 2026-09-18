-- ============================================================
-- Consentimientos informados (Medicina Estética)
-- Guarda el documento firmado: texto (snapshot), firma del paciente
-- (imagen base64), nombre del firmante y fecha.
-- Idempotente. Correr en Supabase → SQL Editor.
--
-- NOTA: si ya existía una tabla consentimientos_estetica con esquema
-- mínimo, el CREATE la deja igual; los ALTER de abajo agregan las
-- columnas que falten. Seguro de correr varias veces.
-- ============================================================

create table if not exists public.consentimientos_estetica (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null,
  created_at timestamptz default now()
);

-- Columnas del documento firmado (se agregan si faltan)
alter table public.consentimientos_estetica
  add column if not exists tipo               text,
  add column if not exists titulo             text,
  add column if not exists texto              text,
  add column if not exists nombre_firmante    text,
  add column if not exists firma_paciente_b64 text,
  add column if not exists fecha              date default current_date;

-- Si la tabla previa tenía procedimiento_id NOT NULL, lo hacemos opcional
-- (el consentimiento se liga al paciente; ligar a un procedimiento es opcional).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='consentimientos_estetica'
      and column_name='procedimiento_id'
  ) then
    execute 'alter table public.consentimientos_estetica alter column procedimiento_id drop not null';
  end if;
end $$;

-- RLS abierto para anon + authenticated (la app usa anon key)
alter table public.consentimientos_estetica enable row level security;

drop policy if exists "consentimientos_all" on public.consentimientos_estetica;
create policy "consentimientos_all" on public.consentimientos_estetica
  for all to anon, authenticated
  using (true) with check (true);

-- Refresca el caché de esquema de PostgREST (por si acaso)
notify pgrst, 'reload schema';
