import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AmpelFarbe, ChecklisteStatus, Dokument, Kanzlei, MandantTyp, EingabeTyp } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Datum deutsch formatieren: 25.03.2025
export function formatDatum(datum: string | Date): string {
  const d = typeof datum === 'string' ? new Date(datum) : datum
  return d.toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

// Tage bis Frist — negativ bedeutet ueberfaellig
export function tagesBisFrist(frist: string): number {
  const heute = new Date()
  heute.setHours(0, 0, 0, 0)
  const fristDatum = new Date(frist)
  fristDatum.setHours(0, 0, 0, 0)
  return Math.round((fristDatum.getTime() - heute.getTime()) / 86400000)
}

// Ampelfarbe basierend auf Kanzlei-Einstellungen
export function ampelFarbe(
  status: ChecklisteStatus,
  frist: string,
  kanzlei: Pick<Kanzlei, 'ampel_kritisch_tage' | 'ampel_warnung_tage'>
): AmpelFarbe {
  if (status === 'vollstaendig') return 'gruen'
  const tage = tagesBisFrist(frist)
  if (tage < 0 || status === 'ueberfaellig') return 'rot'
  if (tage <= kanzlei.ampel_kritisch_tage) return 'rot'
  if (tage <= kanzlei.ampel_warnung_tage) return 'gelb'
  return 'gruen'
}

// Nur Pflichtdokumente zaehlen fuer Fortschritt
export function fortschrittBerechnen(
  dokumente: Pick<Dokument, 'status' | 'pflicht'>[]
): number {
  const pflicht = dokumente.filter(d => d.pflicht)
  if (pflicht.length === 0) return 100
  const erledigt = pflicht.filter(
    d => d.status === 'hochgeladen' || d.status === 'geprueft'
  ).length
  return Math.round((erledigt / pflicht.length) * 100)
}

// Label fuer Mandantentyp
export function mandantTypLabel(typ: MandantTyp): string {
  const labels: Record<MandantTyp, string> = {
    privatperson: 'Privatperson',
    freiberufler: 'Freiberufler / Selbststaendig',
    kleingewerbe: 'Kleingewerbe / Einzelunternehmen',
    gmbh_ug: 'GmbH / UG',
    personengesellschaft: 'Personengesellschaft (GbR, OHG, KG)',
    verein: 'Verein / Gemeinnuetzig',
    pv_betreiber: 'PV-Anlagenbetreiber'
  }
  return labels[typ]
}

// Label fuer Eingabetyp
export function eingabeTypLabel(typ: EingabeTyp): string {
  const labels: Record<EingabeTyp, string> = {
    datei_upload: 'Datei / Foto hochladen',
    zahl_eingabe: 'Zahl eingeben',
    text_eingabe: 'Text eingeben',
    auswahl: 'Auswahl',
    kombination: 'Kombiniert',
    bedingtes_formular: 'Fragebogen'
  }
  return labels[typ]
}

// Dateigroesse lesbar formatieren
export function formatDateigroesse(kb: number): string {
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}
