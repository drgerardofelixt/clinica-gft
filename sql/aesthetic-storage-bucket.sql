-- ============================================================
-- Storage: bucket para fotos de Medicina Estética
-- Crea el bucket 'clinica-gft-storage' (público) + policies de
-- lectura/subida/actualización para anon y authenticated.
-- Idempotente: seguro de correr varias veces.
-- Correr en Supabase → SQL Editor.
-- ============================================================

-- 1) Crear el bucket público (o marcarlo público si ya existía)
insert into storage.buckets (id, name, public)
values ('clinica-gft-storage', 'clinica-gft-storage', true)
on conflict (id) do update set public = true;

-- 2) Policies sobre storage.objects acotadas a este bucket
--    (la app usa la anon key; sin auth login, por eso se incluye 'anon')

-- Lectura / listar
drop policy if exists "cgs_select" on storage.objects;
create policy "cgs_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'clinica-gft-storage');

-- Subir (INSERT)
drop policy if exists "cgs_insert" on storage.objects;
create policy "cgs_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'clinica-gft-storage');

-- Sobrescribir (UPDATE — el upload usa upsert: true)
drop policy if exists "cgs_update" on storage.objects;
create policy "cgs_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'clinica-gft-storage')
  with check (bucket_id = 'clinica-gft-storage');
