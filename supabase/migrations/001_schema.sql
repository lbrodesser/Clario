-- Clario Datenbankschema
-- Supabase PostgreSQL Migration

-- Enum-Typen
CREATE TYPE mandant_typ AS ENUM (
  'privatperson','freiberufler','kleingewerbe','gmbh_ug','personengesellschaft','verein','pv_betreiber'
);
CREATE TYPE plan_typ AS ENUM ('trial','starter','pro','kanzlei');
CREATE TYPE checkliste_status AS ENUM ('offen','teilweise','vollstaendig','ueberfaellig');
CREATE TYPE checkliste_typ AS ENUM ('einmalig','wiederkehrend','anlassbezogen');
CREATE TYPE dokument_status AS ENUM ('ausstehend','hochgeladen','geprueft','abgelehnt');
CREATE TYPE eingabe_typ AS ENUM ('datei_upload','zahl_eingabe','text_eingabe','auswahl','kombination','bedingtes_formular');
CREATE TYPE dokument_richtung AS ENUM ('eingehend','ausgehend');
CREATE TYPE erinnerung_typ AS ENUM ('einladung','14-tage','7-tage','3-tage','frist','manuell');

-- KANZLEIEN
CREATE TABLE kanzleien (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  logo_url text,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan plan_typ DEFAULT 'trial',
  trial_ends_at timestamptz DEFAULT now() + interval '14 days',
  erinnerung_intervalle jsonb DEFAULT '{"tage": [14, 7, 3]}',
  ampel_kritisch_tage integer DEFAULT 3,
  ampel_warnung_tage integer DEFAULT 14,
  created_at timestamptz DEFAULT now()
);

-- MANDANTEN
CREATE TABLE mandanten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kanzlei_id uuid NOT NULL REFERENCES kanzleien(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  typ mandant_typ NOT NULL DEFAULT 'privatperson',
  steuer_id text,
  notizen text,
  gwg_identifiziert boolean DEFAULT false,
  gwg_identifiziert_am timestamptz,
  ist_heilberuf boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- MITARBEITER (fuer Lohnbuchhaltung)
CREATE TABLE mitarbeiter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id uuid NOT NULL REFERENCES mandanten(id) ON DELETE CASCADE,
  vorname text NOT NULL,
  nachname text NOT NULL,
  eintrittsdatum date NOT NULL,
  austrittsdatum date,
  beschaeftigungsart text CHECK (beschaeftigungsart IN ('vollzeit','teilzeit','minijob','werkstudent','azubi','geschaeftsfuehrer')),
  aktiv boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- CHECKLISTEN
CREATE TABLE checklisten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id uuid NOT NULL REFERENCES mandanten(id) ON DELETE CASCADE,
  titel text NOT NULL,
  typ checkliste_typ DEFAULT 'einmalig',
  frist date NOT NULL,
  status checkliste_status DEFAULT 'offen',
  portal_token uuid UNIQUE DEFAULT gen_random_uuid(),
  wiederholung_intervall text CHECK (wiederholung_intervall IN ('monatlich','quartalsweise','jaehrlich')),
  naechste_erstellung date,
  freie_uploads_erlaubt boolean DEFAULT true,
  erstellt_von_vorlage_id uuid,
  created_at timestamptz DEFAULT now()
);

-- DOKUMENTE (Zeilen der Checkliste)
CREATE TABLE dokumente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkliste_id uuid NOT NULL REFERENCES checklisten(id) ON DELETE CASCADE,
  titel text NOT NULL,
  beschreibung text,
  tipp_basis text,
  pflicht boolean DEFAULT true,
  eingabe_typ eingabe_typ DEFAULT 'datei_upload',
  richtung dokument_richtung DEFAULT 'eingehend',
  einheit text,
  zahl_min numeric,
  zahl_max numeric,
  text_format text,
  text_placeholder text,
  auswahl_optionen jsonb,
  kombination_typen jsonb,
  beleg_pflicht_ab_betrag numeric,
  foto_erlaubt boolean DEFAULT true,
  mehrdatei_erlaubt boolean DEFAULT false,
  xml_erlaubt boolean DEFAULT false,
  ist_freies_dokument boolean DEFAULT false,
  status dokument_status DEFAULT 'ausstehend',
  eingabe_wert_text text,
  eingabe_wert_zahl numeric,
  sortierung integer DEFAULT 0,
  vorlage_dokument_id uuid,
  created_at timestamptz DEFAULT now()
);

-- DOKUMENT-DATEIEN
CREATE TABLE dokument_dateien (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dokument_id uuid NOT NULL REFERENCES dokumente(id) ON DELETE CASCADE,
  datei_url text NOT NULL,
  dateiname text NOT NULL,
  dateityp text,
  dateigroesse_kb integer,
  qualitaet_geprueft boolean DEFAULT false,
  qualitaet_bestanden boolean,
  qualitaet_hinweis text,
  qualitaet_trotzdem_hochgeladen boolean DEFAULT false,
  hochgeladen_am timestamptz DEFAULT now(),
  sortierung integer DEFAULT 0
);

-- FORMULAR-FRAGEN (fuer bedingtes_formular)
CREATE TABLE formular_fragen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dokument_id uuid NOT NULL REFERENCES dokumente(id) ON DELETE CASCADE,
  frage_text text NOT NULL,
  eingabe_typ eingabe_typ NOT NULL,
  einheit text,
  auswahl_optionen jsonb,
  bedingt_durch_frage_id uuid REFERENCES formular_fragen(id),
  bedingt_bei_antwort text,
  loest_upload_aus boolean DEFAULT false,
  sortierung integer DEFAULT 0
);

-- FORMULAR-ANTWORTEN
CREATE TABLE formular_antworten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frage_id uuid NOT NULL REFERENCES formular_fragen(id),
  checkliste_id uuid NOT NULL REFERENCES checklisten(id),
  antwort_text text,
  antwort_zahl numeric,
  antwort_datei_url text,
  erstellt_am timestamptz DEFAULT now()
);

-- FREIE UPLOADS
CREATE TABLE freie_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id uuid NOT NULL REFERENCES mandanten(id),
  checkliste_id uuid REFERENCES checklisten(id),
  beschreibung text,
  datei_url text NOT NULL,
  dateiname text NOT NULL,
  dateityp text,
  dateigroesse_kb integer,
  hochgeladen_am timestamptz DEFAULT now(),
  zugeordnet_am timestamptz,
  zugeordnet_zu_dokument_id uuid REFERENCES dokumente(id)
);

-- ERINNERUNGEN LOG
CREATE TABLE erinnerungen_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkliste_id uuid NOT NULL REFERENCES checklisten(id),
  typ erinnerung_typ NOT NULL,
  gesendet_an text NOT NULL,
  gesendet_am timestamptz DEFAULT now()
);

-- VORLAGEN-CHECKLISTEN
CREATE TABLE vorlage_checklisten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  beschreibung text,
  mandant_typ mandant_typ NOT NULL,
  leistungsbereich text NOT NULL CHECK (leistungsbereich IN ('steuererklaerung','jahresabschluss','finanzbuchhaltung','lohnbuchhaltung','sondervorgang','onboarding','behoerdenbescheid')),
  checkliste_typ checkliste_typ DEFAULT 'einmalig',
  ist_aktiv boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- VORLAGEN-DOKUMENTE
CREATE TABLE vorlage_dokumente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vorlage_checkliste_id uuid NOT NULL REFERENCES vorlage_checklisten(id) ON DELETE CASCADE,
  titel text NOT NULL,
  beschreibung text,
  tipp_basis text,
  pflicht boolean DEFAULT true,
  eingabe_typ eingabe_typ DEFAULT 'datei_upload',
  einheit text,
  auswahl_optionen jsonb,
  kombination_typen jsonb,
  beleg_pflicht_ab_betrag numeric,
  foto_erlaubt boolean DEFAULT true,
  mehrdatei_erlaubt boolean DEFAULT false,
  xml_erlaubt boolean DEFAULT false,
  haeufig_vergessen integer DEFAULT 3 CHECK (haeufig_vergessen BETWEEN 1 AND 5),
  sortierung integer DEFAULT 0
);
