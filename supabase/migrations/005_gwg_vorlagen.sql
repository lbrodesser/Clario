-- GwG-Vorlagen: Digitale Unterschrift und PDF-Vorlagen
-- Erweitert Kanzleien, Dokumente, DokumentDateien und VorlageDokumente

-- Kanzleien: PDF-Vorlagen-URLs
ALTER TABLE kanzleien ADD COLUMN IF NOT EXISTS vollmacht_vorlage_url text;
ALTER TABLE kanzleien ADD COLUMN IF NOT EXISTS datenschutz_vorlage_url text;

-- Dokumente: Vorlage-Referenz und Unterschrift-Flag
ALTER TABLE dokumente ADD COLUMN IF NOT EXISTS vorlage_pdf_url text;
ALTER TABLE dokumente ADD COLUMN IF NOT EXISTS unterschrift_erforderlich boolean DEFAULT false;

-- DokumentDateien: Signatur-Audit-Trail
ALTER TABLE dokument_dateien ADD COLUMN IF NOT EXISTS ist_signiert boolean DEFAULT false;
ALTER TABLE dokument_dateien ADD COLUMN IF NOT EXISTS signatur_zeitpunkt timestamptz;
ALTER TABLE dokument_dateien ADD COLUMN IF NOT EXISTS signatur_ip text;

-- VorlageDokumente: Unterschrift-Flag
ALTER TABLE vorlage_dokumente ADD COLUMN IF NOT EXISTS unterschrift_erforderlich boolean DEFAULT false;

-- Storage Bucket fuer Vorlagen (oeffentlich lesbar fuer Portal-Mandanten)
INSERT INTO storage.buckets (id, name, public) VALUES ('vorlagen', 'vorlagen', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies fuer Vorlagen-Bucket (pfadbeschraenkt auf eigene Kanzlei)
CREATE POLICY "Kanzlei kann eigene Vorlagen hochladen"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vorlagen'
  AND (storage.foldername(name))[1] = auth_kanzlei_id()::text
);

CREATE POLICY "Vorlagen sind oeffentlich lesbar"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vorlagen');

CREATE POLICY "Kanzlei kann eigene Vorlagen aktualisieren"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vorlagen'
  AND (storage.foldername(name))[1] = auth_kanzlei_id()::text
)
WITH CHECK (
  bucket_id = 'vorlagen'
  AND (storage.foldername(name))[1] = auth_kanzlei_id()::text
);

CREATE POLICY "Kanzlei kann eigene Vorlagen loeschen"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vorlagen'
  AND (storage.foldername(name))[1] = auth_kanzlei_id()::text
);

-- GwG-Vorlagen-Seed aktualisieren
UPDATE vorlage_dokumente
SET unterschrift_erforderlich = true
WHERE vorlage_checkliste_id = (
  SELECT id FROM vorlage_checklisten WHERE name = 'GwG Neumandant Onboarding'
)
AND titel = 'Vollmacht unterschrieben';

UPDATE vorlage_dokumente
SET unterschrift_erforderlich = true
WHERE vorlage_checkliste_id = (
  SELECT id FROM vorlage_checklisten WHERE name = 'GwG Neumandant Onboarding'
)
AND titel = 'Datenschutzerklaerung unterschrieben';

UPDATE vorlage_dokumente
SET mehrdatei_erlaubt = true
WHERE vorlage_checkliste_id = (
  SELECT id FROM vorlage_checklisten WHERE name = 'GwG Neumandant Onboarding'
)
AND titel LIKE 'Personalausweis%';
