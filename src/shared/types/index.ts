export type MandantTyp =
  | 'privatperson' | 'freiberufler' | 'kleingewerbe'
  | 'gmbh_ug' | 'personengesellschaft' | 'verein' | 'pv_betreiber'

export type PlanTyp = 'trial' | 'starter' | 'pro' | 'kanzlei'
export type ChecklisteStatus = 'offen' | 'teilweise' | 'vollstaendig' | 'ueberfaellig'
export type ChecklisteTyp = 'einmalig' | 'wiederkehrend' | 'anlassbezogen'
export type DokumentStatus = 'ausstehend' | 'hochgeladen' | 'geprueft' | 'abgelehnt'
export type EingabeTyp = 'datei_upload' | 'zahl_eingabe' | 'text_eingabe' | 'auswahl' | 'kombination' | 'bedingtes_formular'
export type DokumentRichtung = 'eingehend' | 'ausgehend'
export type ErinnerungTyp = 'einladung' | '14-tage' | '7-tage' | '3-tage' | 'frist' | 'manuell'
export type AmpelFarbe = 'gruen' | 'gelb' | 'rot'

export interface Kanzlei {
  id: string
  name: string
  email: string
  logo_url: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: PlanTyp
  trial_ends_at: string
  erinnerung_intervalle: { tage: number[] }
  ampel_kritisch_tage: number
  ampel_warnung_tage: number
  vollmacht_vorlage_url?: string | null
  datenschutz_vorlage_url?: string | null
  created_at: string
}

export interface Mandant {
  id: string
  kanzlei_id: string
  name: string
  email: string
  typ: MandantTyp
  steuer_id: string | null
  notizen: string | null
  ist_heilberuf: boolean
  gwg_identifiziert: boolean
  gwg_identifiziert_am: string | null
  created_at: string
}

export interface Mitarbeiter {
  id: string
  mandant_id: string
  vorname: string
  nachname: string
  eintrittsdatum: string
  austrittsdatum: string | null
  beschaeftigungsart: 'vollzeit' | 'teilzeit' | 'minijob' | 'werkstudent' | 'azubi' | 'geschaeftsfuehrer'
  aktiv: boolean
}

export interface Checkliste {
  id: string
  mandant_id: string
  titel: string
  typ: ChecklisteTyp
  frist: string
  status: ChecklisteStatus
  portal_token: string
  wiederholung_intervall: 'monatlich' | 'quartalsweise' | 'jaehrlich' | null
  naechste_erstellung: string | null
  freie_uploads_erlaubt: boolean
  erstellt_von_vorlage_id?: string | null
  created_at: string
}

export interface Dokument {
  id: string
  checkliste_id: string
  titel: string
  beschreibung: string | null
  tipp_basis: string | null
  pflicht: boolean
  eingabe_typ: EingabeTyp
  richtung: DokumentRichtung
  einheit: string | null
  zahl_min: number | null
  zahl_max: number | null
  text_format: string | null
  text_placeholder: string | null
  auswahl_optionen: string[] | null
  kombination_typen: EingabeTyp[] | null
  beleg_pflicht_ab_betrag: number | null
  foto_erlaubt: boolean
  mehrdatei_erlaubt: boolean
  xml_erlaubt: boolean
  ist_freies_dokument: boolean
  status: DokumentStatus
  eingabe_wert_text: string | null
  eingabe_wert_zahl: number | null
  vorlage_pdf_url?: string | null
  unterschrift_erforderlich?: boolean
  sortierung: number
  created_at: string
}

export interface DokumentDatei {
  id: string
  dokument_id: string
  datei_url: string
  dateiname: string
  dateityp: string | null
  dateigroesse_kb: number | null
  qualitaet_geprueft: boolean
  qualitaet_bestanden: boolean | null
  qualitaet_hinweis: string | null
  qualitaet_trotzdem_hochgeladen: boolean
  ist_signiert?: boolean
  signatur_zeitpunkt?: string | null
  signatur_ip?: string | null
  hochgeladen_am: string
}

export interface FormularFrage {
  id: string
  dokument_id: string
  frage_text: string
  eingabe_typ: EingabeTyp
  einheit: string | null
  auswahl_optionen: string[] | null
  bedingt_durch_frage_id: string | null
  bedingt_bei_antwort: string | null
  loest_upload_aus: boolean
  sortierung: number
}

export interface FreierUpload {
  id: string
  mandant_id: string
  checkliste_id: string | null
  beschreibung: string | null
  datei_url: string
  dateiname: string
  dateityp: string | null
  dateigroesse_kb: number | null
  hochgeladen_am: string
  zugeordnet_am: string | null
  zugeordnet_zu_dokument_id: string | null
}

export interface VorlageCheckliste {
  id: string
  name: string
  beschreibung: string | null
  mandant_typ: MandantTyp
  leistungsbereich: string
  checkliste_typ: ChecklisteTyp
  ist_aktiv: boolean
  created_at: string
}

export interface VorlageDokument {
  id: string
  vorlage_checkliste_id: string
  titel: string
  beschreibung: string | null
  tipp_basis: string | null
  pflicht: boolean
  eingabe_typ: EingabeTyp
  einheit: string | null
  auswahl_optionen: string[] | null
  kombination_typen: EingabeTyp[] | null
  beleg_pflicht_ab_betrag: number | null
  foto_erlaubt: boolean
  mehrdatei_erlaubt: boolean
  xml_erlaubt: boolean
  unterschrift_erforderlich?: boolean
  haeufig_vergessen: number
  sortierung: number
}

// UI-erweiterte Typen
export interface MandantMitStatus extends Mandant {
  checklisten: ChecklisteMitDokumente[]
  ampel: AmpelFarbe
  offene_dokumente: number
  letzte_aktivitaet: string | null
}

export interface ChecklisteMitDokumente extends Checkliste {
  dokumente: DokumentMitDateien[]
  fortschritt: number
  tage_bis_frist: number
}

export interface DokumentMitDateien extends Dokument {
  dateien: DokumentDatei[]
}

// Claude API Responses
export interface QualitaetsPruefung {
  bestanden: boolean
  grund: string | null
  hinweis: string | null
}

export interface DokumentAnleitung {
  anleitung: string
  schritte: string[]
  alternativ: string | null
}
