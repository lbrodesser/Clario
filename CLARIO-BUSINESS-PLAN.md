# Clario — Business-Plan & Go-to-Market

**Erstellt am:** 26. März 2026 (KW13)
**Autor:** Lennart Brodesser, Solofounder
**Stand:** MVP code-seitig fertig, 0 Kunden, 0 Revenue

---

## 1. Sofort-Aktionen (KW14–KW15: 30. März – 12. April)

### KW14 — Montag bis Mittwoch: Security Fixes + erster Browsertest

**Tag 1 (Mo 30.03.):**
Öffne `SECURITY-FIX-PROMPT.md` in Claude Code und arbeite Phase 1 ab (die 5 kritischen Sicherheitslücken). Das ist der absolute Blocker — ohne diese Fixes darf kein Mandant echte Daten eingeben. Am Ende des Tages: `npm run build` muss fehlerfrei durchlaufen.

**Tag 2 (Di 31.03.):**
Erster manueller Browsertest. Starte die App lokal (`npm run dev`), erstelle ein Konto, lege einen Test-Mandanten an, erstelle eine GwG-Checkliste, sende den Portal-Link, öffne ihn im Inkognito-Tab. Teste: Foto hochladen, Unterschrift setzen, "Wo finde ich das?" klicken. Notiere jedes Problem als GitHub Issue.

**Tag 3 (Mi 01.04.):**
Behebe die am Dienstag gefundenen Bugs. Deploye die Edge Functions auf Supabase (`supabase functions deploy`). Teste E-Mail-Versand mit Resend (erst im Testmodus, dann 1 echte Mail an dich selbst).

### KW14 — Donnerstag bis Freitag: Hosting + Domain + Legal

**Hosting auf Vercel einrichten:**
1. Gehe zu vercel.com → "Sign Up" mit GitHub
2. "Import Project" → wähle dein Clario-Repo
3. Framework Preset: Vite
4. Environment Variables setzen:
   - `VITE_SUPABASE_URL` → deine Supabase-Projekt-URL
   - `VITE_SUPABASE_ANON_KEY` → dein Anon Key
5. Deploy klicken → du bekommst `clario-xyz.vercel.app`

**Domain:**
- Option A: `clario.app` oder `clario.de` → prüfe Verfügbarkeit auf united-domains.de
- Option B: `getclario.de` falls `.de` belegt
- Kosten: ~12€/Jahr für .de, ~30€/Jahr für .app
- In Vercel: Settings → Domains → Custom Domain hinzufügen → DNS bei deinem Registrar auf Vercel-Nameserver umstellen

**Impressum + Datenschutzerklärung (PFLICHT vor Go-Live):**
- Generiere ein Impressum über e-recht24.de/impressum-generator (kostenlos)
- Datenschutzerklärung über datenschutz-generator.de (kostenloser Generator von Dr. Schwenke)
- Beide als Seiten in die App einbauen (`/impressum`, `/datenschutz`)
- Minimum-Inhalte: Name, Anschrift, E-Mail, Telefon, Verantwortlicher für Datenverarbeitung, Hinweis auf Supabase (Frankfurt, eu-central-1), Auftragsverarbeitung, Rechte der Betroffenen

**AGB (kann warten, aber nicht lange):**
- Für den Beta-Start reicht: "Kostenlose Testphase. Keine Gewährleistung. Kein SLA."
- Für zahlende Kunden: AGB über einen Anwalt (ca. 500–1.500€) oder über einen AGB-Generator (z.B. IT-Recht Kanzlei, ~30€/Monat)

### KW15 — Landing Page live + Stripe

**Landing Page deployen:**
- Die `clario-landing-page.html` existiert bereits. Deploye sie auf Vercel als statische Seite.
- Oder: Baue sie als Route in die Clario-App ein (`/` = Landing Page, `/app` = Dashboard)
- Alle CTAs zeigen auf: "Jetzt kostenlos testen" → Link zu `/auth/register`
- Baue ein Calendly-Widget ein (kostenlos) für "Demo vereinbaren" — das konvertiert besser als ein Registrierungs-Link

**Stripe Integration (Grundversion):**
1. Erstelle Stripe-Account auf stripe.com (Firmendaten: Einzelunternehmen reicht)
2. Erstelle 3 Produkte im Stripe Dashboard:
   - "Clario Starter" — €49/Monat — bis 30 Mandanten
   - "Clario Pro" — €99/Monat — bis 100 Mandanten
   - "Clario Kanzlei" — €199/Monat — unbegrenzt
3. Generiere Payment Links für jedes Produkt
4. In der App: Pricing-Seite mit 3 Karten, jede linkt auf den Stripe Payment Link
5. Webhook von Stripe → Supabase Edge Function → setzt `abo_status` in kanzleien-Tabelle
6. WICHTIG: Starte mit einem kostenlosen Trial (30 Tage, keine Kreditkarte nötig). Das senkt die Hürde massiv.

---

## 2. Go-to-Market: Die ersten 5 zahlenden Kunden (KW15–KW22)

### Kanal 1: Dein persönliches Netzwerk (KW15)

**Realität:** Die allerersten Kunden kommen nie über Marketing. Sie kommen über persönliche Beziehungen.

- Hast du einen eigenen Steuerberater? Ruf ihn an. Sag: "Ich habe ein Tool gebaut das dir Zeit spart. Kann ich dir das in 15 Minuten zeigen?"
- Kennst du jemanden der einen Steuerberater hat? Bitte um eine Intro.
- Kennst du Leute die in Kanzleien arbeiten (Steuerfachangestellte, Buchhalter)? Die sind oft die wahren Entscheider für neue Tools.

Ziel: 3 persönliche Demos in KW15–KW16.

### Kanal 2: LinkedIn Outreach (KW16–KW18)

**Warum LinkedIn:** 89.000 Steuerberater in Deutschland. Viele davon sind auf LinkedIn — vor allem die jüngeren, innovativeren Kanzleiinhaber die du als Early Adopter brauchst.

**Zielgruppe auf LinkedIn:**
- Titel: "Steuerberater", "Kanzleiinhaber", "Partner Steuerkanzlei"
- Standort: Deutschland
- Firmengröße: 1–50 Mitarbeiter (kleine bis mittlere Kanzleien — die haben das Problem am stärksten, DATEV ist dort oft zu teuer/komplex)

**Outreach-Nachricht (NICHT verkaufen, sondern fragen):**

> Hallo [Vorname],
>
> ich entwickle gerade ein digitales Mandantenportal speziell für kleinere Kanzleien. Das Ziel: Mandanten schicken Unterlagen nicht mehr per E-Mail, sondern über einen einfachen Link — inklusive Foto-Upload, digitaler Unterschrift und automatischer Erinnerungen.
>
> Ich bin noch in der Frühphase und suche 3–5 Steuerberater, die mir ehrliches Feedback geben. Dafür biete ich 6 Monate kostenlose Nutzung an.
>
> Hätten Sie 15 Minuten für einen kurzen Austausch?

**Warum das funktioniert:**
- Du verkaufst nicht. Du fragst nach Feedback.
- 6 Monate kostenlos = kein Risiko.
- "Kleinere Kanzleien" spricht die Zielgruppe an die sich von DATEV ignoriert fühlt.

**Volumen:** 10 Nachrichten pro Tag = 50 pro Woche. Bei 10% Antwortrate = 5 Gespräche pro Woche. In 3 Wochen hast du 15 Gespräche, daraus 3–5 Testnutzer.

### Kanal 3: Steuerberater-Communities & Foren (KW17–KW20)

**Basierend auf der Recherche existieren keine großen offenen Online-Communities für Steuerberater.** Die Kommunikation läuft über regionale Steuerberaterverbände und geschlossene Netzwerke.

**Taktik:**
- Schreibe die 21 regionalen Steuerberaterkammern an (Liste: bstbk.de/de/steuerberaterkammern). Biete an, bei einem Stammtisch oder einer Regionalveranstaltung dein Tool vorzustellen.
- Suche auf LinkedIn nach "Steuerberater Stammtisch [Stadt]" — es gibt informelle Gruppen.
- Poste auf stb-web.de (das größte Fachportal für Steuerberater) — die haben ein Forum und Fachbeiträge.

### Kanal 4: Deutscher Steuerberaterkongress (4.–5. Mai 2026, Berlin)

**Das ist dein wichtigstes Event.**

- Termin: 4.–5. Mai 2026 in Berlin
- Was du brauchst: Nicht unbedingt einen Stand (teuer). Gehe als Besucher hin (Ticket: ca. 300–500€ basierend auf verfügbaren Daten).
- Bring 50 visitkarten mit QR-Code zu deiner Landing Page.
- Sprich Leute in Pausen an. Frage: "Wie sammeln Sie gerade Unterlagen von Ihren Mandanten ein?" — das öffnet das Gespräch.
- Ziel: 10 konkrete Kontakte, 5 Demo-Termine.

**Zweites Event:** Steuerberatertag, 4.–6. Oktober 2026 in Bonn. Das planst du für die zweite Wachstumsphase.

### Kanal 5: Kaltakquise per E-Mail (KW18+, erst nach Social Proof)

Erst nachdem du 2–3 Testnutzer hast und mindestens 1 Testimonial:

**Zielgruppe:** Kleine Kanzleien (1–10 Mitarbeiter) in Deutschland. Nutze Vibe Prospecting (bereits vorbereitet in der letzten Session) um Kontakte zu finden.

**E-Mail-Betreff:** "Mandantenunterlagen — 4 Stunden pro Woche gespart?"

**E-Mail-Text:**

> Guten Tag Herr/Frau [Name],
>
> ich schreibe Ihnen, weil ich von [Steuerberater X] gehört habe, dass das Einsammeln von Mandantenunterlagen viel Zeit kostet.
>
> Wir haben Clario gebaut — ein einfaches Portal, über das Ihre Mandanten Unterlagen direkt per Link hochladen, Fotos mit Qualitätsprüfung machen und Vollmachten digital unterschreiben. Kein Account nötig, kein DATEV-Vertrag.
>
> [Steuerberater X] nutzt Clario seit [Zeitraum] und spart damit ca. [X] Stunden pro Woche.
>
> Möchten Sie es 30 Tage kostenlos testen?
>
> Beste Grüße,
> Lennart Brodesser

### Conversion-Ziel für Monat 1–2:

| Kanal | Kontakte | Demos | Testnutzer | Zahlend |
|-------|----------|-------|------------|---------|
| Persönliches Netzwerk | 5 | 3 | 2 | 1 |
| LinkedIn | 150 | 8 | 4 | 2 |
| Events/Stammtische | 20 | 5 | 2 | 1 |
| Kaltakquise | 50 | 3 | 1 | 0–1 |
| **Gesamt** | **225** | **19** | **9** | **4–5** |

**Disclaimer:** Diese Zahlen sind Schätzungen basierend auf typischen B2B-SaaS-Conversion-Rates (10–15% Kontakt→Demo, 40–50% Demo→Test, 30–40% Test→Zahlung). Im deutschen Steuerberater-Markt könnte die Conversion höher sein (konservative Zielgruppe, aber wenn der Pain stimmt kaufen sie schnell) oder niedriger (Skepsis gegenüber neuen Tools). Die echten Zahlen wirst du erst nach den ersten 50 Kontakten kennen.

---

## 3. Pricing

### Preismodell

| | Starter | Pro | Kanzlei |
|---|---------|-----|---------|
| **Preis** | €49/Monat | €99/Monat | €199/Monat |
| **Mandanten** | bis 30 | bis 100 | unbegrenzt |
| **Checklisten-Vorlagen** | 3 (Standard) | Alle 7 + eigene erstellen | Alle 7 + eigene + Import |
| **Digitale Unterschrift** | ✓ | ✓ | ✓ |
| **KI-Bildprüfung** | 50 Prüfungen/Monat | 500/Monat | unbegrenzt |
| **Erinnerungen** | Manuell | Automatisch | Automatisch + individuelle Zeitpunkte |
| **Wiederkehrende Checklisten** | ✗ | ✓ | ✓ |
| **Support** | E-Mail | E-Mail + Chat | E-Mail + Chat + Onboarding-Call |
| **Jährlich** | €470/Jahr (20% Rabatt) | €950/Jahr | €1.900/Jahr |

### Begründung

**€49 Starter:** Deckt deine Kosten (Hosting + API) und ist für eine 1-Person-Kanzlei mit 20–30 Mandanten ein No-Brainer. Ein Steuerberater verdient durchschnittlich €3.000–€4.500 pro Mandant pro Jahr. €49/Monat für Zeitersparnis bei der Dokumentensammlung ist irrelevant im Vergleich zum Umsatz. Zum Vergleich: DATEV Meine Steuern ist im DATEV-Paket enthalten, aber das DATEV-Gesamtpaket kostet typischerweise €200–400/Monat. Du bist deutlich günstiger und einfacher.

**€99 Pro:** Der Sweet Spot. Die meisten Kanzleien mit 2–5 Mitarbeitern haben 50–100 Mandanten. Automatische Erinnerungen und wiederkehrende Checklisten sparen wöchentlich 3–5 Stunden. Bei einem Steuerfachangestellten-Stundensatz von ~35€ sind das €420–€700/Monat an Zeitersparnis. €99 ist ein 5–7x ROI.

**€199 Kanzlei:** Für größere Kanzleien (5–10 Mitarbeiter, 100+ Mandanten). Der Onboarding-Call macht den Unterschied — Steuerberater kaufen Vertrauen, nicht Features.

### Preisanker im Markt

- DATEV-Gesamtpaket: €200–400+/Monat (basierend auf verfügbaren Daten, exakte Preise nicht öffentlich)
- GetMyInvoices: ab €15/Monat (aber nur Belegerfassung, kein Mandantenportal)
- SmartTransfer: Preise nicht öffentlich verfügbar
- Clario-Positionierung: Günstiger als DATEV, mehr Features als GetMyInvoices, spezialisiert auf Dokumentensammlung + GwG-Onboarding

### Empfehlung für Launch

**Starte mit kostenlosem 30-Tage-Trial ohne Kreditkarte.** Danach entweder €49 oder €99. Den €199-Tier brauchst du erst wenn du 20+ Kunden hast und Support-Anfragen kommen. In der Frühphase: Biete den ersten 10 Kunden "Founding Member" Pricing an — 50% Rabatt dauerhaft (€25/€50/€100). Das schafft Loyalität und Testimonials.

---

## 4. Rechtliches

### Pflicht vor Go-Live (Blocker)

**1. Impressum (§5 TMG)**
- Vollständiger Name, Anschrift, Telefon, E-Mail
- Als Einzelunternehmer: dein Name + Adresse
- Umsatzsteuer-ID (beantrage eine beim Finanzamt falls nicht vorhanden)
- Falls du ein Gewerbe brauchst: Gewerbeanmeldung beim lokalen Gewerbeamt (~20–30€)

**2. Datenschutzerklärung (Art. 13 DSGVO)**
- Welche Daten werden verarbeitet (E-Mail, Name, Personalausweis-Fotos, Unterschriften)
- Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) für Kanzlei-Daten, Art. 6 Abs. 1 lit. f (berechtigtes Interesse) für Portal-Nutzung
- Auftragsverarbeiter: Supabase (Sitz: USA, aber Server in Frankfurt eu-central-1, Standard Contractual Clauses), Resend (E-Mail), Anthropic (KI-Bildprüfung)
- Speicherdauer, Löschfristen, Rechte der Betroffenen (Auskunft, Löschung, Widerspruch)

**3. Auftragsverarbeitungsvertrag (AVV) nach Art. 28 DSGVO**
- Du MUSST einen AVV mit Supabase haben. Supabase bietet einen Standard-DPA an: supabase.com/legal/dpa
- AVV mit Resend: resend.com/legal/dpa
- AVV mit Anthropic: anthropic.com/legal (prüfe ob DPA verfügbar ist, ggf. anfragen)
- TIPP: Downloade alle DPAs, lies sie, speichere sie ab. Falls ein Steuerberater danach fragt (und das werden sie), musst du die sofort zeigen können.

**4. Personalausweis-Verarbeitung (PersAuswG § 20)**
- Steuerberater dürfen Personalausweiskopien anfertigen unter GwG § 8 Abs. 2 (Geldwäsche-Compliance)
- Die Kopie MUSS als Kopie erkennbar sein (Wasserzeichen "KOPIE" oder Schwarz-Weiß)
- Du speicherst die Kopie im Auftrag der Kanzlei → AVV erforderlich
- Löschfrist: 5 Jahre nach Ende der Geschäftsbeziehung (GwG § 8 Abs. 4), dann sofortige Löschung
- EMPFEHLUNG: Baue ein automatisches Wasserzeichen "KOPIE" in die Foto-Upload-Funktion ein. Das zeigt Compliance-Bewusstsein und schützt dich.

**5. AGB / Nutzungsbedingungen**
- Für die Beta-Phase reicht eine einfache Seite mit:
  - Leistungsbeschreibung
  - Haftungsausschluss ("Beta-Phase, keine Gewährleistung für Verfügbarkeit")
  - Laufzeit und Kündigung
  - Gerichtsstand
- Für zahlende Kunden: Professionelle AGB über IT-Recht Kanzlei (ab ~30€/Monat) oder einmalig über einen Anwalt (500–1.500€)

### Pflicht nach erstem zahlenden Kunden

**6. Gewerbe / Rechtsform**
- Als Solofounder reicht ein Einzelunternehmen mit Gewerbeanmeldung
- Ab ~50.000€ Jahresumsatz: Überlege eine UG (haftungsbeschränkt) zu gründen — Kosten: ~500€ Notar + 1€ Stammkapital
- GmbH erst wenn du Investoren aufnimmst oder > €100.000 Umsatz machst

**7. Buchhaltung**
- Umsatzsteuer: 19% auf SaaS in Deutschland (B2B = Reverse Charge bei EU-Kunden)
- Kleinunternehmerregelung möglich bis 25.000€ Jahresumsatz (seit 2025 auf 25.000€ angehoben, basierend auf verfügbaren Daten — bitte verifizieren da sich Grenzen ändern können)
- Rechnungsstellung: Stripe generiert Rechnungen automatisch. Stelle sicher dass alle Pflichtangaben drauf sind.

**8. IT-Sicherheitskonzept (optional aber empfohlen)**
- Steuerberater werden danach fragen. Erstelle ein 2-Seiten-Dokument das beschreibt:
  - Datenverschlüsselung (Supabase = TLS in Transit, AES-256 at Rest)
  - Serverstandort Frankfurt (eu-central-1)
  - RLS (Row Level Security) — Daten einer Kanzlei sind für andere unsichtbar
  - Backup-Strategie (Supabase Pro: tägliche Backups, 7 Tage Retention)
  - Kein Mitarbeiter-Zugriff auf Kundendaten

### Disclaimer

**Ich bin kein Anwalt.** Die obigen Punkte basieren auf öffentlich verfügbaren Informationen und meiner Recherche. Für Punkte 3 (AVV), 4 (PersAuswG) und 7 (Steuer) empfehle ich dringend, einen auf IT-Recht spezialisierten Anwalt zu konsultieren. Kosten: ~200–400€ für eine Erstberatung, die dir konkret sagt was du für Clario brauchst. Das ist gut investiertes Geld.

---

## 5. Feature-Roadmap (Monat 3–6, ab Juni 2026)

### Priorität 1: Was Kunden verlangen werden (basierend auf typischen Steuerberater-Workflows)

**5.1 Dokument-Ablehnung durch Kanzlei (KW22–KW24)**
- Kanzlei kann hochgeladene Dokumente ablehnen mit Begründung
- Mandant bekommt E-Mail: "Ihr Dokument 'Steuerbescheid 2025' wurde abgelehnt. Grund: Seite 2 fehlt."
- Status im Portal wechselt von "Hochgeladen" zurück zu "Ausstehend"
- **Warum:** Ohne das müssen Kanzleien per E-Mail nachfragen — das ist genau das Chaos das Clario lösen soll
- **Impact:** Hoch. Das wird die #1-Feature-Anfrage sein.

**5.2 DATEV-Export / Schnittstelle (KW24–KW28)**
- Exportiere gesammelte Dokumente im DATEV-kompatiblen Format
- Minimumm: ZIP-Download mit Ordnerstruktur die DATEV DMS importieren kann
- Idealerweise: DATEV XML-Schnittstelle (DATEVconnect)
- **Warum:** 80%+ der Kanzleien nutzen DATEV. Ohne Export müssen sie Dateien manuell in DATEV laden. Die Zeitersparnis halbiert sich.
- **Impact:** Sehr hoch. Kann zum Kaufentscheidungs-Faktor werden.
- **Aufwand:** Hoch. DATEV-Schnittstellen sind komplex und schlecht dokumentiert. Rechne mit 4–6 Wochen.

**5.3 Mandanten-Ansicht für Kanzlei (KW24–KW26)**
- Kanzlei kann sehen was der Mandant im Portal sieht (Preview-Modus)
- Hilfreich für Support: "Ich sehe nicht wo ich hochladen soll" → Kanzlei kann es sehen
- **Warum:** Reduziert Support-Aufwand für die Kanzlei
- **Impact:** Mittel. Nützlich aber nicht kritisch.

### Priorität 2: Wachstums-Features

**5.4 Automatische Erinnerungen per WhatsApp (KW26–KW28)**
- Integration über WhatsApp Business API (z.B. über Twilio oder 360dialog)
- Mandanten öffnen WhatsApp 10x öfter als E-Mail
- **Warum:** E-Mail-Erinnerungen werden ignoriert. WhatsApp hat 90%+ Öffnungsrate.
- **Impact:** Hoch für Conversion. Kann USP werden ("Das einzige Portal mit WhatsApp-Erinnerungen").
- **Kosten:** WhatsApp Business API: ca. €0,05–0,10 pro Nachricht (Conversation-based pricing)
- **Risiko:** WhatsApp Business API Approval dauert 2–4 Wochen. Template-Nachrichten müssen genehmigt werden.

**5.5 Mehrsprachigkeit (KW28–KW30)**
- Portal-Oberfläche auf Türkisch, Russisch, Arabisch, Englisch
- **Warum:** Viele Mandanten in Deutschland sprechen nicht fließend Deutsch. Ein Portal das sie in ihrer Sprache anspricht ist ein massiver Vorteil.
- **Impact:** Mittel-Hoch. Differenzierung gegenüber allen Wettbewerbern.

**5.6 Kanzlei-Branding / White-Label (KW30–KW32)**
- Kanzlei kann eigenes Logo, Farben, E-Mail-Header einstellen
- Portal-URL: `portal.kanzlei-mueller.de` statt `app.clario.de/portal/...`
- **Warum:** Steuerberater wollen ihren Mandanten gegenüber professionell auftreten, nicht das Tool eines Drittanbieters zeigen.
- **Impact:** Mittel. Für den €199-Tier ein Upsell-Argument.

### Priorität 3: Nice-to-Have (erst ab 50+ Kunden)

- **5.7** Chat zwischen Kanzlei und Mandant im Portal (wie ein Mini-Messenger)
- **5.8** OCR / automatische Dokumentenerkennung (z.B. Steuerbescheid → Felder automatisch extrahieren)
- **5.9** Dashboard-Analytics für die Kanzlei (durchschnittliche Bearbeitungszeit, Top-Nachzügler etc.)
- **5.10** API für Integration in bestehende Kanzlei-Software (neben DATEV: ADDISON, Agenda, Simba)

---

## 6. Finanzplan

### Monatliche Kosten (realistisch)

| Posten | Kosten/Monat | Anmerkung |
|--------|-------------|-----------|
| Supabase Pro | ~€115 | $125 (Base + Micro Compute) |
| Vercel Pro | ~€18 | $20/Seat |
| Resend Pro | ~€18 | $20 (50K Mails reichen für Start) |
| Claude API (Sonnet) | ~€20–50 | Geschätzt: 500 Bildprüfungen × ~€0,05 = €25. Stark abhängig von Nutzung. |
| Domain | ~€1 | €12/Jahr |
| E-Mail (eigene Domain) | ~€5 | z.B. Zoho Mail oder Google Workspace |
| **Gesamt Infrastruktur** | **~€180** | |

### Einmalige Kosten

| Posten | Kosten | Wann |
|--------|--------|------|
| Domain-Registrierung | €12–30 | KW14 |
| Gewerbeanmeldung | €20–30 | KW15 |
| AGB (IT-Recht Kanzlei) | €30/Monat | Ab erstem zahlendem Kunden |
| Anwalt Erstberatung | €200–400 | KW16–17 (empfohlen) |
| Steuerberaterkongress Ticket | ~€300–500 | Mai 2026 |
| Visitenkarten + Flyer | €50–100 | KW17 |
| **Gesamt einmalig** | **~€650–1.100** | |

### Revenue-Projektion (konservativ)

| Monat | Kunden | MRR | Kosten | Netto |
|-------|--------|-----|--------|-------|
| Apr 2026 (KW14–17) | 0 (Beta) | €0 | €180 | -€180 |
| Mai 2026 (KW18–22) | 2 (Founding) | €75 | €180 | -€105 |
| Jun 2026 (KW23–26) | 5 | €250 | €200 | +€50 |
| Jul 2026 (KW27–30) | 8 | €500 | €200 | +€300 |
| Aug 2026 (KW31–35) | 12 | €800 | €220 | +€580 |
| Sep 2026 (KW36–39) | 18 | €1.200 | €250 | +€950 |
| **Breakeven:** | **~Monat 3** | **~€200 MRR** | | |

**Annahmen:**
- Founding Members zahlen 50% → durchschnittlich ~€37/Monat
- Normale Kunden: Mix aus Starter (€49) und Pro (€99) → durchschnittlich ~€70/Monat
- Churn: 5–8% pro Monat in der Frühphase (typisch für B2B-SaaS im ersten Jahr)
- Infrastrukturkosten steigen leicht mit Nutzung (Supabase Storage, Claude API)

**Wann lohnt es sich:**
- Ab 3 Kunden deckst du deine Infrastruktur
- Ab 10 Kunden hast du ~€700/Monat Gewinn — genug für einen Nebenjob-Modus
- Ab 30 Kunden (~€2.100/Monat) wird es ein tragfähiges Vollzeit-Einkommen
- Ab 100 Kunden (~€7.000/Monat) bist du im "echten SaaS"-Territorium

**Unsicherheit:** Diese Zahlen sind Schätzungen. Die tatsächlichen Wachstumsraten hängen stark davon ab, ob der Product-Market-Fit stimmt. Die ersten 5 Gespräche mit Steuerberatern werden dir zeigen, ob die Projektion realistisch, optimistisch oder pessimistisch ist.

---

## 7. Risiken

### Risiko 1: Kein Product-Market-Fit

**Wahrscheinlichkeit:** Mittel (30–40%)
**Beschreibung:** Steuerberater sagen "nett, aber ich bleib bei E-Mail" oder "DATEV reicht mir".
**Indikatoren:** Weniger als 3 Testnutzer nach 50 LinkedIn-Kontakten. Demo-Gespräche führen nicht zu Anmeldungen.
**Plan B:**
- Pivote den Fokus: Statt "Dokumentensammlung allgemein" → fokussiere NUR auf GwG-Onboarding. Das ist gesetzliche Pflicht, kein Nice-to-Have.
- Oder: Repositioniere als "WhatsApp-Alternative für Kanzlei-Mandant-Kommunikation" (breiterer Use Case).
- Oder: Teste andere Branchen mit ähnlichem Problem (Anwaltskanzleien, Immobilienmakler, Finanzberater).

### Risiko 2: DATEV baut das gleiche Feature

**Wahrscheinlichkeit:** Hoch (60%+ langfristig)
**Beschreibung:** DATEV hat "Meine Steuern" bereits. Wenn sie die UX verbessern und GwG-Features einbauen, wird es schwer zu konkurrieren.
**Plan B:**
- Geschwindigkeit. Du bist schneller als DATEV (die brauchen 12–24 Monate für neue Features).
- Fokus auf UX und Mandanten-Experience. DATEV ist für Steuerberater gebaut, Clario für Mandanten.
- Nische verteidigen: Kleine Kanzleien die kein DATEV nutzen wollen/können (~30% des Markts basierend auf Nicht-DATEV-Nutzern).
- Langfristig: Werde das "Portal-Layer" über DATEV — integriere dich mit DATEV statt gegen sie zu kämpfen.

### Risiko 3: Sicherheitsvorfall / Datenleck

**Wahrscheinlichkeit:** Niedrig-Mittel (wenn Security Fixes implementiert sind)
**Beschreibung:** Personalausweis-Fotos oder Steuerunterlagen werden geleakt. Im deutschen Markt wäre das der Todesstoß.
**Prävention:**
- Security Fixes aus `SECURITY-FIX-PROMPT.md` SOFORT implementieren
- Penetration-Test beauftragen sobald du 10+ Kunden hast (Kosten: ~2.000–5.000€ für einen Basis-Pentest)
- Cyber-Versicherung abschließen (~30–50€/Monat für Startups)
**Plan B bei Vorfall:**
- Sofortige Transparenz (DSGVO Art. 33: 72 Stunden Meldefrist an Datenschutzbehörde)
- Kunden direkt informieren
- Incident-Postmortem veröffentlichen
- Externe Sicherheitsfirma beauftragen

### Risiko 4: Abhängigkeit von Supabase

**Wahrscheinlichkeit:** Niedrig
**Beschreibung:** Supabase erhöht Preise drastisch, geht offline, oder stellt den Service ein.
**Plan B:** Supabase ist Open Source. Du kannst jederzeit selbst hosten (auf Hetzner Cloud, ~€30/Monat für einen Server). PostgreSQL + PostgREST + GoTrue — alle Komponenten sind einzeln deploybar.

### Risiko 5: Solo-Founder-Burnout

**Wahrscheinlichkeit:** Hoch (70%+)
**Beschreibung:** Du machst alles allein: Code, Sales, Support, Legal, Marketing. Das ist nicht nachhaltig ab 20+ Kunden.
**Plan B:**
- Ab 15 Kunden: Stelle einen Werkstudenten ein für Support (€500–800/Monat)
- Ab 30 Kunden: Überlege einen technischen Co-Founder zu finden
- Oder: Nutze Claude / KI-Tools maximal für alles was automatisierbar ist (Support-Antworten, Content, Code)
- Setze dir feste Arbeitszeiten. Steuerberater arbeiten 9–18 Uhr. Dein Support muss nicht 24/7 sein.

### Risiko 6: Rechtliche Unsicherheit bei digitaler Signatur

**Wahrscheinlichkeit:** Niedrig-Mittel
**Beschreibung:** Ein Finanzamt oder eine Aufsichtsbehörde erkennt die einfache elektronische Signatur nicht an.
**Kontext:** Die eIDAS-Verordnung definiert 3 Stufen: einfache, fortgeschrittene, qualifizierte Signatur. Clario nutzt eine einfache elektronische Signatur. Für Vollmachten und Datenschutzerklärungen in der Steuerberatung ist das nach aktuellem Kenntnisstand ausreichend — aber das ist keine Rechtsberatung.
**Plan B:**
- Implementiere einen Disclaimer: "Diese digitale Unterschrift dient der Dokumentation und ersetzt nicht eine qualifizierte elektronische Signatur wo gesetzlich vorgeschrieben."
- Falls nötig: Integriere einen qualifizierten Signatur-Anbieter wie sign-me (Bundesdruckerei) oder Swisscom Sign. Kosten: ~€0,50–2,00 pro Signatur.

---

## Zusammenfassung: Die nächsten 4 Wochen

| KW | Fokus | Ergebnis |
|----|-------|----------|
| **KW14** | Security Fixes + erster Browsertest + Hosting | App läuft auf eigener Domain |
| **KW15** | Stripe + Landing Page + Impressum/DSGVO | Registrierung und Zahlung möglich |
| **KW16** | LinkedIn-Outreach starten (10/Tag) + Netzwerk ansprechen | Erste 3 Demo-Termine |
| **KW17** | Demos halten + Feedback einarbeiten | Erste 2 Testnutzer |

**Dein Nordstern:** Am 5. Mai stehst du auf dem Deutschen Steuerberaterkongress in Berlin mit einer funktionierenden App, 3–5 Testnutzern, und einer Story die du erzählen kannst.

---

*Dieser Plan basiert auf recherchierten Marktdaten (53.803 Kanzleien lt. Bundessteuerberaterkammer 2025, DATEV-Marktstellung, Preise von Supabase/Vercel/Resend/Claude API Stand März 2026) sowie auf Schätzungen und Annahmen wo keine exakten Daten verfügbar waren. Zahlen zu Conversion-Rates, Revenue-Projektion und Zeitaufwänden sind Schätzungen die durch echte Marktvalidierung überprüft werden müssen.*
