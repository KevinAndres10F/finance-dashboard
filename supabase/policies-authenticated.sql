-- ============================================================
-- RLS Policies — TO authenticated
-- Objetivo final: todas las tablas accesibles solo para
-- usuarios autenticados via Supabase Auth.
-- ============================================================
-- PREREQUISITO: Implementar Supabase Auth (email/magic-link/OAuth)
-- y luego eliminar supabase/policies-anon-temporal.sql.
--
-- IMPORTANTE: NO hay políticas de DELETE en ninguna tabla.
-- El borrado lógico se hace con activo=false en transacciones;
-- para las demás tablas, eliminar registros debe hacerse
-- desde el panel de Supabase con service_role, no desde el frontend.
-- ============================================================

-- ── finanzas_personales_transacciones ────────────────────────
CREATE POLICY "auth_select_transacciones"
  ON finanzas_personales_transacciones FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auth_insert_transacciones"
  ON finanzas_personales_transacciones FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_transacciones"
  ON finanzas_personales_transacciones FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── finanzas_personales_cuentas ─────────────────────────────
CREATE POLICY "auth_select_cuentas"
  ON finanzas_personales_cuentas FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auth_insert_cuentas"
  ON finanzas_personales_cuentas FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_cuentas"
  ON finanzas_personales_cuentas FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── finanzas_personales_presupuestos ────────────────────────
CREATE POLICY "auth_select_presupuestos"
  ON finanzas_personales_presupuestos FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auth_insert_presupuestos"
  ON finanzas_personales_presupuestos FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_presupuestos"
  ON finanzas_personales_presupuestos FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── finanzas_personales_objetivos ───────────────────────────
CREATE POLICY "auth_select_objetivos"
  ON finanzas_personales_objetivos FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auth_insert_objetivos"
  ON finanzas_personales_objetivos FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_objetivos"
  ON finanzas_personales_objetivos FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── finanzas_personales_deudas ──────────────────────────────
CREATE POLICY "auth_select_deudas"
  ON finanzas_personales_deudas FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auth_insert_deudas"
  ON finanzas_personales_deudas FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_deudas"
  ON finanzas_personales_deudas FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── finanzas_personales_suscripciones ───────────────────────
CREATE POLICY "auth_select_suscripciones"
  ON finanzas_personales_suscripciones FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auth_insert_suscripciones"
  ON finanzas_personales_suscripciones FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_suscripciones"
  ON finanzas_personales_suscripciones FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── finanzas_personales_ajustes ─────────────────────────────
CREATE POLICY "auth_select_ajustes"
  ON finanzas_personales_ajustes FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auth_insert_ajustes"
  ON finanzas_personales_ajustes FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_ajustes"
  ON finanzas_personales_ajustes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── finanzas_personales_gamificacion ────────────────────────
CREATE POLICY "auth_select_gamificacion"
  ON finanzas_personales_gamificacion FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auth_insert_gamificacion"
  ON finanzas_personales_gamificacion FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_gamificacion"
  ON finanzas_personales_gamificacion FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── finanzas_personales_tx_meta ─────────────────────────────
CREATE POLICY "auth_select_tx_meta"
  ON finanzas_personales_tx_meta FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auth_insert_tx_meta"
  ON finanzas_personales_tx_meta FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_tx_meta"
  ON finanzas_personales_tx_meta FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── finanzas_personales_ejecuciones (solo lectura) ──────────
CREATE POLICY "auth_select_ejecuciones"
  ON finanzas_personales_ejecuciones FOR SELECT
  TO authenticated USING (true);

-- ── finanzas_personales_email_log (solo lectura) ────────────
CREATE POLICY "auth_select_email_log"
  ON finanzas_personales_email_log FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- NOTAS:
-- 1. Esta app es single-user. Cuando se implemente multi-tenancy,
--    cambiar USING(true) a USING(user_id = auth.uid()).
-- 2. _ejecuciones y _email_log solo necesitan SELECT porque las
--    escribe el Apps Script con la service_role key.
-- 3. NO hay DELETE en ninguna tabla. Borrado lógico (activo=false)
--    en transacciones; service_role para eliminación real.
-- 4. Si una política ya existe, usar DROP POLICY IF EXISTS antes.
-- ============================================================
