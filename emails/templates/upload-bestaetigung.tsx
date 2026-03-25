interface UploadBestaetigungProps {
  kanzleiName: string
  mandantName: string
  dokumentTitel: string
  qualitaetWarnung: boolean
  appLink: string
}

export function UploadBestaetigung({
  kanzleiName,
  mandantName,
  dokumentTitel,
  qualitaetWarnung,
  appLink,
}: UploadBestaetigungProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>{kanzleiName}</h2>

      <p>
        <strong>{mandantName}</strong> hat <strong>{dokumentTitel}</strong> hochgeladen.
      </p>

      {qualitaetWarnung && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: '8px',
          margin: '16px 0',
        }}>
          <p style={{ color: '#c2410c', margin: 0, fontSize: '14px' }}>
            Bildqualitaet pruefen — Mandant hat trotz Warnung hochgeladen.
          </p>
        </div>
      )}

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
          In der App ansehen
        </a>
      </div>
    </div>
  )
}
