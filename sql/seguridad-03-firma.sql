-- ═══════════════════════════════════════════════════════════════════════════════
-- SEGURIDAD · PASO 3 — Ocultar la FIRMA del médico a la asistente
-- ═══════════════════════════════════════════════════════════════════════════════
-- La firma digital se guarda en configuracion (clave = 'firma_digital'). La asistente
-- necesita leer OTRAS configuraciones (p. ej. calendario), pero NO la firma. Ajustamos
-- la política de lectura para que la fila de la firma sea visible SOLO para el admin.
-- Idempotente. Córrelo en Supabase → SQL Editor → Run.
-- ═══════════════════════════════════════════════════════════════════════════════

drop policy if exists configuracion_read on public.configuracion;
create policy configuracion_read on public.configuracion for select to authenticated
  using (
    public.app_rol() = 'admin'        -- el admin ve toda la configuración
    or clave <> 'firma_digital'       -- los demás ven todo MENOS la firma
  );

-- La política de escritura (solo admin) ya existe de seguridad-02-roles.sql; no se toca.

-- Comprobación (opcional): como asistente, un select de configuracion NO debe devolver
-- la fila 'firma_digital'.
