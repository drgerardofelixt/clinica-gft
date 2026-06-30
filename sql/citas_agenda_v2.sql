-- ============================================================
-- Agenda v2 — Tabla `citas` (Fase B)
-- Correr en: Supabase Dashboard → SQL Editor → New query → pegar todo → Run
-- ============================================================

-- (Opcional) Inspeccionar la política RLS de `pacientes` para replicarla idéntica aquí:
--   select tablename, policyname, cmd, roles, qual, with_check
--   from pg_policies where tablename in ('pacientes','configuracion');

create table if not exists citas (
  id                    uuid primary key default gen_random_uuid(),
  google_event_id       text,
  calendar_id           text,
  paciente_id           uuid,                       -- nullable: cita rápida sin expediente
  paciente_nombre       text not null,
  tipo                  text not null,              -- 'primera_vez' | 'seguimiento' | 'cita_rapida'
  medicamento           text,                       -- 'WEG' | 'MOUN' | null
  dosis                 text,
  numero_visita         int,
  inicio                timestamptz not null,
  fin                   timestamptz not null,
  estado                text not null default 'agendada',  -- 'agendada'|'confirmada'|'cancelada'|'completada'
  version               int not null default 1,
  ultima_modificacion   timestamptz not null default now(),
  origen_ultimo_cambio  text default 'app',         -- 'app' | 'gcal'
  titulo_generado       text,
  pendiente_sincronizar boolean default false,
  creado_en             timestamptz not null default now()
);

create index if not exists idx_citas_inicio   on citas(inicio);
create index if not exists idx_citas_paciente  on citas(paciente_id);
create index if not exists idx_citas_gcal      on citas(google_event_id);

-- Origen del medicamento: 'FARM' (farmacia) | 'CONS' (consultorio) | null. Sin constraint (lo controla la UI).
alter table citas add column if not exists origen text;

-- ── RLS ──────────────────────────────────────────────────────
-- Replica la MISMA política que tenga `pacientes`. Por defecto (app de un solo
-- doctor con login por Supabase Auth) se permite todo al rol authenticated.
-- Si `pacientes` usa otra política (p.ej. permite anon), ajústala aquí igual.
alter table citas enable row level security;

drop policy if exists "citas_authenticated_all" on citas;
create policy "citas_authenticated_all"
  on citas
  for all
  to authenticated
  using (true)
  with check (true);
