import type { Metadata } from 'next';
import { vindHandouts } from '@/lib/download';
import { TOEGELATEN_MIME } from '@/lib/bijlagen';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Handouts', robots: { index: false, follow: false } };

function typeLabel(soort: 'BESTAND' | 'LINK', mimeType: string | null, grootte: number | null): string {
  if (soort === 'LINK') return 'link';
  const ext = mimeType ? TOEGELATEN_MIME[mimeType] : undefined;
  const maat = grootte ? (grootte > 1024 * 1024 ? `${(grootte / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(grootte / 1024)} kB`) : '';
  return [ext, maat].filter(Boolean).join(' · ');
}

/** Persoonlijke handoutpagina: één link in de mail, hier elk document apart (en apart geteld). */
export default async function HandoutsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const gevonden = await vindHandouts(token);

  return (
    <div className="eval-page">
      <div className="eval-wrap">
        <div className="eval-card">
          <div className="eval-kop">
            <div className="eval-eyebrow">CareAIgent · Handouts</div>
            {gevonden ? (
              <>
                <h1>{gevonden.activiteit}</h1>
                <p>Klik op een document om het te downloaden of te openen.</p>
              </>
            ) : (
              <>
                <h1>Link niet gevonden</h1>
                <p>Deze link is ongeldig of niet meer beschikbaar. Mail naar joachim.gregoor@pxl.be als je de documenten nog nodig hebt.</p>
              </>
            )}
          </div>
          {gevonden && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
              {gevonden.bijlagen.map((b) => (
                <li key={b.id} style={{ borderTop: '1px solid var(--light-gray)', padding: '14px 0' }}>
                  <a
                    href={`/d/${encodeURIComponent(token)}/${encodeURIComponent(b.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', gap: '12px', alignItems: 'center', textDecoration: 'none', color: 'var(--navy)' }}
                  >
                    <span aria-hidden style={{ fontSize: '1.4rem' }}>{b.soort === 'LINK' ? '🔗' : '📄'}</span>
                    <span style={{ flex: 1 }}>
                      <strong>{b.titel}</strong>
                      <br />
                      <span style={{ fontSize: '0.85rem', color: 'var(--mid-gray)' }}>
                        {typeLabel(b.soort, b.mimeType, b.grootte)}
                      </span>
                    </span>
                    <span className="btn-submit" style={{ whiteSpace: 'nowrap' }}>
                      {b.soort === 'LINK' ? 'Openen' : 'Download'}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
