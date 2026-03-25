// E-Mail Template: Einladung / Magic Link
// Wird von der Edge Function magic-link-senden verwendet
// Format: React Email kompatibel (Resend)

interface EinladungProps {
  kanzleiName: string
  kanzleiLogoUrl: string | null
  mandantName: string
  checklisteTitel: string
  frist: string
  portalLink: string
}

export function Einladung({
  kanzleiName,
  kanzleiLogoUrl,
  mandantName,
  checklisteTitel,
  frist,
  portalLink,
}: EinladungProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {kanzleiLogoUrl ? (
        <img src={kanzleiLogoUrl} alt={kanzleiName} style={{ height: '40px', marginBottom: '20px' }} />
      ) : (
        <h2 style={{ marginBottom: '20px' }}>{kanzleiName}</h2>
      )}

      <p>Guten Tag {mandantName},</p>

      <p>
        fuer <strong>{checklisteTitel}</strong> benoetigen wir noch Unterlagen von Ihnen.
      </p>

      <p>
        <strong>Bitte bis {frist} einreichen.</strong>
      </p>

      <div style={{ margin: '30px 0', textAlign: 'center' as const }}>
        <a
          href={portalLink}
          style={{
            display: 'inline-block',
            padding: '16px 32px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          Jetzt Unterlagen einreichen
        </a>
      </div>

      <p style={{ color: '#6b7280', fontSize: '14px' }}>
        Kein Account noetig. Einfach klicken und Dokumente hochladen.
      </p>

      <hr style={{ borderColor: '#e5e7eb', margin: '30px 0' }} />

      <p style={{ color: '#9ca3af', fontSize: '12px' }}>
        Diese E-Mail wurde von {kanzleiName} ueber Clario versendet.
      </p>
    </div>
  )
}
