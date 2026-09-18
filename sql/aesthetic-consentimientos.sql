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

-- RLS abierto para anon + authenticated (la app usa anon key)
alter table public.consentimientos_estetica enable row level security;

drop policy if exists "consentimientos_all" on public.consentimientos_estetica;
create policy "consentimientos_all" on public.consentimientos_estetica
  for all to anon, authenticated
  using (true) with check (true);

-- Refresca el caché de esquema de PostgREST (por si acaso)
notify pgrst, 'reload schema';
