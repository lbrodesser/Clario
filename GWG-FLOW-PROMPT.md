# GwG-Onboarding-Flow komplett ueberarbeiten — Vorlagen-Download + Digitale Unterschrift

## Rolle
Du bist ein erfahrener Full-Stack-Entwickler der ein bestehendes Feature ueberarbeitet. Du arbeitest praezise, aenderst nur was noetig ist, und brichst nichts Bestehendes kaputt. Du lieferst immer vollstaendige Dateien — keine Snippets. Alle UI-Texte und Kommentare auf Deutsch.

## Kontext
Clario ist ein Mandantenportal fuer deutsche Steuerkanzleien (React 19 + TypeScript + Supabase + Vite + shadcn/ui + TanStack Query). Die komplette Produktdokumentation liegt in `Kontext Stand 25.03.206.docx`.

Das Projekt hat ein GwG-Neumandant-Onboarding. Der aktuelle Flow hat eine kritische Luecke:

**IST-Zustand (kaputt):**
Die GwG-Checkliste fordert vom Mandanten: Personalausweis, unterschriebene Vollmacht, unterschriebene Datenschutzerklaerung. ABER: Der Mandant bekommt die Vollmacht und Datenschutzerklaerung nie zugeschickt. Er hat sie nicht. Er kann sie also nicht unterschreiben und hochladen.

**SOLL-Zustand (was du baust):**
Die Kanzlei hinterlegt ihre Vollmacht-Vorlage und Datenschutzerklaerung als PDF. Der Mandant bekommt im Portal diese PDFs angezeigt, kann sie lesen, digital mit dem Finger (Mobile) oder Maus (Desktop) unterschreiben, und das signierte Dokument wird automatisch hochgeladen.

## Was sich aendert — Uebersicht

### 1. Datenbank-Erweiterungen
### 2. Kanzlei-Einstellungen: PDF-Vorlagen hochladen
### 3. Neuer Eingabetyp oder neues Feld: Dokument mit Vorlage + Unterschrift
### 4. Portal: Vorlage anzeigen + Canvas-Unterschrift + signiertes PDF generieren
### 5. Personalausweis-Flow: Explizit Vorder- UND Rueckseite
### 6. E-Mail: GwG-Onboarding-Mail mit Erklaerung

---

## SCHRITT 1: Datenbank-Erweiterungen

Erstelle eine neue Migration `005_gwg_vorlagen.sql` in `supabase/migrations/`.

### Tabelle `kanzleien` erweitern:
```sql
ALTER TABLE kanzleien ADD COLUMN IF NOT EXISTS vollmacht_vorlage_url text;
ALTER TABLE kanzleien ADD COLUMN IF NOT EXISTS datenschutz_vorlage_url text;
```
Diese Felder speichern die URLs zu den PDF-Vorlagen im Supabase Storage.

### Tabelle `dokumente` erweitern:
```sql
ALTER TABLE dokumente ADD COLUMN IF NOT EXISTS vorlage_pdf_url text;
ALTER TABLE dokumente ADD COLUMN IF NOT EXISTS unterschrift_erforderlich boolean DEFAULT false;
```
- `vorlage_pdf_url`: Link zum PDF das der Mandant herunterladen/ansehen und unterschreiben soll
- `unterschrift_erforderlich`: Wenn true, muss der Mandant im Portal eine Canvas-Unterschrift leisten

### Tabelle `dokument_dateien` erweitern:
```sql
ALTER TABLE dokument_dateien ADD COLUMN IF NOT EXISTS ist_signiert boolean DEFAULT false;
ALTER TABLE dokument_dateien ADD COLUMN IF NOT EXISTS signatur_zeitpunkt timestamptz;
ALTER TABLE dokument_dateien ADD COLUMN IF NOT EXISTS signatur_ip text;
```
Fuer den Audit-Trail der digitalen Unterschrift.

### Neuen Storage Bucket erstellen:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('vorlagen', 'vorlagen', true)
ON CONFLICT (id) DO NOTHING;
```
Oeffentlich lesbar, damit Mandanten im Portal die PDFs ohne Auth sehen koennen.

### Storage Policy fuer Vorlagen-Bucket:
```sql
-- Kanzleien koennen eigene Vorlagen hochladen
CREATE POLICY "Kanzlei kann Vorlagen hochladen"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vorlagen');

-- Jeder kann Vorlagen lesen (oeffentlich)
CREATE POLICY "Vorlagen sind oeffentlich lesbar"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vorlagen');

-- Kanzleien koennen eigene Vorlagen loeschen
CREATE POLICY "Kanzlei kann Vorlagen loeschen"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vorlagen');
```

### GwG-Vorlagen-Seed aktualisieren:
Die bestehenden vorlage_dokumente fuer GwG Onboarding muessen aktualisiert werden. Schreibe ein UPDATE:
```sql
-- Vollmacht: unterschrift_erforderlich = true
UPDATE vorlage_dokumente
SET unterschrift_erforderlich = true
WHERE vorlage_checkliste_id = (
  SELECT id FROM vorlage_checklisten WHERE titel = 'GwG Neumandant Onboarding'
)
AND titel = 'Vollmacht unterschrieben';

-- Datenschutzerklaerung: unterschrift_erforderlich = true
UPDATE vorlage_dokumente
SET unterschrift_erforderlich = true
WHERE vorlage_checkliste_id = (
  SELECT id FROM vorlage_checklisten WHERE titel = 'GwG Neumandant Onboarding'
)
AND titel = 'Datenschutzerklaerung unterschrieben';

-- Personalausweis: mehrdatei_erlaubt = true (Vorder- UND Rueckseite)
UPDATE vorlage_dokumente
SET mehrdatei_erlaubt = true
WHERE vorlage_checkliste_id = (
  SELECT id FROM vorlage_checklisten WHERE titel = 'GwG Neumandant Onboarding'
)
AND titel LIKE 'Personalausweis%';
```

Ausserdem muss `vorlage_dokumente` ebenfalls die neuen Spalten haben:
```sql
ALTER TABLE vorlage_dokumente ADD COLUMN IF NOT EXISTS unterschrift_erforderlich boolean DEFAULT false;
```
(vorlage_pdf_url wird bei Vorlagen NICHT gesetzt — die URL kommt aus kanzleien.vollmacht_vorlage_url / datenschutz_vorlage_url zur Laufzeit beim Erstellen der Checkliste)

---

## SCHRITT 2: TypeScript-Typen aktualisieren

Datei: `src/shared/types/index.ts`

### Interface `Kanzlei` erweitern:
```typescript
vollmacht_vorlage_url?: string | null
datenschutz_vorlage_url?: string | null
```

### Interface `Dokument` erweitern:
```typescript
vorlage_pdf_url?: string | null
unterschrift_erforderlich?: boolean
```

### Interface `DokumentDatei` erweitern:
```typescript
ist_signiert?: boolean
signatur_zeitpunkt?: string | null
signatur_ip?: string | null
```

### Interface `VorlageDokument` erweitern:
```typescript
unterschrift_erforderlich?: boolean
```

---

## SCHRITT 3: Kanzlei-Einstellungen — PDF-Vorlagen hochladen

Datei: `src/features/einstellungen/components/KanzleiProfilForm.tsx`

Erweitere das bestehende Formular um zwei Upload-Bereiche:

### UI-Design:
Nach dem Kanzleinamen-Feld eine neue Section "GwG-Dokumentvorlagen" mit:
- **Vollmacht-Vorlage**: Upload-Bereich fuer PDF. Wenn bereits hochgeladen: Dateiname + "Vorschau" Link + "Ersetzen" Button + "Entfernen" Button
- **Datenschutzerklaerung-Vorlage**: Gleicher Aufbau.
- Hinweistext: "Diese PDFs werden Ihren Mandanten im Portal zum Unterschreiben angezeigt. Laden Sie Ihre eigene Vorlage als PDF hoch."

### Upload-Logik:
- Datei wird in Supabase Storage Bucket `vorlagen` hochgeladen
- Pfad: `vorlagen/{kanzlei_id}/vollmacht.pdf` bzw. `vorlagen/{kanzlei_id}/datenschutz.pdf`
- Nach Upload: Public URL in `kanzleien.vollmacht_vorlage_url` / `kanzleien.datenschutz_vorlage_url` speichern
- Nur PDF erlauben (accept=".pdf")
- Maximale Dateigroesse: 5MB

### Wichtig:
- Nutze `supabase.storage.from('vorlagen').upload(...)` und `.getPublicUrl(...)`
- Invalidiere den Kanzlei-Query-Cache nach Upload
- Zeige Toast-Nachricht bei Erfolg/Fehler

---

## SCHRITT 4: Checkliste-Erstellung anpassen

Datei: `src/features/checklisten/hooks/useChecklisten.ts`

Beim Hook `useChecklisteErstellen` wird aktuell die Vorlage kopiert. Hier muss zusaetzlich passieren:

Wenn ein `vorlage_dokument` das Flag `unterschrift_erforderlich = true` hat UND der Dokumenttitel "Vollmacht" oder "Datenschutz" enthaelt:
- Lade die Kanzlei-Daten (kanzlei.vollmacht_vorlage_url / kanzlei.datenschutz_vorlage_url)
- Setze `vorlage_pdf_url` im neuen `dokumente`-Eintrag auf die entsprechende Kanzlei-Vorlage-URL
- Kopiere `unterschrift_erforderlich = true` in den neuen Dokument-Eintrag

Wenn die Kanzlei noch keine Vorlage hochgeladen hat: `vorlage_pdf_url` bleibt null. Im Portal wird dann ein Hinweis gezeigt, dass die Kanzlei die Vorlage noch bereitstellen muss.

---

## SCHRITT 5: Portal — Digitale Unterschrift (KERNFEATURE)

### 5a: Neue Komponente `SignaturPad.tsx`

Erstelle: `src/features/portal/components/SignaturPad.tsx`

Ein Canvas-basiertes Unterschriftsfeld:
- **Groesse:** Volle Breite (max 640px), Hoehe 200px
- **Touch-Support:** Finger auf Mobile (touchstart/touchmove/touchend), Maus auf Desktop (mousedown/mousemove/mouseup)
- **Styling:** Weisser Hintergrund, 1px solid border (slate-300), abgerundete Ecken
- **Stift:** 2px schwarze Linie, smooth (lineCap: 'round', lineJoin: 'round')
- **Buttons darunter:**
  - "Unterschrift loeschen" (Ghost-Button, links) — loescht das Canvas
  - "Unterschreiben und absenden" (Primary-Button, rechts, volle Breite) — nur aktiv wenn etwas gezeichnet wurde
- **Export:** Canvas als PNG-DataURL exportieren (`canvas.toDataURL('image/png')`)
- **Leer-Erkennung:** Pruefe ob Canvas leer ist (getImageData und pruefen ob alle Pixel weiss/transparent sind, ODER einfach ein Flag `hasDrawn` das bei jedem Strich auf true gesetzt wird)
- **Label:** "Bitte unterschreiben Sie hier:" ueber dem Canvas
- **Hinweistext darunter:** "Mit Ihrer Unterschrift bestaetigen Sie, dass Sie das Dokument gelesen und akzeptiert haben."

### 5b: Neue Komponente `VorlageMitUnterschrift.tsx`

Erstelle: `src/features/portal/components/VorlageMitUnterschrift.tsx`

Diese Komponente ersetzt den normalen Upload-Bereich wenn ein Dokument `unterschrift_erforderlich = true` UND `vorlage_pdf_url` gesetzt hat.

**Layout (Mobile-first, max-width 640px):**

1. **Dokumenttitel** als Ueberschrift (z.B. "Vollmacht unterschreiben")
2. **PDF-Vorschau:** Zeige das PDF inline. Nutze ein `<iframe>` oder `<object>` Tag:
   ```html
   <object data={vorlage_pdf_url} type="application/pdf" width="100%" height="400px">
     <p>PDF kann nicht angezeigt werden. <a href={vorlage_pdf_url} target="_blank">PDF herunterladen</a></p>
   </object>
   ```
   Darunter zusaetzlich ein expliziter "PDF herunterladen" Link (manche Mobile-Browser koennen kein inline PDF).
3. **SignaturPad** Komponente
4. **Status nach Unterschrift:** Gruener Haken + "Unterschrieben am [Datum]" wenn bereits signiert

**Ablauf bei "Unterschreiben und absenden":**
1. Signatur-PNG vom Canvas holen
2. Per JavaScript ein neues PDF erzeugen das die Signatur enthaelt:
   - Nutze die Library `pdf-lib` (installieren: `npm install pdf-lib`)
   - Lade das Original-PDF von `vorlage_pdf_url`
   - Fuege auf der letzten Seite hinzu:
     - Horizontale Linie
     - Text: "Elektronisch unterschrieben am [Datum, Uhrzeit] Uhr"
     - Text: "Name: [mandant.name]"
     - Die Signatur als eingebettetes PNG-Bild (ca. 200x80px, positioniert unter dem Text)
   - Speichere das modifizierte PDF als Blob
3. Lade das signierte PDF via `useUpload()` hoch — genau wie ein normaler Datei-Upload
4. Setze zusaetzlich in `dokument_dateien`:
   - `ist_signiert = true`
   - `signatur_zeitpunkt = new Date().toISOString()`
   - `signatur_ip` = Versuche die IP zu lesen, sonst 'nicht verfuegbar' (IP-Ermittlung ist optional, nicht kritisch)
5. Aktualisiere den Dokument-Status auf 'hochgeladen'
6. Zeige Erfolgsmeldung

**Fallback wenn vorlage_pdf_url null ist:**
Zeige statt dem PDF einen Hinweistext:
"Ihre Kanzlei hat dieses Dokument noch nicht bereitgestellt. Bitte kontaktieren Sie [Kanzleiname] direkt."
Kein Upload-Bereich, kein SignaturPad.

### 5c: ChecklisteAnsicht.tsx anpassen

Datei: `src/features/portal/components/ChecklisteAnsicht.tsx`

Fuer jedes Dokument in der Checkliste pruefen:
- Wenn `dokument.unterschrift_erforderlich === true`: Zeige `VorlageMitUnterschrift` statt `DokumentUploadBereich`
- Wenn `dokument.unterschrift_erforderlich !== true`: Bestehendes Verhalten beibehalten

### 5d: Personalausweis-Spezialbehandlung

Der Personalausweis im GwG-Onboarding braucht Vorder- UND Rueckseite. Das Feld `mehrdatei_erlaubt` ist bereits auf true gesetzt (durch die Migration). Aber die UI sollte expliziter sein:

In `DokumentUploadBereich.tsx` oder `ChecklisteAnsicht.tsx`:
- Wenn der Dokumenttitel "Personalausweis" enthaelt UND `mehrdatei_erlaubt = true`:
  - Zeige zwei separate Upload-Bereiche: "Vorderseite" und "Rueckseite"
  - Jeder mit eigenem FotoCapture
  - Zeige Hinweistext: "Bitte fotografieren Sie Vorder- und Rueckseite Ihres Personalausweises separat."
- Das ist KEIN neuer Eingabetyp — es ist eine UI-Anpassung die den bestehenden mehrdatei-Upload nutzt, aber benutzerfreundlicher gestaltet

---

## SCHRITT 6: E-Mail fuer GwG-Onboarding anpassen

Datei: `supabase/functions/magic-link-senden/index.ts`

Der E-Mail-Text fuer GwG-Onboarding sollte erklaeren, was der Mandant tun muss. Erweitere die Edge Function:

Wenn `typ === 'einladung'` UND der Checklisten-Titel "GwG" enthaelt:
- Betreff: "[Kanzleiname]: Bitte identifizieren Sie sich fuer Ihr Mandat"
- Inhalt ergaenzen um:
  ```
  Fuer die Aufnahme Ihres Mandats benoetigen wir folgende Unterlagen:
  - Personalausweis (Vorder- und Rueckseite)
  - Ihre Unterschrift auf unserer Vollmacht
  - Ihre Unterschrift auf unserer Datenschutzerklaerung

  Sie koennen alle Dokumente bequem online einreichen — kein Ausdrucken noetig.
  ```
- CTA-Button bleibt: "Jetzt Unterlagen einreichen"

---

## SCHRITT 7: useUpload Hook erweitern

Datei: `src/features/portal/hooks/useUpload.ts`

Die bestehende `useUpload()` Mutation muss die neuen Signatur-Felder unterstuetzen.

Erweitere die Parameter des Hooks:
```typescript
interface UploadParams {
  dokumentId: string
  portalToken: string
  datei: File
  qualitaetGeprueft?: boolean
  qualitaetBestanden?: boolean
  qualitaetHinweis?: string | null
  qualitaetTrotzdemHochgeladen?: boolean
  // NEU:
  istSigniert?: boolean
  signaturZeitpunkt?: string | null
  signaturIp?: string | null
}
```

Beim Insert in `dokument_dateien` die neuen Felder mitsenden wenn vorhanden.

---

## SCHRITT 8: Kanzlei-Dashboard — Signierte Dokumente kennzeichnen

Datei: `src/features/checklisten/components/DokumentZeile.tsx`

Wenn ein hochgeladenes Dokument `ist_signiert = true` hat:
- Zeige ein zusaetzliches Badge "Digital unterschrieben" (gruen) neben dem Dateinamen
- Zeige den Signatur-Zeitpunkt als Tooltip oder kleinen Text

---

## Abhaengigkeit: pdf-lib installieren

```bash
npm install pdf-lib
```

Diese Library laeuft komplett im Browser (kein Server noetig), kann bestehende PDFs laden und modifizieren, und Bilder einbetten. Perfekt fuer den Use Case.

---

## Reihenfolge der Implementierung

1. Migration `005_gwg_vorlagen.sql` erstellen und ausfuehren
2. TypeScript-Typen aktualisieren
3. `npm install pdf-lib`
4. `KanzleiProfilForm.tsx` erweitern (Vorlagen-Upload)
5. `SignaturPad.tsx` erstellen (Canvas-Komponente)
6. `VorlageMitUnterschrift.tsx` erstellen (PDF-Vorschau + Signatur + Upload)
7. `ChecklisteAnsicht.tsx` anpassen (Routing zu neuer Komponente)
8. `useUpload.ts` erweitern (Signatur-Felder)
9. `useChecklisten.ts` anpassen (Vorlage-URLs beim Kopieren setzen)
10. `DokumentUploadBereich.tsx` anpassen (Personalausweis Vorder/Rueckseite)
11. `DokumentZeile.tsx` anpassen (Signatur-Badge im Dashboard)
12. `magic-link-senden/index.ts` anpassen (GwG-spezifische E-Mail)
13. Testen: Kompletter GwG-Flow end-to-end

---

## Testplan

Nach der Implementierung diesen Flow komplett durchlaufen:

1. **Einstellungen:** PDF-Vorlagen fuer Vollmacht und Datenschutz hochladen → pruefen ob URLs in DB gespeichert
2. **Mandant anlegen:** Neuen Mandanten erstellen → GwG-Banner zeigt "ausstehend"
3. **GwG-Checkliste erstellen:** Aus Vorlage → pruefen ob dokumente mit `vorlage_pdf_url` und `unterschrift_erforderlich` erstellt werden
4. **Portal oeffnen (Inkognito):** Magic Link → Checkliste mit 3 Dokumenten sichtbar
5. **Personalausweis:** Zwei separate Upload-Bereiche (Vorder-/Rueckseite) → Fotos hochladen
6. **Vollmacht:** PDF-Vorschau sichtbar → "PDF herunterladen" funktioniert → SignaturPad zeichnen → "Unterschreiben und absenden" → signiertes PDF wird generiert und hochgeladen
7. **Datenschutzerklaerung:** Gleicher Flow wie Vollmacht
8. **Dashboard pruefen:** Alle 3 Dokumente als "hochgeladen" → Vollmacht und Datenschutz mit "Digital unterschrieben" Badge
9. **Signiertes PDF herunterladen:** Oeffnen und pruefen ob Signatur + Zeitstempel + Name im PDF enthalten

---

## Regeln

- Nur TypeScript, keine `any`-Typen
- Alle UI-Texte auf Deutsch
- Alle Kommentare auf Deutsch
- Mobile-first fuer alles unter /portal/*
- Touch-Targets mindestens 48px
- shadcn/ui Komponenten bevorzugen
- TanStack Query fuer alle Datenfetching-Operationen
- Zod fuer Validierung wo noetig
- Vollstaendige Dateien liefern — keine Snippets
- API Keys NIE im Frontend
- Supabase Region MUSS Frankfurt bleiben
- Nach jedem abgeschlossenen Schritt: kurz zusammenfassen was funktioniert
