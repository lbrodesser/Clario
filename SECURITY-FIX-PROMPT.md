# Clario — Security Fixes, Code Review & Portal-Hardening

## Kontext
Clario ist ein Mandantenportal für deutsche Steuerkanzleien. Der gesamte Code wurde von Claude Code geschrieben und hat ein professionelles Security-Audit durchlaufen. Dieses Audit hat **5 kritische Sicherheitslücken**, **5 hohe Prioritäts-Issues** und diverse Code-Quality-Probleme identifiziert. Dieser Prompt behebt alle Probleme systematisch.

**WICHTIG**: Führe jeden Schritt einzeln aus. Teste nach jedem Schritt ob die App noch kompiliert (`npm run build`). Committe nach jedem abgeschlossenen Schritt.

---

## PHASE 1: Kritische Sicherheitslücken schließen (BLOCKER)

### 1.1 Race Condition in Registrierung beheben

**Datei**: `src/features/auth/hooks/useAuth.ts`

**Problem**: Wenn `supabase.auth.signUp()` erfolgreich ist aber der `kanzleien`-INSERT fehlschlägt, existiert ein Auth-User OHNE Kanzlei-Datensatz. Die App ist für diesen User komplett kaputt — er kann sich einloggen, aber hat kein Dashboard.

**Fix**:
```typescript
// In useRegister() mutationFn:
// 1. signUp ausführen
// 2. Wenn signUp OK → kanzleien INSERT mit user_id = data.user.id
// 3. Wenn kanzleien INSERT fehlschlägt:
//    a) Auth-User über supabase.auth.admin NICHT löschen (kein admin-Zugriff im Frontend)
//    b) Stattdessen: Fehler werfen MIT klarer Meldung
//    c) Beim nächsten Login prüfen ob kanzlei existiert, wenn nicht → erneut anlegen
// 4. navigate('/app/dashboard') NUR wenn BEIDES erfolgreich war
```

**Zusätzlich**: Erstelle einen Recovery-Mechanismus:
- In `useAuth.ts` → `useLogin()`: Nach erfolgreichem Login prüfen ob `kanzleien`-Eintrag existiert
- Wenn nicht: automatisch erstellen (mit Email als Fallback-Name)
- Toast-Nachricht: "Ihr Konto wurde vervollständigt"

### 1.2 Server-seitige Datei-Validierung implementieren

**Problem**: `useUpload.ts` akzeptiert JEDE Datei — keine Typ-Prüfung, keine Größen-Prüfung. Ein Angreifer kann .exe, .zip, oder 500MB-Dateien hochladen.

**Fix in `src/features/portal/hooks/useUpload.ts`**:
```typescript
// VOR dem Supabase Storage Upload:
const ERLAUBTE_TYPEN = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'text/xml',
  'application/xml'
]

const MAX_GROESSE = {
  'application/pdf': 10 * 1024 * 1024,  // 10MB für PDFs
  'image/*': 5 * 1024 * 1024,           // 5MB für Bilder
  'default': 5 * 1024 * 1024            // 5MB Standard
}

// Prüfe MIME-Type
if (!ERLAUBTE_TYPEN.includes(datei.type)) {
  throw new Error(`Dateityp "${datei.type}" nicht erlaubt. Erlaubt: PDF, JPG, PNG, XML`)
}

// Prüfe Dateigröße
const maxSize = datei.type.startsWith('image/') ? MAX_GROESSE['image/*'] : (MAX_GROESSE[datei.type] || MAX_GROESSE.default)
if (datei.size > maxSize) {
  throw new Error(`Datei zu groß (${(datei.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${maxSize / 1024 / 1024}MB`)
}

// Prüfe Magic Bytes (erste Bytes der Datei)
const header = await datei.slice(0, 4).arrayBuffer()
const bytes = new Uint8Array(header)
const isPDF = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 // %PDF
const isJPG = bytes[0] === 0xFF && bytes[1] === 0xD8
const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47

if (datei.type === 'application/pdf' && !isPDF) {
  throw new Error('Datei ist kein echtes PDF')
}
if (datei.type === 'image/jpeg' && !isJPG) {
  throw new Error('Datei ist kein echtes JPEG')
}
if (datei.type === 'image/png' && !isPNG) {
  throw new Error('Datei ist kein echtes PNG')
}
```

**Zusätzlich in UI** (`DokumentUploadBereich.tsx`):
- Zeige erlaubte Dateitypen und Größenlimits dem User VOR dem Upload
- Bei Fehler: Klare deutsche Fehlermeldung anzeigen

### 1.3 RLS Policies für Portal-Token absichern

**Problem**: Die RLS-Policy für `freie_uploads` ist `WITH CHECK (true)` — das erlaubt JEDEM einen INSERT, nicht nur dem Mandant mit dem richtigen Token. Auch `dokument_dateien` validiert den Token nicht vollständig.

**Neue Migration erstellen**: `supabase/migrations/006_rls_security_fix.sql`

```sql
-- ============================================
-- 006: Security Fix — RLS Policies verschärfen
-- ============================================

-- 1. freie_uploads: INSERT nur mit gültigem portal_token
DROP POLICY IF EXISTS freie_uploads_portal_insert ON freie_uploads;
CREATE POLICY freie_uploads_portal_insert ON freie_uploads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM mandanten m
      JOIN checklisten c ON c.mandant_id = m.id
      WHERE m.id = freie_uploads.mandant_id
      AND c.portal_token IS NOT NULL
    )
  );

-- 2. dokument_dateien: INSERT nur wenn zugehörige Checkliste einen portal_token hat
DROP POLICY IF EXISTS dokument_dateien_portal_insert ON dokument_dateien;
CREATE POLICY dokument_dateien_portal_insert ON dokument_dateien
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM dokumente d
      JOIN checklisten c ON c.id = d.checkliste_id
      WHERE d.id = dokument_dateien.dokument_id
      AND c.portal_token IS NOT NULL
    )
  );

-- 3. Alle Portal-READ-Policies: Zusätzlich prüfen ob Token aktiv
-- (Token wird als NULL gesetzt wenn Checkliste geschlossen wird)
DROP POLICY IF EXISTS checklisten_portal_read ON checklisten;
CREATE POLICY checklisten_portal_read ON checklisten
  FOR SELECT USING (
    portal_token IS NOT NULL
    AND (frist IS NULL OR frist >= CURRENT_DATE - INTERVAL '7 days')
  );

-- 4. DELETE-Policies hinzufügen (fehlten komplett)
CREATE POLICY dokument_dateien_kanzlei_delete ON dokument_dateien
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM dokumente d
      JOIN checklisten c ON c.id = d.checkliste_id
      JOIN mandanten m ON m.id = c.mandant_id
      WHERE d.id = dokument_dateien.dokument_id
      AND m.kanzlei_id = auth_kanzlei_id()
    )
  );

CREATE POLICY freie_uploads_kanzlei_delete ON freie_uploads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM mandanten m
      WHERE m.id = freie_uploads.mandant_id
      AND m.kanzlei_id = auth_kanzlei_id()
    )
  );
```

**App-seitige Absicherung** zusätzlich zu RLS:
In `src/features/portal/hooks/usePortal.ts` → `usePortalDaten()`:
- Nach dem Laden der Checkliste: Prüfen ob `portal_token` mit URL-Parameter übereinstimmt
- Wenn nicht: Zugriff verweigern, Fehlerseite anzeigen
```typescript
if (checkliste.portal_token !== token) {
  throw new Error('Ungültiger Zugangslink')
}
```

### 1.4 E-Mail-Versand Fehlerbehandlung

**Problem**: Edge Functions melden "Erfolg" auch wenn Resend die Mail NICHT geschickt hat.

**Dateien**: `supabase/functions/magic-link-senden/index.ts`, `supabase/functions/upload-benachrichtigung/index.ts`

**Fix für BEIDE Edge Functions**:
```typescript
// VORHER (kaputt):
await fetch('https://api.resend.com/emails', { ... })
return new Response(JSON.stringify({ success: true }))

// NACHHER (korrekt):
const emailResponse = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ /* ... */ }),
})

if (!emailResponse.ok) {
  const errorBody = await emailResponse.text()
  console.error('Resend API Fehler:', emailResponse.status, errorBody)
  return new Response(
    JSON.stringify({
      success: false,
      error: 'E-Mail konnte nicht gesendet werden',
      details: emailResponse.status
    }),
    { status: 502, headers: corsHeaders }
  )
}

const emailResult = await emailResponse.json()
console.log('E-Mail gesendet:', emailResult.id)

return new Response(
  JSON.stringify({ success: true, emailId: emailResult.id }),
  { headers: corsHeaders }
)
```

### 1.5 E-Mail-Verifizierung bei Registrierung

**Problem**: Jeder kann sich mit `fake@example.com` registrieren.

**Fix in `src/features/auth/hooks/useAuth.ts`**:
```typescript
// signUp mit emailRedirectTo
const { data, error } = await supabase.auth.signUp({
  email,
  password: passwort,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/verify`,
  },
})
```

**Neue Seite**: `src/features/auth/pages/VerifyEmailPage.tsx`
- Nachricht: "Bitte bestätigen Sie Ihre E-Mail-Adresse. Wir haben Ihnen einen Link geschickt."
- Button: "Bestätigungs-Mail erneut senden"
- Weiterleitung nach Bestätigung → `/app/dashboard`

**In `src/features/auth/components/RegisterForm.tsx`**:
- Nach Registrierung NICHT direkt zum Dashboard navigieren
- Stattdessen zur VerifyEmailPage navigieren
- Passwort-Validierung verschärfen: mindestens 10 Zeichen, mindestens 1 Zahl

**Route hinzufügen in `src/App.tsx`**:
```tsx
<Route path="/auth/verify" element={<VerifyEmailPage />} />
```

**Supabase Dashboard**: E-Mail-Bestätigung aktivieren (manueller Schritt — Hinweis im Commit-Log).

---

## PHASE 2: Portal-Funktionen prüfen & härten (Dokument-Scan + Unterschrift)

### 2.1 SignaturPad.tsx — Code Review & Fixes

**Datei**: `src/features/portal/components/SignaturPad.tsx`

Prüfe und fixe folgende Probleme:

1. **Leere Unterschrift verhindern**: `hasDrawn` wird bei JEDEM Mausklick auf `true` gesetzt. Fix:
   - Tracke die Gesamtlänge aller Striche (Pixel-Distanz)
   - Mindestens 50px Gesamtstrecke bevor `hasDrawn = true`
   - Oder: Prüfe ob mindestens 5% der Canvas-Pixel nicht-transparent sind
   ```typescript
   const getStrokeLength = (canvas: HTMLCanvasElement): number => {
     const ctx = canvas.getContext('2d')!
     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
     let nonTransparentPixels = 0
     for (let i = 3; i < imageData.data.length; i += 4) {
       if (imageData.data[i] > 0) nonTransparentPixels++
     }
     return nonTransparentPixels / (canvas.width * canvas.height)
   }
   // Mindestens 0.5% der Pixel müssen beschrieben sein
   const isValidSignature = getStrokeLength(canvas) > 0.005
   ```

2. **Touch-Events auf Mobile**: Prüfe ob `touchstart`, `touchmove`, `touchend` korrekt implementiert sind. Teste:
   - Verhindert scrolling während Unterschrift (`e.preventDefault()`)
   - Multi-Touch wird ignoriert (nur erster Finger zählt)
   - Canvas-Position ist korrekt auf Mobile (kein Offset)

3. **Retina/HiDPI**: Bestehende Implementierung prüfen — ist der `devicePixelRatio` korrekt angewandt auf ALLEN Geräten? Teste mit ratio 1, 2 und 3.

### 2.2 VorlageMitUnterschrift.tsx — Code Review & Fixes

**Datei**: `src/features/portal/components/VorlageMitUnterschrift.tsx`

Prüfe und fixe:

1. **PDF-Fetch Absicherung**:
   ```typescript
   // NUR URLs von der eigenen Supabase-Instanz erlauben
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
   if (!dokument.vorlage_pdf_url.startsWith(SUPABASE_URL)) {
     throw new Error('Ungültige Vorlagen-URL')
   }
   ```

2. **PDF-Validierung nach Laden**:
   ```typescript
   const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer())
   // Magic Bytes prüfen: %PDF
   if (pdfBytes[0] !== 0x25 || pdfBytes[1] !== 0x50 || pdfBytes[2] !== 0x44 || pdfBytes[3] !== 0x46) {
     throw new Error('Ungültige PDF-Datei')
   }
   ```

3. **Signatur-IP erfassen** (aktuell hardcoded als `'nicht verfuegbar'`):
   ```typescript
   // IP über öffentlichen Service holen (DSGVO-konform: IP wird nur für Audit-Trail gespeichert)
   let signaturIp = 'nicht ermittelbar'
   try {
     const ipResponse = await fetch('https://api.ipify.org?format=json')
     if (ipResponse.ok) {
       const { ip } = await ipResponse.json()
       signaturIp = ip
     }
   } catch {
     // Fallback: IP nicht verfügbar (z.B. durch AdBlocker)
   }
   ```

4. **Mandant-Name in PDF escapen**:
   - Prüfe ob `drawText()` mit Sonderzeichen umgehen kann (ä, ö, ü, ß, Emojis)
   - pdf-lib sollte das handlen, aber teste mit: `"Müller-Lüdenscheid & Co. Ges.m.b.H."`

5. **Signatur-Zeitstempel mit Sekunden**:
   ```typescript
   // Aktuell fehlen Sekunden — hinzufügen:
   new Date().toLocaleString('de-DE', {
     day: '2-digit', month: '2-digit', year: 'numeric',
     hour: '2-digit', minute: '2-digit', second: '2-digit'
   })
   ```

### 2.3 FotoCapture.tsx — Dokumenten-Scan prüfen

**Datei**: `src/features/portal/components/FotoCapture.tsx` (oder ähnlich)

Prüfe:

1. **Kamera-Zugriff**: Wird `navigator.mediaDevices.getUserMedia` korrekt aufgerufen?
   - Bevorzugt Rückkamera auf Mobile (`facingMode: 'environment'`)
   - Fallback wenn Kamera verweigert wird (Fehlermeldung + Datei-Upload-Alternative)
   - Permission-Error abfangen und dem User erklären

2. **Foto-Qualität**: Wird die höchste verfügbare Auflösung verwendet?
   ```typescript
   const constraints = {
     video: {
       facingMode: 'environment',
       width: { ideal: 4096 },
       height: { ideal: 3072 },
     }
   }
   ```

3. **Personalausweis Vorder-/Rückseite**: Wird klar kommuniziert welche Seite gerade fotografiert wird?
   - Titel: "Vorderseite fotografieren" → nach Upload → "Rückseite fotografieren"
   - Vorschau beider Bilder nebeneinander

### 2.4 BildQualitaetsPruefung.tsx — Qualitätscheck prüfen

**Datei**: `src/features/portal/components/BildQualitaetsPruefung.tsx` (oder ähnlich, ggf. in useBildQualitaet.ts)

Prüfe:

1. **Base64-Größe begrenzen**: Vor dem Senden an Edge Function:
   ```typescript
   if (base64String.length > 5_000_000) { // ~3.75MB decoded
     throw new Error('Bild zu groß für Qualitätsprüfung')
   }
   ```

2. **Timeout**: Claude API-Call kann lange dauern. Setze Timeout:
   ```typescript
   const controller = new AbortController()
   const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s
   ```

3. **Fallback bei API-Fehler**: Wenn Qualitätsprüfung fehlschlägt, Upload trotzdem erlauben (mit Warnung)

### 2.5 "Wo finde ich das?" — Fallback & Verbesserung

**Datei**: `src/features/portal/components/WoFindeIchDas.tsx`

1. **Fallback-Texte** wenn Claude API nicht erreichbar:
   ```typescript
   const FALLBACK_ANLEITUNGEN: Record<string, string> = {
     'Personalausweis': 'Halten Sie Ihren gültigen Personalausweis bereit. Fotografieren Sie Vorder- und Rückseite separat bei guter Beleuchtung.',
     'Vollmacht': 'Das Vollmacht-Formular wird Ihnen von Ihrer Steuerkanzlei bereitgestellt. Sie können es hier direkt digital unterschreiben.',
     'Datenschutzerklärung': 'Die Datenschutzerklärung wird von Ihrer Steuerkanzlei bereitgestellt. Lesen und unterschreiben Sie das Dokument digital.',
     'Steuerbescheid': 'Ihren letzten Steuerbescheid finden Sie in Ihren Unterlagen vom Finanzamt oder in Ihrem ELSTER-Konto unter "Bescheide".',
     'Lohnsteuerbescheinigung': 'Ihre Lohnsteuerbescheinigung erhalten Sie von Ihrem Arbeitgeber. Sie wird meist im Februar/März für das Vorjahr ausgestellt.',
   }
   ```

2. **Prompt Injection verhindern** in `dokument-anleitung` Edge Function:
   ```typescript
   // dokumentTitel sanitizen bevor es in den Claude-Prompt geht
   const sanitizedTitel = dokumentTitel
     .replace(/[^\w\säöüÄÖÜß\-\.\/]/g, '')
     .substring(0, 100)
   ```

---

## PHASE 3: Edge Functions absichern

### 3.1 CORS einschränken

**Alle Edge Functions**: Ersetze `'Access-Control-Allow-Origin': '*'` mit:
```typescript
const ALLOWED_ORIGINS = [
  Deno.env.get('APP_URL') || 'http://localhost:5173',
  // Produktions-URL hier eintragen
]

const origin = req.headers.get('Origin') || ''
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
```

### 3.2 Rate Limiting (einfach)

**Neue Helper-Datei**: `supabase/functions/_shared/rate-limit.ts`
```typescript
// Einfaches In-Memory Rate Limiting (resets bei Function-Restart)
const requestCounts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const entry = requestCounts.get(ip)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  entry.count++
  return entry.count <= maxRequests
}
```

Verwende in `bild-qualitaet` und `dokument-anleitung`:
```typescript
const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
if (!checkRateLimit(clientIp, 5, 60000)) { // 5 Anfragen pro Minute
  return new Response(JSON.stringify({ error: 'Zu viele Anfragen' }), {
    status: 429,
    headers: corsHeaders,
  })
}
```

### 3.3 Input-Validierung in bild-qualitaet

**Datei**: `supabase/functions/bild-qualitaet/index.ts`

```typescript
// Eingabe validieren
const { bildBase64, dokumentTitel } = await req.json()

if (!bildBase64 || typeof bildBase64 !== 'string') {
  return new Response(JSON.stringify({ error: 'bildBase64 fehlt' }), { status: 400 })
}

if (bildBase64.length > 5_000_000) {
  return new Response(JSON.stringify({ error: 'Bild zu groß (max 3.75MB)' }), { status: 413 })
}

// Base64-Format prüfen
if (!/^[A-Za-z0-9+/]+=*$/.test(bildBase64.replace(/\s/g, ''))) {
  return new Response(JSON.stringify({ error: 'Ungültiges Base64-Format' }), { status: 400 })
}

// dokumentTitel sanitizen
const safeTitel = (dokumentTitel || 'Dokument')
  .replace(/[^\w\säöüÄÖÜß\-\.\/]/g, '')
  .substring(0, 100)
```

### 3.4 JSON-Parse absichern

**Alle Edge Functions die Claude API nutzen** (`bild-qualitaet`, `dokument-anleitung`):
```typescript
let result
try {
  result = JSON.parse(text)
} catch (parseError) {
  console.error('Claude Antwort kein gültiges JSON:', text.substring(0, 200))
  // Fallback: Rohtext als Anleitung verwenden
  result = { qualitaet: 'unbekannt', hinweise: ['Qualitätsprüfung konnte nicht durchgeführt werden'] }
}
```

---

## PHASE 4: Code-Quality & Performance

### 4.1 N+1 Query in Portal beheben

**Datei**: `src/features/portal/hooks/usePortal.ts` → `usePortalDaten()`

**Problem**: Für JEDE Checkliste werden Dokumente einzeln geladen, und für jedes Dokument die Dateien. Bei 20 Dokumenten = 20+ Queries.

**Fix**: Nested Select verwenden:
```typescript
const { data: checkliste } = await supabase
  .from('checklisten')
  .select(`
    *,
    dokumente (
      *,
      dokument_dateien (*)
    ),
    mandant:mandanten (
      *,
      kanzlei:kanzleien (name, email, telefon, logo_url, vollmacht_vorlage_url, datenschutz_vorlage_url)
    )
  `)
  .eq('portal_token', token)
  .single()
```
Das reduziert 20+ Queries auf 1 Query.

### 4.2 Doppel-Submit verhindern

**Alle Upload-Formulare und Signatur-Buttons**:
```typescript
const [isSubmitting, setIsSubmitting] = useState(false)

const handleSubmit = async () => {
  if (isSubmitting) return
  setIsSubmitting(true)
  try {
    await doUpload()
  } finally {
    setIsSubmitting(false)
  }
}

// Button: disabled={isSubmitting}
// Text: isSubmitting ? 'Wird hochgeladen...' : 'Hochladen'
```

Prüfe ob das bereits in folgenden Komponenten implementiert ist, wenn nicht → nachrüsten:
- `DokumentUploadBereich.tsx`
- `VorlageMitUnterschrift.tsx` (Signatur-Button)
- `FotoCapture.tsx`
- `RegisterForm.tsx`
- `LoginForm.tsx`

### 4.3 Error Boundary für Portal

**Neue Datei**: `src/features/portal/components/PortalErrorBoundary.tsx`

```tsx
// React Error Boundary die freundliche deutsche Fehlermeldung zeigt
// Statt weißem Bildschirm: "Es ist ein Fehler aufgetreten. Bitte laden Sie die Seite neu."
// Mit Button: "Seite neu laden"
// Und: "Falls das Problem bestehen bleibt, kontaktieren Sie Ihre Kanzlei."
```

Wrap in `PortalPage.tsx`:
```tsx
<PortalErrorBoundary>
  <ChecklisteAnsicht ... />
</PortalErrorBoundary>
```

---

## PHASE 5: Finale Code-Review Checkliste

Nachdem alle Fixes implementiert sind, prüfe JEDE der folgenden Dateien:

### Portal-Kern (Mandanten-seitig):
- [ ] `src/features/portal/pages/PortalPage.tsx` — Routing, Token-Handling
- [ ] `src/features/portal/hooks/usePortal.ts` — N+1 behoben, Token-Validierung
- [ ] `src/features/portal/hooks/useUpload.ts` — Datei-Validierung, Signatur-Felder
- [ ] `src/features/portal/components/ChecklisteAnsicht.tsx` — Dokumenten-Liste, Status
- [ ] `src/features/portal/components/DokumentUploadBereich.tsx` — Upload-UI, Fehlerhandling
- [ ] `src/features/portal/components/FotoCapture.tsx` — Kamera, Qualität
- [ ] `src/features/portal/components/SignaturPad.tsx` — Mindest-Strichlänge, Mobile
- [ ] `src/features/portal/components/VorlageMitUnterschrift.tsx` — PDF-Embed, IP, Timestamps
- [ ] `src/features/portal/components/WoFindeIchDas.tsx` — Fallback-Texte
- [ ] `src/features/portal/components/BildQualitaetsPruefung.tsx` — Timeout, Fallback

### Auth & Security:
- [ ] `src/features/auth/hooks/useAuth.ts` — Race Condition, Email-Verify
- [ ] `src/features/auth/components/RegisterForm.tsx` — Validierung verschärft
- [ ] `src/features/auth/pages/VerifyEmailPage.tsx` — NEU erstellt
- [ ] `supabase/migrations/006_rls_security_fix.sql` — RLS gehärtet

### Edge Functions:
- [ ] `supabase/functions/magic-link-senden/index.ts` — Email-Fehlerhandling
- [ ] `supabase/functions/upload-benachrichtigung/index.ts` — Email-Fehlerhandling
- [ ] `supabase/functions/bild-qualitaet/index.ts` — Input-Validierung, Rate Limiting
- [ ] `supabase/functions/dokument-anleitung/index.ts` — Prompt Injection, Rate Limiting
- [ ] `supabase/functions/_shared/rate-limit.ts` — NEU erstellt

### Für JEDE Datei in der Checkliste:
1. `npm run build` muss OHNE Fehler durchlaufen
2. TypeScript strict mode — keine `any` Types, keine `@ts-ignore`
3. Alle Error-Pfade haben User-facing Fehlermeldungen auf Deutsch
4. Keine `console.log` in Production (nur `console.error` für echte Fehler)
5. Keine hardcoded URLs oder Secrets

---

## PHASE 6: Abschluss-Verifizierung

Nach allen Fixes:

1. **Build prüfen**: `npm run build` → muss fehlerfrei sein
2. **TypeScript prüfen**: `npx tsc --noEmit` → keine Fehler
3. **Supabase Migration testen**: `supabase db reset` → Migration 006 muss durchlaufen
4. **Edge Functions deployen**: Alle 5 Edge Functions neu deployen
5. **Manueller Test**: Portal-Link in Inkognito-Tab öffnen → Checkliste laden → Dokument hochladen → Unterschrift → Fertig

Erstelle am Ende eine Zusammenfassung:
```
=== SECURITY FIX ZUSAMMENFASSUNG ===
✅ Behoben: [Liste aller Fixes]
⚠️ Manuelle Schritte nötig: [z.B. Supabase Email-Verify aktivieren]
🔍 Noch zu prüfen: [offene Punkte]
```
