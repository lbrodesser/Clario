interface VollstaendigProps {
  kanzleiName: string
  mandantName: string
  checklisteTitel: string
  appLink: string
}

export function Vollstaendig({
  kanzleiName,
  mandantName,
  checklisteTitel,
  appLink,
}: VollstaendigProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>{kanzleiName}</h2>

      <div style={{
        padding: '20px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '8px',
        margin: '16px 0',
        textAlign: 'center' as const,
      }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
          Alle Pflichtunterlagen eingegangen
        </p>
      </div>

      <p>
        Alle Pflichtunterlagen von <strong>{mandantName}</strong> fuer <strong>{checklisteTitel}</strong> sind vollstaendig eingereicht.
      </p>

      <div style={{ margin: '30px 0' }}>
        <a
          href={appLink}
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        >
          Unterlagen pruefen
        </a>
      </div>
    </div>
  )
}
