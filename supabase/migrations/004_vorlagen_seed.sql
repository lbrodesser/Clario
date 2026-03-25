-- Vorlagen Seed: Checklisten-Vorlagen mit Dokumenten

-- 1. Einkommensteuererklaerung Privatperson
DO $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO vorlage_checklisten (name, beschreibung, mandant_typ, leistungsbereich, checkliste_typ)
  VALUES ('Einkommensteuererklaerung', 'Jaehrliche Einkommensteuererklaerung fuer Privatpersonen', 'privatperson', 'steuererklaerung', 'einmalig')
  RETURNING id INTO v_id;

  INSERT INTO vorlage_dokumente (vorlage_checkliste_id, titel, beschreibung, tipp_basis, pflicht, eingabe_typ, einheit, sortierung, haeufig_vergessen) VALUES
  (v_id, 'Lohnsteuerbescheinigung', 'Vom Arbeitgeber ausgestellte Jahresbescheinigung', 'Ihr Arbeitgeber stellt Ihnen die Lohnsteuerbescheinigung bis Ende Februar zu. Sie finden diese oft im Lohnportal Ihres Arbeitgebers oder sie wird Ihnen per Post zugeschickt. Suchen Sie nach einem Dokument mit der Ueberschrift "Ausdruck der elektronischen Lohnsteuerbescheinigung".', true, 'datei_upload', NULL, 1, 4),
  (v_id, 'Steuer-Identifikationsnummer', '11-stellige Nummer vom Bundeszentralamt fuer Steuern', 'Ihre Steuer-ID finden Sie auf jedem Einkommensteuerbescheid, auf Ihrer Lohnsteuerbescheinigung oder auf dem Schreiben des Bundeszentralamts fuer Steuern. Sie ist 11 Ziffern lang und aendert sich nie.', true, 'text_eingabe', NULL, 2, 2),
  (v_id, 'IBAN Bankverbindung', 'Fuer Steuererstattung', 'Ihre IBAN finden Sie auf Ihrer Bankkarte, im Online-Banking unter Kontodetails oder auf Ihren Kontoauszuegen.', true, 'text_eingabe', NULL, 3, 2),
  (v_id, 'Homeoffice-Tage', 'Anzahl der Tage im Homeoffice', 'Zaehlen Sie die Tage, an denen Sie ueberwiegend von zu Hause gearbeitet haben. Nutzen Sie Ihren Kalender oder Zeiterfassung als Hilfe. Seit 2023 koennen bis zu 210 Tage a 6 Euro angesetzt werden.', true, 'zahl_eingabe', 'Tage', 4, 3),
  (v_id, 'Riester-Bescheinigung', 'Jaehrliche Bescheinigung nach §92 EStG', 'Ihre Riester-Bescheinigung wird Ihnen von Ihrem Anbieter (z.B. Versicherung oder Bank) automatisch per Post zugeschickt, meist im Februar/Maerz. Alternativ finden Sie diese im Online-Portal Ihres Anbieters unter Dokumenten/Bescheinigungen.', false, 'datei_upload', NULL, 5, 4),
  (v_id, 'Krankenversicherung Jahresbescheinigung', 'Bescheinigung ueber gezahlte Beitraege', 'Ihre Krankenkasse sendet Ihnen die Bescheinigung automatisch per Post oder stellt sie im Online-Portal bereit. Suchen Sie unter "Meine Dokumente" oder "Bescheinigungen" in der App/Webseite Ihrer Krankenkasse.', true, 'datei_upload', NULL, 6, 5),
  (v_id, 'Einkommensteuerbescheid Vorjahr', 'Bescheid vom Finanzamt aus dem Vorjahr', 'Den Steuerbescheid erhalten Sie vom Finanzamt per Post oder, wenn Sie ELSTER nutzen, digital in Ihrem ELSTER-Postfach unter www.elster.de. Melden Sie sich an und schauen Sie unter "Mein ELSTER" > "Bescheide".', true, 'datei_upload', NULL, 7, 3),
  (v_id, 'Fahrtstrecke zur Arbeit', 'Einfache Entfernung Wohnung - Arbeitsstaette', 'Messen Sie die kuerzeste Strassenverbindung zwischen Ihrer Wohnung und Ihrem Arbeitsplatz. Nutzen Sie Google Maps oder einen Routenplaner und waehlen Sie die kuerzeste Route (nicht die schnellste).', true, 'zahl_eingabe', 'km', 8, 2),
  (v_id, 'Anzahl Arbeitstage', 'Tatsaechliche Arbeitstage im Jahr (abzgl. Urlaub, Krankheit)', 'Zaehlen Sie Ihre tatsaechlichen Arbeitstage: Werktage minus Urlaub minus Krankheitstage minus Feiertage. Als Faustregel: bei 5-Tage-Woche ca. 230 Tage minus Urlaub minus Krankheit.', true, 'zahl_eingabe', 'Tage', 9, 3);
END $$;

-- 2. EUER Freiberufler
DO $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO vorlage_checklisten (name, beschreibung, mandant_typ, leistungsbereich, checkliste_typ)
  VALUES ('Einnahmen-Ueberschuss-Rechnung Freiberufler', 'EUER und Steuererklaerung fuer Freiberufler und Selbststaendige', 'freiberufler', 'steuererklaerung', 'einmalig')
  RETURNING id INTO v_id;

  INSERT INTO vorlage_dokumente (vorlage_checkliste_id, titel, beschreibung, tipp_basis, pflicht, eingabe_typ, mehrdatei_erlaubt, sortierung, haeufig_vergessen) VALUES
  (v_id, 'Kontoauszuege Geschaeftskonto', 'Alle Monate des Jahres', 'Laden Sie alle monatlichen Kontoauszuege Ihres Geschaeftskontos herunter. Im Online-Banking finden Sie diese unter "Kontoauszuege" oder "Dokumente". Exportieren Sie als PDF. Achten Sie darauf, dass alle 12 Monate lueckenlos vorhanden sind.', true, 'datei_upload', true, 1, 5),
  (v_id, 'Ausgangsrechnungen', 'Alle gestellten Rechnungen des Jahres', 'Sammeln Sie alle Rechnungen, die Sie im Jahr an Kunden gestellt haben. Falls Sie ein Rechnungsprogramm nutzen (z.B. sevDesk, lexoffice, Debitoor), exportieren Sie alle Rechnungen als PDF.', true, 'datei_upload', true, 2, 4),
  (v_id, 'Eingangsrechnungen', 'Alle erhaltenen Rechnungen und Belege', 'Sammeln Sie alle Rechnungen fuer geschaeftliche Ausgaben: Bueromate rial, Software-Abos, Fachliteratur, Reisen etc. Fotografieren Sie Papierbelege oder laden Sie digitale Rechnungen aus E-Mails hoch.', true, 'datei_upload', true, 3, 5),
  (v_id, 'Fahrtenbuch', 'Bei geschaeftlicher Nutzung eines PKW', 'Wenn Sie ein Fahrtenbuch fuehren, laden Sie es hier hoch. Alternativ koennen Sie die pauschale Kilometerabrechnung nutzen (0,30 Euro/km). Das Fahrtenbuch muss Datum, Ziel, Zweck, gefahrene km und Kilometerstand enthalten.', false, 'datei_upload', false, 4, 3),
  (v_id, 'Reisekostenaufstellung', 'Geschaeftsreisen mit Belegen', 'Listen Sie alle Geschaeftsreisen auf mit: Datum, Ziel, Anlass, Dauer, gefahrene km oder Fahrtkosten. Fuegen Sie Hotelrechnungen und Bewirtungsbelege bei. Bei Abwesenheit >8h stehen Ihnen Verpflegungspauschalen zu.', false, 'kombination', false, 5, 3);

  -- Kombinations-Typen fuer Reisekosten setzen
  UPDATE vorlage_dokumente SET kombination_typen = '["text_eingabe", "datei_upload"]'::jsonb WHERE vorlage_checkliste_id = v_id AND titel = 'Reisekostenaufstellung';
END $$;

-- 3. GmbH Jahresabschluss
DO $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO vorlage_checklisten (name, beschreibung, mandant_typ, leistungsbereich, checkliste_typ)
  VALUES ('GmbH Jahresabschluss', 'Jahresabschluss und Steuererklaerung fuer Kapitalgesellschaften', 'gmbh_ug', 'jahresabschluss', 'einmalig')
  RETURNING id INTO v_id;

  INSERT INTO vorlage_dokumente (vorlage_checkliste_id, titel, beschreibung, tipp_basis, pflicht, eingabe_typ, mehrdatei_erlaubt, sortierung, haeufig_vergessen) VALUES
  (v_id, 'Bankkontoauszuege alle Konten', 'Jahresauszuege aller Geschaeftskonten', 'Laden Sie die Kontoauszuege aller Bankkonten der GmbH herunter — Geschaeftskonto, Tagesgeld, Festgeld etc. Im Business-Banking finden Sie diese unter "Kontoauszuege" > "Jahresauszug". PDF-Export bevorzugt.', true, 'datei_upload', true, 1, 5),
  (v_id, 'OPOS-Liste Debitoren', 'Offene Posten Forderungen zum Stichtag', 'Die OPOS-Liste (Offene-Posten-Liste) zeigt alle noch nicht bezahlten Ausgangsrechnungen zum 31.12. Exportieren Sie diese aus Ihrer Buchhaltungssoftware (DATEV, lexoffice, sevDesk) unter "Auswertungen" > "Offene Posten" > "Debitoren".', true, 'datei_upload', false, 2, 4),
  (v_id, 'OPOS-Liste Kreditoren', 'Offene Posten Verbindlichkeiten zum Stichtag', 'Die Kreditoren-OPOS-Liste zeigt alle noch nicht bezahlten Eingangsrechnungen zum 31.12. Export aus Ihrer Buchhaltungssoftware unter "Auswertungen" > "Offene Posten" > "Kreditoren".', true, 'datei_upload', false, 3, 4),
  (v_id, 'Inventurliste', 'Bestandsaufnahme Warenbestand zum 31.12.', 'Erstellen Sie eine Inventurliste mit allen Waren, Rohstoffen und unfertigen Erzeugnissen zum 31.12. Format: Artikelbezeichnung, Menge, Einzelpreis, Gesamtwert. Excel oder PDF.', true, 'datei_upload', false, 4, 3),
  (v_id, 'Summen- und Saldenliste', 'SuSa zum Jahresende', 'Die Summen- und Saldenliste (SuSa) ist eine Uebersicht aller Konten mit Anfangsbestand, Soll-/Haben-Umsaetzen und Saldo. Exportieren Sie diese aus DATEV unter "Auswertungen" > "Summen und Salden" fuer den Zeitraum 01.01.-31.12.', true, 'datei_upload', false, 5, 3);
END $$;

-- 4. Finanzbuchhaltung Monatlich
DO $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO vorlage_checklisten (name, beschreibung, mandant_typ, leistungsbereich, checkliste_typ)
  VALUES ('Finanzbuchhaltung Monatlich', 'Monatliche Buchhaltungsunterlagen', 'kleingewerbe', 'finanzbuchhaltung', 'wiederkehrend')
  RETURNING id INTO v_id;

  INSERT INTO vorlage_dokumente (vorlage_checkliste_id, titel, beschreibung, tipp_basis, pflicht, eingabe_typ, mehrdatei_erlaubt, sortierung, haeufig_vergessen) VALUES
  (v_id, 'Eingangsrechnungen', 'Alle erhaltenen Rechnungen des Monats', 'Sammeln Sie alle Rechnungen, die Sie diesen Monat erhalten haben. Fotografieren Sie Papierbelege mit dem Handy — achten Sie auf gute Beleuchtung und dass alle Ecken sichtbar sind.', true, 'datei_upload', true, 1, 5),
  (v_id, 'Ausgangsrechnungen', 'Alle gestellten Rechnungen des Monats', 'Laden Sie alle Rechnungen hoch, die Sie diesen Monat an Kunden geschickt haben. Bei Nutzung eines Rechnungsprogramms: Export als PDF.', true, 'datei_upload', true, 2, 4),
  (v_id, 'Kontoauszug', 'Kontoauszug des Geschaeftskontos fuer den Monat', 'Laden Sie den monatlichen Kontoauszug aus Ihrem Online-Banking herunter. Unter "Kontoauszuege" oder "Dokumente" > PDF herunterladen.', true, 'datei_upload', true, 3, 5),
  (v_id, 'Kassenbuch', 'Kassenaufzeichnungen bei Bargeschaeften', 'Falls Sie Bareinnahmen oder -ausgaben haben: Fuehren Sie ein Kassenbuch mit Datum, Einnahme/Ausgabe, Betrag und Beleg-Nr. Laden Sie die monatliche Zusammenfassung hoch.', false, 'datei_upload', false, 4, 3),
  (v_id, 'Bewirtungsbelege', 'Geschaeftsessen mit Angabe der Teilnehmer und Anlass', 'Fuer jeden Bewirtungsbeleg muessen Sie angeben: Datum, Ort, Teilnehmer, geschaeftlicher Anlass, Hoehe der Kosten. Fotografieren Sie die Rechnung und notieren Sie die Angaben auf der Rueckseite oder hier im Textfeld.', false, 'kombination', false, 5, 4);

  UPDATE vorlage_dokumente SET kombination_typen = '["datei_upload", "text_eingabe"]'::jsonb WHERE vorlage_checkliste_id = v_id AND titel = 'Bewirtungsbelege';
END $$;

-- 5. Lohnbuchhaltung Monatlich
DO $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO vorlage_checklisten (name, beschreibung, mandant_typ, leistungsbereich, checkliste_typ)
  VALUES ('Lohnbuchhaltung Monatlich', 'Monatliche Unterlagen fuer Lohn- und Gehaltsabrechnung', 'gmbh_ug', 'lohnbuchhaltung', 'wiederkehrend')
  RETURNING id INTO v_id;

  INSERT INTO vorlage_dokumente (vorlage_checkliste_id, titel, beschreibung, tipp_basis, pflicht, eingabe_typ, einheit, sortierung, haeufig_vergessen) VALUES
  (v_id, 'Arbeitsstunden-Tabelle', 'Uebersicht der geleisteten Stunden aller Mitarbeiter', 'Erstellen Sie eine Tabelle mit: Mitarbeitername, regulaere Stunden, Ueberstunden, ggf. Kurzarbeitsstunden. Bei Minijobs und Teilzeit besonders wichtig wegen der Stundengrenze. Excel oder PDF.', true, 'datei_upload', NULL, 1, 4),
  (v_id, 'Krankheitstage', 'Gesamtzahl Krankheitstage aller Mitarbeiter im Monat', 'Zaehlen Sie die Krankheitstage pro Mitarbeiter zusammen. Bei Krankheit >3 Tage benoetigen Sie eine AU-Bescheinigung. Die Gesamtzahl reicht hier — Details besprechen wir bei Bedarf.', true, 'zahl_eingabe', 'Tage', 2, 3),
  (v_id, 'Urlaubstage', 'Gesamtzahl genommener Urlaubstage im Monat', 'Tragen Sie die Summe aller genommenen Urlaubstage Ihrer Mitarbeiter fuer diesen Monat ein.', true, 'zahl_eingabe', 'Tage', 3, 2);
END $$;

-- 6. GwG Neumandant Onboarding
DO $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO vorlage_checklisten (name, beschreibung, mandant_typ, leistungsbereich, checkliste_typ)
  VALUES ('GwG Neumandant Onboarding', 'Pflichtdokumente bei Mandatsaufnahme (Geldwaeschegesetz)', 'privatperson', 'onboarding', 'einmalig')
  RETURNING id INTO v_id;

  INSERT INTO vorlage_dokumente (vorlage_checkliste_id, titel, beschreibung, tipp_basis, pflicht, eingabe_typ, sortierung, haeufig_vergessen) VALUES
  (v_id, 'Personalausweis (Vorder- und Rueckseite)', 'Zur Identifizierung nach GwG', 'Fotografieren Sie Ihren Personalausweis: Erst die Vorderseite, dann die Rueckseite. Legen Sie den Ausweis auf einen dunklen, einfarbigen Hintergrund. Achten Sie darauf, dass alle vier Ecken sichtbar sind und kein Blitz spiegelt.', true, 'datei_upload', 1, 5),
  (v_id, 'Vollmacht unterschrieben', 'Steuerberatervollmacht', 'Wir haben Ihnen die Vollmacht per E-Mail oder Post zugeschickt. Bitte drucken Sie diese aus, unterschreiben Sie auf der markierten Linie und fotografieren oder scannen Sie das unterschriebene Dokument.', true, 'datei_upload', 2, 4),
  (v_id, 'Datenschutzerklaerung unterschrieben', 'DSGVO-Einwilligung', 'Die Datenschutzerklaerung wurde Ihnen zusammen mit der Vollmacht zugeschickt. Bitte unterschreiben und hochladen — genau wie bei der Vollmacht.', true, 'datei_upload', 3, 4);
END $$;

-- 7. Photovoltaik
DO $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO vorlage_checklisten (name, beschreibung, mandant_typ, leistungsbereich, checkliste_typ)
  VALUES ('Photovoltaik Steuererklaerung', 'Unterlagen fuer PV-Anlagenbetreiber', 'pv_betreiber', 'steuererklaerung', 'einmalig')
  RETURNING id INTO v_id;

  INSERT INTO vorlage_dokumente (vorlage_checkliste_id, titel, beschreibung, tipp_basis, pflicht, eingabe_typ, einheit, mehrdatei_erlaubt, sortierung, haeufig_vergessen) VALUES
  (v_id, 'Kaufrechnung PV-Anlage', 'Rechnung ueber Kauf und Installation', 'Die Kaufrechnung haben Sie vom Installateur/Haendler erhalten. Falls Sie diese nicht mehr finden, fragen Sie beim Installateur nach einer Kopie. Wichtig: Die Rechnung muss den Nettobetrag und die Mehrwertsteuer separat ausweisen.', true, 'datei_upload', NULL, false, 1, 3),
  (v_id, 'Einspeisevertrag', 'Vertrag mit dem Netzbetreiber', 'Den Einspeisevertrag haben Sie von Ihrem oertlichen Netzbetreiber (z.B. Westnetz, Bayernwerk, E.DIS) erhalten. Suchen Sie in Ihren Unterlagen nach "Einspeisevertrag" oder "Netzanschlussvertrag".', true, 'datei_upload', NULL, false, 2, 3),
  (v_id, 'Marktstammdatenregister-Bestaetigung', 'Registrierungsnachweis MaStR', 'Jede PV-Anlage muss im Marktstammdatenregister registriert sein. Loggen Sie sich ein unter www.marktstammdatenregister.de, gehen Sie zu "Meine Einheiten" und drucken Sie die Bestaetigung als PDF.', true, 'datei_upload', NULL, false, 3, 4),
  (v_id, 'Einspeiseverguetungs-Abrechnungen', 'Abrechnungen des Netzbetreibers', 'Ihr Netzbetreiber schickt Ihnen regelmaessig Abrechnungen ueber die Einspeiseverguetung (meist jaehrlich oder quartalsweise). Laden Sie alle Abrechnungen des Jahres hoch.', true, 'datei_upload', NULL, true, 4, 5),
  (v_id, 'Inbetriebnahmedatum', 'Datum der Inbetriebnahme der Anlage', 'Das Inbetriebnahmedatum steht auf dem Inbetriebnahmeprotokoll, das der Installateur erstellt hat. Alternativ finden Sie es im Marktstammdatenregister bei Ihrer Anlage.', true, 'text_eingabe', NULL, false, 5, 2),
  (v_id, 'Anlagenleistung', 'Nennleistung der PV-Anlage in kWp', 'Die Nennleistung in Kilowatt-Peak (kWp) steht auf Ihrer Kaufrechnung, im Datenblatt der Module oder im Marktstammdatenregister. Typisch fuer Einfamilienhaus: 5-15 kWp.', true, 'zahl_eingabe', 'kWp', false, 6, 2),
  (v_id, 'Stromzaehler-Ablesung', 'Zaehlerstand zum Jahresende mit Foto', 'Fotografieren Sie Ihren Stromzaehler (Einspeise- und Bezugszaehler) zum 31.12. und tragen Sie den abgelesenen Wert ein. Das Foto dient als Nachweis. Achten Sie darauf, dass die Zaehlernummer und der Stand gut lesbar sind.', true, 'kombination', 'kWh', false, 7, 4);

  UPDATE vorlage_dokumente SET kombination_typen = '["zahl_eingabe", "datei_upload"]'::jsonb WHERE vorlage_checkliste_id = v_id AND titel = 'Stromzaehler-Ablesung';
END $$;
