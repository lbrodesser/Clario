# Clario — Business-Plan & Go-to-Market erstellen

## Deine Rolle
Du bist ein erfahrener SaaS-Berater und Startup-Stratege mit Fokus auf B2B-Software für den deutschen Markt. Du erstellst einen konkreten, umsetzbaren Plan — keine Theorie, keine Buzzwords. Jeder Punkt hat ein Datum, einen Verantwortlichen und ein messbares Ergebnis.

## Was ist Clario?
Clario ist ein **Mandantenportal für deutsche Steuerkanzleien**. Es löst ein konkretes Problem: Kanzleien brauchen Unterlagen von ihren Mandanten (Steuerbescheide, Personalausweise, unterschriebene Vollmachten etc.), und der aktuelle Prozess ist E-Mail-Chaos, WhatsApp-Fotos und verlorene Dokumente.

### Was Clario heute kann (MVP ist code-seitig fertig):
- **Kanzlei-Dashboard**: Mandanten verwalten, Checklisten aus Vorlagen erstellen, Fortschritt tracken (Ampelsystem)
- **7 vorgefertigte Checklisten-Vorlagen**: Einkommensteuer, EUER, GmbH Jahresabschluss, Finanzbuchhaltung Monatlich, Lohnbuchhaltung Monatlich, GwG Neumandant Onboarding, Photovoltaik
- **Portal für Mandanten** (kein Account nötig, Link-basiert): Dokumente hochladen, Fotos mit Qualitätsprüfung (KI), Formular-Fragebogen ausfüllen
- **Digitale Unterschrift**: Mandant sieht Vollmacht/Datenschutz als PDF, unterschreibt mit Finger (Mobile) oder Maus, signiertes PDF wird automatisch generiert
- **GwG-Onboarding**: Personalausweis (Vorder-/Rückseite), Vollmacht, Datenschutzerklärung — alles digital
- **KI-Features**: Bildqualitätsprüfung für Dokument-Fotos, "Wo finde ich das?"-Hilfe für Mandanten
- **Erinnerungssystem**: Automatische E-Mails (14 Tage, 7 Tage, 3 Tage vor Frist)
- **Wiederkehrende Checklisten**: Monatlich/quartalsweise/jährlich automatisch erstellen
- **Security**: RLS-Policies, Datei-Validierung mit Magic Bytes, Rate Limiting, Portal-Token-Absicherung

### Tech-Stack:
React 19 + TypeScript + Vite + Supabase (PostgreSQL + Auth + Storage + Edge Functions) + shadcn/ui + TanStack Query + pdf-lib + Resend (E-Mail) + Claude API (KI)

### Was NICHT fertig ist:
- App wurde noch nie im Browser getestet (Code kompiliert und baut, aber kein manueller Test)
- Stripe-Integration existiert als Platzhalter (Subscription-Management), aber keine Preise/Checkout
- Kein Hosting/Domain eingerichtet
- Kein Impressum/DSGVO/AGB
- Kein Landing Page
- Keine echten Kunden

### Zielgruppe:
- ~50.000 Steuerkanzleien in Deutschland
- Typische Kanzlei hat 1-10 Steuerberater und 50-500 Mandanten
- Pain Point: Dokumentensammlung frisst Zeit, Mandanten reagieren nicht auf E-Mails, GwG-Compliance ist Pflicht
- Budgetbereitschaft: 29-99€/Monat für Zeitersparnis ist ein No-Brainer

### Wettbewerb:
- DATEV (Marktführer, aber monolithisch und teuer)
- Taxdoo, GetMyInvoices (Fokus auf Belege, nicht Mandanten-Onboarding)
- SmartTransfer (ähnlich, aber weniger Features)
- Die meisten Kanzleien nutzen: E-Mail + Excel + DATEV-Upload-Portal

## Was ich von dir brauche

Erstelle einen konkreten Plan mit folgenden Abschnitten:

### 1. Sofort-Aktionen (diese Woche)
Was muss JETZT passieren damit die App live gehen kann? Priorisiert. Mit konkreten Schritten (nicht "richte Hosting ein" sondern "gehe zu vercel.com, erstelle Account, verbinde GitHub Repo, setze Environment Variables X, Y, Z").

### 2. Go-to-Market (Monat 1-2)
Wie finde ich die ersten 5 zahlenden Kunden? Keine Theorie. Konkrete Taktiken für den deutschen Steuerberater-Markt. Wo sind die? Wie erreiche ich die? Was sage ich denen?

### 3. Pricing
Was kostet Clario? Preismodell mit Stufen. Begründe jede Stufe mit dem Wert den sie liefert. Vergleiche mit Wettbewerb.

### 4. Rechtliches
Was brauche ich rechtlich in Deutschland um eine SaaS zu betreiben die Personalausweise und Steuerunterlagen verarbeitet? Konkrete Checkliste.

### 5. Feature-Roadmap (Monat 3-6)
Was baue ich als nächstes NACHDEM ich die ersten Kunden habe? Priorisiert nach Kundenwert, nicht nach technischer Eleganz. Jedes Feature mit "Warum" und "Erwarteter Impact".

### 6. Finanzplan
Realistische Kostenaufstellung (Hosting, APIs, Rechtliches, Marketing) vs. erwartete Einnahmen. Ab wann Breakeven?

### 7. Risiken
Was kann schiefgehen? Und was ist der Plan B?

## Regeln für deinen Output
- Konkret, nicht abstrakt. "Gehe zu X, klicke Y, schreibe Z" statt "evaluiere Optionen".
- Deutsche Rechtslage, deutscher Markt, deutsche Sprache.
- Keine Feature-Wünsche die den MVP aufblähen. Der Code ist fertig genug.
- Zeitangaben in absoluten Wochen (KW14, KW15 etc.) ab heute (26.03.2026).
- Zahlen wo möglich (Kosten in €, erwartete Conversions in %).
