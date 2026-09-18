-- ============================================================
-- Borradores de procedimiento (auto-guardado + hand-off al iPad)
-- Un borrador por paciente (paciente_id como PK). La computadora
-- auto-guarda; el iPad lo reanuda para que el paciente solo firme.
-- Idempotente. Correr en Supabase → SQL Editor.
-- ============================================================

create table if not exists public.borradores_procedimiento (
  paciente_id uuid primary key,
  data        jsonb,
  updated_at  timestamptz default now()
);

alter table public.borradores_procedimiento enable row level security;

drop policy if exists "borradores_all" on public.borradores_procedimiento;
create policy "borradores_all" on public.borradores_procedimiento
  for all to anon, authenticated
  using (true) with check (true);
