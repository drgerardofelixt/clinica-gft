-- ═══════════════════════════════════════════════════════════════════════════════
-- CITAS — columnas nuevas: área (obesidad/estética) y modalidad (presencial/en línea)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Seguras y aditivas: son columnas NULLABLE; la app actual no las usa, así que correr
-- esto NO afecta nada. Córrelo ANTES de que se despliegue el código nuevo que las usa.
-- (No se necesitan GRANT nuevos: la tabla citas ya tiene permisos; las columnas nuevas
--  quedan cubiertas por esos permisos y por las políticas RLS existentes.)
-- Córrelo en Supabase → SQL Editor → Run.
-- ═══════════════════════════════════════════════════════════════════════════════

alter table public.citas add column if not exists area      text; -- 'obesidad' | 'estetica'
alter table public.citas add column if not exists modalidad text; -- 'presencial' | 'linea'

-- Opcional: que las citas existentes se consideren de Obesidad y presenciales por defecto.
update public.citas set area = 'obesidad'        where area is null;
update public.citas set modalidad = 'presencial' where modalidad is null;
