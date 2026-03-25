interface ErinnerungProps {
  kanzleiName: string
  kanzleiLogoUrl: string | null
  mandantName: string
  checklisteTitel: string
  frist: string
  portalLink: string
  fortschrittText: string
  betreff: string
}

export function Erinnerung({
  kanzleiName,
  kanzleiLogoUrl,
  mandantName,
  checklisteTitel,
  frist,
  portalLink,
  fortschrittText,
}: ErinnerungProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {kanzleiLogoUrl ? (
        <img src={kanzleiLogoUrl} alt={kanzleiName} style={{ height: '40px', marginBottom: '20px' }} />
      ) : (
        <h2 style={{ marginBottom: '20px' }}>{kanzleiName}</h2>
      )}

      <p>Guten Tag {mandantName},</p>

      <p>
        wir erinnern Sie an die ausstehenden Unterlagen fuer <strong>{checklisteTitel}</strong>.
      </p>

      <p>
        <strong>Frist: {frist}</strong>
      </p>

      <p style={{ color: '#6b7280' }}>{fortschrittText}</p>

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

      <hr style={{ borderColor: '#e5e7eb', margin: '30px 0' }} />

      <p style={{ color: '#9ca3af', fontSize: '12px' }}>
        Diese E-Mail wurde von {kanzleiName} ueber Clario versendet.
      </p>
    </div>
  )
}
