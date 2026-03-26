// Script: Test-PDFs fuer Vollmacht und Datenschutz generieren
// Ausfuehren: node scripts/generate-test-pdfs.mjs
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { writeFileSync } from 'fs'

async function erstelleTestPdf(titel, inhalt, dateiname) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const seite = pdfDoc.addPage([595.28, 841.89]) // A4

  // Titel
  seite.drawText(titel, { x: 50, y: 780, size: 20, font: fontBold })

  // Horizontale Linie
  seite.drawLine({ start: { x: 50, y: 770 }, end: { x: 545, y: 770 }, thickness: 1 })

  // Kanzlei-Info
  seite.drawText('Testkanzlei Mueller', { x: 50, y: 740, size: 12, font: fontBold })
  seite.drawText('Musterstrasse 1, 60311 Frankfurt am Main', { x: 50, y: 725, size: 10, font })

  // Inhalt
  const zeilen = inhalt.split('\n')
  let y = 690
  for (const zeile of zeilen) {
    if (y < 100) break
    seite.drawText(zeile, { x: 50, y, size: 10, font })
    y -= 16
  }

  // Unterschriftsbereich
  seite.drawText('Datum, Unterschrift des Mandanten:', { x: 50, y: 150, size: 10, font })
  seite.drawLine({ start: { x: 50, y: 130 }, end: { x: 300, y: 130 }, thickness: 0.5 })

  const pdfBytes = await pdfDoc.save()
  writeFileSync(dateiname, pdfBytes)
  console.log(`Erstellt: ${dateiname} (${(pdfBytes.length / 1024).toFixed(1)} KB)`)
}

// Vollmacht
await erstelleTestPdf(
  'Vollmacht',
  `Hiermit bevollmaechtige ich die Testkanzlei Mueller, mich in allen
steuerlichen Angelegenheiten gegenueber dem Finanzamt und sonstigen
Behoerden zu vertreten.

Die Vollmacht umfasst insbesondere:
- Erstellung und Einreichung von Steuererklaerungen
- Entgegennahme von Steuerbescheiden und Verwaltungsakten
- Fuehrung von Einspruchsverfahren
- Einholung von Auskuenften und Akteneinsicht
- Vertretung in Betriebspruefungen

Diese Vollmacht gilt bis auf Widerruf.

Mandant:
Name: ___________________________
Anschrift: ________________________
Steuernummer: ____________________`,
  'scripts/test-vollmacht.pdf'
)

// Datenschutzerklaerung
await erstelleTestPdf(
  'Datenschutzerklaerung',
  `Einwilligung in die Datenverarbeitung

Ich willige ein, dass die Testkanzlei Mueller meine
personenbezogenen Daten zum Zweck der steuerlichen Beratung
verarbeitet.

Folgende Daten werden verarbeitet:
- Name, Anschrift, Geburtsdatum
- Steueridentifikationsnummer
- Einkommens- und Vermoegensdaten
- Bankverbindungsdaten
- Weitere fuer die Steuerberatung relevante Unterlagen

Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfuellung)
und Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).

Ihre Rechte: Auskunft, Berichtigung, Loeschung, Einschraenkung,
Datenportabilitaet, Widerspruch.

Verantwortlicher:
Testkanzlei Mueller
Musterstrasse 1, 60311 Frankfurt am Main
datenschutz@testkanzlei-mueller.de`,
  'scripts/test-datenschutz.pdf'
)

console.log('\nFertig! Lade die PDFs jetzt unter Einstellungen > GwG-Dokumentvorlagen hoch.')
