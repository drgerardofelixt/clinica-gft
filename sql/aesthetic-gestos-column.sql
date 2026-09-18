-- ============================================================
-- Fotos de gestos para valoración de arrugas (toxina botulínica)
-- Agrega la columna fotos_gestos (jsonb) a procedimientos_esteticos.
-- Guarda un objeto { gestoId: url } con las fotos por gesto.
-- Aditivo, idempotente, NO destructivo. Correr en Supabase → SQL Editor.
-- ============================================================

ALTER TABLE public.procedimientos_esteticos
  ADD COLUMN IF NOT EXISTS fotos_gestos jsonb DEFAULT '{}'::jsonb;
