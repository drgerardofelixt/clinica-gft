-- ============================================================
-- Fase 2 Medicina Estética — columnas adicionales
-- Aditivo, idempotente y NO destructivo: solo agrega columnas
-- que faltan; las existentes (esquema viejo) se conservan.
-- Seguro de correr varias veces.
-- ============================================================

-- ---------- procedimientos_esteticos (Formulario Fase 2) ----------
ALTER TABLE public.procedimientos_esteticos
  ADD COLUMN IF NOT EXISTS tipo_procedimiento        text,
  ADD COLUMN IF NOT EXISTS dosis_por_zona            jsonb   DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS productos_utilizados      jsonb   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gais_antes                integer,
  ADD COLUMN IF NOT EXISTS gais_despues              integer,
  ADD COLUMN IF NOT EXISTS foto_pre_url              text,
  ADD COLUMN IF NOT EXISTS foto_post_url             text,
  ADD COLUMN IF NOT EXISTS duracion_minutos          integer,
  ADD COLUMN IF NOT EXISTS anestesia                 text,
  ADD COLUMN IF NOT EXISTS tiempo_anestesia          integer,
  ADD COLUMN IF NOT EXISTS tecnicas                  jsonb   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS eritema                   text,
  ADD COLUMN IF NOT EXISTS edema                     text,
  ADD COLUMN IF NOT EXISTS equimosis                 text,
  ADD COLUMN IF NOT EXISTS dolor                     text,
  ADD COLUMN IF NOT EXISTS satisfaccion_paciente     integer,
  ADD COLUMN IF NOT EXISTS tiene_complicaciones      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS complicaciones_descripcion text,
  ADD COLUMN IF NOT EXISTS notas_pre                 text,
  ADD COLUMN IF NOT EXISTS notas_post                text,
  ADD COLUMN IF NOT EXISTS incidencias_durante       text,
  ADD COLUMN IF NOT EXISTS estado                    text    DEFAULT 'completado';

-- ---------- planes_tratamiento_estetico (SelectorPlanes) ----------
ALTER TABLE public.planes_tratamiento_estetico
  ADD COLUMN IF NOT EXISTS objetivo        text,
  ADD COLUMN IF NOT EXISTS duracion_total  text,
  ADD COLUMN IF NOT EXISTS costo_estimado  text,
  ADD COLUMN IF NOT EXISTS estado          text DEFAULT 'activo';

-- ============================================================
-- Verificación rápida (opcional): listar columnas resultantes
-- ============================================================
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN ('procedimientos_esteticos','planes_tratamiento_estetico')
-- ORDER BY table_name, ordinal_position;
