-- ============================================================
-- Consentimientos informados (Medicina Estética)
-- Guarda el documento firmado: texto (snapshot), firma del paciente
-- (imagen base64), nombre del firmante y fecha.
-- Idempotente. Correr en Supabase → SQL Editor.
-- ============================================================

create table if not exists public.consentimientos_estetica (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null,
  tipo text not null,                 -- 'procedimiento' | 'fotografia'
  titulo text,
  texto text,                         -- snapshot del texto firmado
  nombre_firmante text,
  firma_paciente_b64 text,            -- firma del paciente (PNG base64)
  fecha date default current_date,
  created_at timestamptz default now()
);

-- RLS abierto para anon + authenticated (la app usa anon key)
alter table public.consentimientos_estetica enable row level security;

drop policy if exists "consentimientos_all" on public.consentimientos_estetica;
create policy "consentimientos_all" on public.consentimientos_estetica
  for all to anon, authenticated
  using (true) with check (true);
