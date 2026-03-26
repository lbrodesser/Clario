-- RLS aktivieren
ALTER TABLE kanzleien ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandanten ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitarbeiter ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklisten ENABLE ROW LEVEL SECURITY;
ALTER TABLE dokumente ENABLE ROW LEVEL SECURITY;
ALTER TABLE dokument_dateien ENABLE ROW LEVEL SECURITY;
ALTER TABLE formular_fragen ENABLE ROW LEVEL SECURITY;
ALTER TABLE formular_antworten ENABLE ROW LEVEL SECURITY;
ALTER TABLE freie_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE erinnerungen_log ENABLE ROW LEVEL SECURITY;

-- Helper: Kanzlei-ID des eingeloggten Users
CREATE OR REPLACE FUNCTION auth_kanzlei_id()
RETURNS uuid AS $$
  SELECT k.id FROM kanzleien k
  JOIN auth.users u ON u.email = k.email
  WHERE u.id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Kanzlei: nur eigene Zeile
CREATE POLICY kanzlei_own ON kanzleien
  FOR ALL USING (id = auth_kanzlei_id());

-- Kanzlei: INSERT bei Registrierung (eigene E-Mail)
CREATE POLICY kanzlei_insert_own ON kanzleien
  FOR INSERT WITH CHECK (email = auth.jwt()->>'email');

-- Kanzlei: Portal-Lesen (fuer Mandanten-Portal Header)
CREATE POLICY kanzlei_portal_read ON kanzleien
  FOR SELECT USING (
    id IN (
      SELECT m.kanzlei_id FROM mandanten m
      JOIN checklisten c ON c.mandant_id = m.id
      WHERE c.portal_token IS NOT NULL
    )
  );

-- Mandanten: nur eigene Kanzlei
CREATE POLICY mandanten_own ON mandanten
  FOR ALL USING (kanzlei_id = auth_kanzlei_id());

-- Mandanten: Portal-Lesen (fuer Portal-Seite)
CREATE POLICY mandanten_portal_read ON mandanten
  FOR SELECT USING (
    id IN (SELECT mandant_id FROM checklisten WHERE portal_token IS NOT NULL)
  );

-- Mitarbeiter: ueber Mandant
CREATE POLICY mitarbeiter_own ON mitarbeiter
  FOR ALL USING (
    mandant_id IN (SELECT id FROM mandanten WHERE kanzlei_id = auth_kanzlei_id())
  );

-- Checklisten: ueber Mandant (Kanzlei)
CREATE POLICY checklisten_kanzlei ON checklisten
  FOR ALL USING (
    mandant_id IN (SELECT id FROM mandanten WHERE kanzlei_id = auth_kanzlei_id())
  );

-- Checklisten: Portal-Zugriff per Token (kein Auth)
CREATE POLICY checklisten_portal ON checklisten
  FOR SELECT USING (portal_token IS NOT NULL);

-- Dokumente: ueber Checkliste (Kanzlei)
CREATE POLICY dokumente_kanzlei ON dokumente
  FOR ALL USING (
    checkliste_id IN (
      SELECT c.id FROM checklisten c
      JOIN mandanten m ON m.id = c.mandant_id
      WHERE m.kanzlei_id = auth_kanzlei_id()
    )
  );

-- Dokumente: Portal-Lesen
CREATE POLICY dokumente_portal_read ON dokumente
  FOR SELECT USING (
    checkliste_id IN (SELECT id FROM checklisten WHERE portal_token IS NOT NULL)
  );

-- Dokumente: Portal-Update (Status setzen)
CREATE POLICY dokumente_portal_update ON dokumente
  FOR UPDATE USING (
    checkliste_id IN (SELECT id FROM checklisten WHERE portal_token IS NOT NULL)
  );

-- Dokument-Dateien: Portal-Insert
CREATE POLICY dateien_portal_insert ON dokument_dateien
  FOR INSERT WITH CHECK (
    dokument_id IN (
      SELECT d.id FROM dokumente d
      JOIN checklisten c ON c.id = d.checkliste_id
      WHERE c.portal_token IS NOT NULL
    )
  );

-- Dokument-Dateien: Kanzlei lesen
CREATE POLICY dateien_kanzlei_read ON dokument_dateien
  FOR SELECT USING (
    dokument_id IN (
      SELECT d.id FROM dokumente d
      JOIN checklisten c ON c.id = d.checkliste_id
      JOIN mandanten m ON m.id = c.mandant_id
      WHERE m.kanzlei_id = auth_kanzlei_id()
    )
  );

-- Freie Uploads: Portal-Insert
CREATE POLICY freie_uploads_portal_insert ON freie_uploads
  FOR INSERT WITH CHECK (true);

-- Freie Uploads: Kanzlei lesen und zuordnen
CREATE POLICY freie_uploads_kanzlei ON freie_uploads
  FOR ALL USING (
    mandant_id IN (SELECT id FROM mandanten WHERE kanzlei_id = auth_kanzlei_id())
  );

-- Formular-Fragen: oeffentlich lesbar (fuer Portal)
CREATE POLICY fragen_read ON formular_fragen
  FOR SELECT USING (true);

-- Formular-Antworten: Portal-Insert
CREATE POLICY antworten_portal_insert ON formular_antworten
  FOR INSERT WITH CHECK (true);

-- Formular-Antworten: Kanzlei lesen
CREATE POLICY antworten_kanzlei ON formular_antworten
  FOR SELECT USING (
    checkliste_id IN (
      SELECT c.id FROM checklisten c
      JOIN mandanten m ON m.id = c.mandant_id
      WHERE m.kanzlei_id = auth_kanzlei_id()
    )
  );

-- Vorlagen: alle aktiven lesen
CREATE POLICY vorlagen_public ON vorlage_checklisten
  FOR SELECT USING (ist_aktiv = true);

CREATE POLICY vorlagen_dok_public ON vorlage_dokumente
  FOR SELECT USING (true);

-- Erinnerungen Log: ueber Checkliste
CREATE POLICY log_kanzlei ON erinnerungen_log
  FOR ALL USING (
    checkliste_id IN (
      SELECT c.id FROM checklisten c
      JOIN mandanten m ON m.id = c.mandant_id
      WHERE m.kanzlei_id = auth_kanzlei_id()
    )
  );
