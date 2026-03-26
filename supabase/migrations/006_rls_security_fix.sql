-- ============================================
-- 006: Security Fix — RLS Policies verschaerfen
-- ============================================

-- 1. freie_uploads: INSERT nur mit gueltigem portal_token
DROP POLICY IF EXISTS freie_uploads_portal_insert ON freie_uploads;
CREATE POLICY freie_uploads_portal_insert ON freie_uploads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM mandanten m
      JOIN checklisten c ON c.mandant_id = m.id
      WHERE m.id = freie_uploads.mandant_id
      AND c.portal_token IS NOT NULL
    )
  );

-- 2. dokument_dateien: INSERT nur wenn zugehoerige Checkliste einen portal_token hat
DROP POLICY IF EXISTS dateien_portal_insert ON dokument_dateien;
CREATE POLICY dateien_portal_insert ON dokument_dateien
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM dokumente d
      JOIN checklisten c ON c.id = d.checkliste_id
      WHERE d.id = dokument_dateien.dokument_id
      AND c.portal_token IS NOT NULL
    )
  );

-- 3. DELETE-Policies (fehlten komplett)
CREATE POLICY IF NOT EXISTS dokument_dateien_kanzlei_delete ON dokument_dateien
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM dokumente d
      JOIN checklisten c ON c.id = d.checkliste_id
      JOIN mandanten m ON m.id = c.mandant_id
      WHERE d.id = dokument_dateien.dokument_id
      AND m.kanzlei_id = auth_kanzlei_id()
    )
  );

CREATE POLICY IF NOT EXISTS freie_uploads_kanzlei_delete ON freie_uploads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM mandanten m
      WHERE m.id = freie_uploads.mandant_id
      AND m.kanzlei_id = auth_kanzlei_id()
    )
  );
