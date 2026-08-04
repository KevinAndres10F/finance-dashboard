-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- !!  TEMPORAL — RIESGO: DATOS PÚBLICOS                      !!
-- !!                                                          !!
-- !!  Estas políticas dan acceso de SOLO LECTURA al rol anon. !!
-- !!  La anon key está expuesta en el bundle JS de Netlify,   !!
-- !!  por lo que CUALQUIERA que inspeccione el código fuente  !!
-- !!  puede leer estos datos.                                 !!
-- !!                                                          !!
-- !!  SIGUIENTE PASO OBLIGATORIO:                             !!
-- !!  1. Implementar Supabase Auth (email, magic-link, OAuth) !!
-- !!  2. Aplicar supabase/policies-authenticated.sql          !!
-- !!  3. ELIMINAR estas políticas anon con:                   !!
-- !!     DROP POLICY IF EXISTS "anon_..." ON <tabla>;         !!
-- !!                                                          !!
-- !!  NO hay escritura anon en NINGUNA tabla.                 !!
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

-- ── finanzas_personales_transacciones ────────────────────────
-- Necesaria para que el dashboard funcione sin login.
-- SOLO LECTURA. Sin INSERT, UPDATE ni DELETE para anon.
CREATE POLICY "anon_select_transacciones"
  ON finanzas_personales_transacciones FOR SELECT
  TO anon USING (true);

-- ── finanzas_personales_cuentas ─────────────────────────────
-- Necesaria para mostrar saldo_inicial en Balance por Cuenta.
-- SOLO LECTURA.
CREATE POLICY "anon_select_cuentas"
  ON finanzas_personales_cuentas FOR SELECT
  TO anon USING (true);

-- ── finanzas_personales_ejecuciones ─────────────────────────
-- Necesaria para el panel de salud del pipeline.
-- SOLO LECTURA. La escribe Apps Script con service_role.
CREATE POLICY "anon_select_ejecuciones"
  ON finanzas_personales_ejecuciones FOR SELECT
  TO anon USING (true);

-- ── finanzas_personales_email_log ───────────────────────────
-- Necesaria para el panel de salud del pipeline.
-- SOLO LECTURA. La escribe Apps Script con service_role.
CREATE POLICY "anon_select_email_log"
  ON finanzas_personales_email_log FOR SELECT
  TO anon USING (true);

-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- !! RECORDATORIO: Eliminar este archivo y sus políticas      !!
-- !! en cuanto Supabase Auth esté implementado.               !!
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
