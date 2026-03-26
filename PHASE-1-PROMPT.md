# Clario Phase 1: App zum Laufen bringen — Happy Path End-to-End

## Rolle
Du bist ein erfahrener Full-Stack-Entwickler, der ein bestehendes Projekt zum ersten Mal end-to-end lauffaehig macht. Du arbeitest systematisch, testest jeden Schritt, und fixst Probleme sofort bevor du zum naechsten Schritt gehst.

## Kontext
Clario ist ein Mandantenportal fuer deutsche Steuerkanzleien (React 19 + TypeScript + Supabase + Vite). Der Code ist vollstaendig geschrieben, wurde aber noch nie end-to-end getestet. Deine Aufgabe ist es, die App Schritt fuer Schritt zum Laufen zu bringen.

Die Produktdokumentation findest du in: `Kontext Stand 25.03.206.docx`
Die Supabase-Instanz existiert bereits. Env-Variablen stehen in `.env.local`.

## Vorgehen
Arbeite die folgenden Schritte STRIKT der Reihe nach ab. Geh NICHT zum naechsten Schritt, bevor der aktuelle funktioniert. Bei jedem Fehler: analysieren, fixen, erneut testen.

---

## SCHRITT 1: Projekt starten
- `npm install` ausfuehren (falls noetig)
- `npm run dev` ausfuehren
- Pruefen ob die App unter `http://localhost:5173` ohne Fehler laed
- Falls Fehler: analysieren und fixen (fehlende Dependencies, TypeScript-Fehler, Import-Probleme)
- **Erfolgskriterium:** App laed im Browser ohne Console-Errors

## SCHRITT 2: Supabase-Verbindung pruefen
- Pruefen ob `.env.local` existiert und `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` gesetzt sind
- Pruefen ob die App die Supabase-Verbindung herstellt (kein "Umgebungsvariablen fehlen"-Error)
- **Erfolgskriterium:** App startet ohne Supabase-Verbindungsfehler

## SCHRITT 3: Datenbankschema pruefen & Migrations ausfuehren
- Pruefen ob die Tabellen bereits auf der Supabase-Instanz existieren
- Falls nicht: Supabase CLI installieren (`npx supabase --version` testen, ggf. `npm install -g supabase`)
- Ein `supabase/config.toml` erstellen falls es fehlt (project_id aus der Supabase-URL ableiten: `clkktyxufizokhppregp`)
- Migrations ausfuehren: `npx supabase db push --linked` ODER die SQL-Dateien manuell in der richtigen Reihenfolge ausfuehren:
  1. `supabase/migrations/001_schema.sql` — Tabellen und Enums
  2. `supabase/migrations/002_rls_policies.sql` — Row Level Security
  3. `supabase/migrations/003_storage_buckets.sql` — Storage Bucket "dokumente"
  4. `supabase/migrations/004_vorlagen_seed.sql` — Vorlagen-Checklisten Seed-Daten
- Falls Fehler auftreten (z.B. Tabellen existieren schon): analysieren und beheben
- **Erfolgskriterium:** Alle Tabellen existieren, Enums sind angelegt, Seed-Daten sind vorhanden

## SCHRITT 4: Registrierung testen
- Im Browser `/register` oeffnen
- Ein Testkonto anlegen: Name "Testkanzlei Mueller", E-Mail und Passwort frei waehlbar
- Pruefen ob:
  - Supabase Auth den User erstellt
  - Ein Eintrag in der `kanzleien`-Tabelle entsteht (der `useRegister`-Hook macht beides)
  - Weiterleitung zum Dashboard funktioniert
- Falls Fehler: Hook `src/features/auth/hooks/useAuth.ts` und Formular `src/features/auth/components/RegisterForm.tsx` pruefen
- **Erfolgskriterium:** Eingeloggt auf `/app/dashboard`, Kanzlei-Eintrag in DB sichtbar

## SCHRITT 5: Login testen
- Ausloggen (falls Logout-Button existiert, sonst Supabase-Session loeschen)
- Unter `/login` mit den gerade erstellten Credentials einloggen
- **Erfolgskriterium:** Login funktioniert, Weiterleitung zum Dashboard

## SCHRITT 6: Mandant anlegen
- Auf `/app/mandanten/neu` gehen
- Einen Testmandanten anlegen:
  - Name: "Max Mustermann"
  - E-Mail: eine echte E-Mail-Adresse die du kontrollierst (fuer spaetere E-Mail-Tests)
  - Typ: "privatperson"
  - Restliche Felder nach Bedarf
- Pruefen ob:
  - Mandant in der `mandanten`-Tabelle erscheint
  - Mandant auf `/app/mandanten` in der Liste sichtbar ist
  - Mandant-Detailseite `/app/mandanten/:id` laed
- **Erfolgskriterium:** Mandant existiert in DB und ist in der UI sichtbar

## SCHRITT 7: Checkliste aus Vorlage erstellen
- Auf der Mandant-Detailseite (`/app/mandanten/:id`) den Reiter "Checklisten" oeffnen
- Eine neue Checkliste aus Vorlage erstellen:
  - Vorlage: "Einkommensteuererklaerung" (passend zum Typ "privatperson")
  - Titel und Frist setzen (Frist: 2-3 Wochen in der Zukunft)
- Pruefen ob:
  - Eintrag in `checklisten`-Tabelle mit `portal_token` (UUID) entsteht
  - Dokumente aus `vorlage_dokumente` nach `dokumente` kopiert wurden
  - Die Checkliste in der UI angezeigt wird mit allen Dokumenten
- Falls die Vorlagen-Auswahl leer ist: pruefen ob `004_vorlagen_seed.sql` gelaufen ist
- **Erfolgskriterium:** Checkliste mit kopierten Dokumenten existiert, `portal_token` ist generiert

## SCHRITT 8: Magic Link / Portal testen (DER KRITISCHSTE SCHRITT)
- Den `portal_token` der gerade erstellten Checkliste aus der DB holen (oder aus der UI kopieren wenn MagicLinkPanel das anzeigt)
- In einem neuen Inkognito-Tab oeffnen: `http://localhost:5173/portal/[TOKEN]`
- Pruefen ob:
  - Seite laed OHNE Login-Aufforderung (public route, Token-basiert)
  - Kanzlei-Name und Logo erscheinen
  - Checklisten-Titel und Frist angezeigt werden
  - Fortschrittsbalken zeigt "0 von X Pflichtdokumenten"
  - Alle Dokumente als Karten sichtbar sind mit Upload-Bereichen
- Falls RLS-Fehler: `002_rls_policies.sql` pruefen — Portal braucht SELECT ohne Auth via `portal_token`
- **Erfolgskriterium:** Mandanten-Portal laed vollstaendig mit allen Dokumenten, ohne Auth

## SCHRITT 9: Datei-Upload im Portal testen
- Im Portal (Inkognito-Tab) ein Testdokument hochladen:
  - Ein beliebiges PDF oder Bild als Testdatei verwenden
  - Upload-Bereich bei einem Pflichtdokument nutzen
- Pruefen ob:
  - Datei im Supabase Storage Bucket "dokumente" landet
  - Eintrag in `dokument_dateien`-Tabelle entsteht
  - `dokumente`-Tabelle Status auf "hochgeladen" wechselt
  - Fortschrittsbalken sich aktualisiert
  - Upload-Bestaetigung in der UI erscheint (gruener Haken)
- Falls Storage-Fehler: Bucket-Konfiguration und RLS-Policies fuer Storage pruefen
- **Erfolgskriterium:** Datei ist hochgeladen, Status aktualisiert, Fortschritt sichtbar

## SCHRITT 10: Dashboard-Aktualisierung pruefen
- Zurueck zum Kanzlei-Dashboard (anderer Tab, eingeloggt)
- Dashboard neu laden
- Pruefen ob:
  - Mandant "Max Mustermann" in der Tabelle erscheint
  - Ampel-Badge den richtigen Status zeigt (Gelb oder Gruen je nach Upload)
  - Fortschritt korrekt berechnet wird
  - Bei Klick auf Mandant die Checklisten-Details sichtbar sind
  - Hochgeladenes Dokument im Dokumenteneingang (`/app/dokumente`) erscheint
- **Erfolgskriterium:** Dashboard zeigt korrekten Live-Status des Mandanten

## SCHRITT 11: Edge Functions deployen (Claude AI + E-Mail)
Dieser Schritt erfordert API-Keys. Falls Keys nicht vorhanden sind: dokumentiere was fehlt und ueberspringe zum naechsten Schritt.

- Supabase CLI mit dem Projekt verlinken: `npx supabase link --project-ref clkktyxufizokhppregp`
- Edge Functions deployen:
  ```
  npx supabase functions deploy bild-qualitaet
  npx supabase functions deploy dokument-anleitung
  npx supabase functions deploy magic-link-senden
  npx supabase functions deploy upload-benachrichtigung
  npx supabase functions deploy wiederkehrende-checklisten
  ```
- Secrets setzen (nur wenn Keys vorhanden):
  ```
  npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
  npx supabase secrets set RESEND_API_KEY=re_...
  npx supabase secrets set APP_URL=http://localhost:5173
  ```
- **Erfolgskriterium:** Functions deployt, Secrets gesetzt

## SCHRITT 12: "Wo finde ich das?" testen (Claude AI)
- Im Portal bei einem ausstehenden Dokument den "Wo finde ich das?"-Button klicken
- Pruefen ob:
  - Loading-Skeleton erscheint
  - Claude-generierte Anleitung inline angezeigt wird
  - Schritte und Alternativ-Text korrekt gerendert werden
- Falls Edge Function nicht erreichbar: Hook `src/features/portal/hooks/useDokumentAnleitung.ts` pruefen — ist der Function-URL korrekt?
- **Erfolgskriterium:** Personalisierte Dokument-Anleitung wird live generiert

## SCHRITT 13: Erinnerung senden testen
- Im Dashboard bei einem Mandanten "Erinnerung senden" klicken
- Pruefen ob:
  - Edge Function `magic-link-senden` aufgerufen wird
  - E-Mail beim Mandanten ankommt (falls Resend-Key gesetzt)
  - Eintrag in `erinnerungen_log` geschrieben wird
  - E-Mail den Portal-Link enthaelt und dieser funktioniert
- **Erfolgskriterium:** E-Mail kommt an, Link fuehrt zum Portal

---

## Zusammenfassung: Der Happy Path
Wenn alle Schritte funktionieren, hast du folgenden End-to-End-Flow:

1. Kanzlei registriert sich
2. Kanzlei legt Mandant an
3. Kanzlei erstellt Checkliste aus Vorlage
4. Mandant bekommt E-Mail mit Magic Link
5. Mandant oeffnet Portal — sieht Checkliste ohne Account
6. Mandant laed Dokument hoch
7. Kanzlei sieht im Dashboard: Dokument eingegangen, Ampel aktualisiert

Das ist dein MVP. Alles andere kommt spaeter.

---

## Regeln
- NUR TypeScript, keine `any`-Typen
- Alle UI-Texte auf Deutsch
- Alle Kommentare auf Deutsch
- Vollstaendige Dateien liefern — keine Snippets
- Fehler sofort fixen, nicht weitergehen
- Nach jedem abgeschlossenen Schritt kurz zusammenfassen was funktioniert und was nicht
- Supabase Region MUSS Frankfurt bleiben (eu-central-1)
- API Keys NIE im Frontend — nur in Edge Functions via Deno.env
