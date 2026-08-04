-- ============================================================
-- RLS Policies for finanzas_personales_* tables
-- Apply manually after reviewing each policy.
-- All tables already have RLS ENABLED; these policies grant
-- access to the anon role used by the frontend.
-- ============================================================

-- finanzas_personales_transacciones: lectura y escritura completa para anon
ALTER POLICY "anon_select" ON finanzas_personales_transacciones USING (true);
-- If the policy doesn't exist yet, create it:
CREATE POLICY "anon_select" ON finanzas_personales_transacciones FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON finanzas_personales_transacciones FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON finanzas_personales_transacciones FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete" ON finanzas_personales_transacciones FOR DELETE TO anon USING (true);

-- finanzas_personales_cuentas: lectura y escritura para anon
CREATE POLICY "anon_select" ON finanzas_personales_cuentas FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON finanzas_personales_cuentas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON finanzas_personales_cuentas FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- finanzas_personales_presupuestos: lectura y escritura para gestionar presupuestos mensuales
CREATE POLICY "anon_select" ON finanzas_personales_presupuestos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON finanzas_personales_presupuestos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON finanzas_personales_presupuestos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete" ON finanzas_personales_presupuestos FOR DELETE TO anon USING (true);

-- finanzas_personales_objetivos: lectura y escritura para objetivos de ahorro
CREATE POLICY "anon_select" ON finanzas_personales_objetivos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON finanzas_personales_objetivos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON finanzas_personales_objetivos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete" ON finanzas_personales_objetivos FOR DELETE TO anon USING (true);

-- finanzas_personales_deudas: lectura y escritura para tracking de deudas
CREATE POLICY "anon_select" ON finanzas_personales_deudas FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON finanzas_personales_deudas FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON finanzas_personales_deudas FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete" ON finanzas_personales_deudas FOR DELETE TO anon USING (true);

-- finanzas_personales_suscripciones: lectura y escritura para suscripciones manuales
CREATE POLICY "anon_select" ON finanzas_personales_suscripciones FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON finanzas_personales_suscripciones FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON finanzas_personales_suscripciones FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete" ON finanzas_personales_suscripciones FOR DELETE TO anon USING (true);

-- finanzas_personales_ajustes: lectura y escritura para preferencias del usuario
CREATE POLICY "anon_select" ON finanzas_personales_ajustes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON finanzas_personales_ajustes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON finanzas_personales_ajustes FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- finanzas_personales_gamificacion: lectura y escritura para estado de gamificación
CREATE POLICY "anon_select" ON finanzas_personales_gamificacion FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON finanzas_personales_gamificacion FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON finanzas_personales_gamificacion FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- finanzas_personales_tx_meta: lectura y escritura para metadata de transacciones (tags, notas)
CREATE POLICY "anon_select" ON finanzas_personales_tx_meta FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON finanzas_personales_tx_meta FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update" ON finanzas_personales_tx_meta FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete" ON finanzas_personales_tx_meta FOR DELETE TO anon USING (true);

-- finanzas_personales_ejecuciones: solo lectura para el panel de salud del pipeline
CREATE POLICY "anon_select" ON finanzas_personales_ejecuciones FOR SELECT TO anon USING (true);

-- finanzas_personales_email_log: solo lectura para el panel de salud del pipeline
CREATE POLICY "anon_select" ON finanzas_personales_email_log FOR SELECT TO anon USING (true);

-- ============================================================
-- NOTAS:
-- 1. Esta app es single-user, por eso las políticas usan USING(true).
--    Si se agrega multi-tenancy, cambiar a USING(user_id = auth.uid()).
-- 2. Las tablas _ejecuciones y _email_log solo necesitan SELECT
--    porque las escribe el Apps Script con la service_role key.
-- 3. Si alguna política ya existe, el CREATE POLICY dará error;
--    usa CREATE OR REPLACE POLICY (Supabase ≥ pg15) o elimínala
--    primero con DROP POLICY IF EXISTS "nombre" ON tabla;
-- ============================================================
