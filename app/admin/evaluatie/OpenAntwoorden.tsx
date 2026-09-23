'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GEANONIMISEERD } from '@/lib/evaluatie/stats';

type Blok = { id: string; tekst: string; antwoorden: { antwoordId: string; tekst: string }[] };

export default function OpenAntwoorden({ blokken }: { blokken: Blok[] }) {
  const router = useRouter();
  const [zoek, setZoek] = useState('');
  const [bezig, setBezig] = useState<string | null>(null);

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return blokken.map((b) => ({
      ...b,
      antwoorden: q ? b.antwoorden.filter((a) => a.tekst.toLowerCase().includes(q)) : b.antwoorden,
    }));
  }, [blokken, zoek]);

  async function anonimiseer(antwoordId: string, veld: string) {
    if (!window.confirm('Dit antwoord vervangen door “[verwijderd door beheerder]”? Dit kan niet ongedaan gemaakt worden.')) return;
    setBezig(`${antwoordId}:${veld}`);
    const res = await fetch(`/api/admin/evaluatie/${antwoordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ veld }),
    });
    setBezig(null);
    if (res.ok) router.refresh();
    else alert('Anonimiseren mislukt');
  }

  return (
    <div>
      <p className="admin-banner warn">
        Open antwoorden kunnen per ongeluk persoonsgegevens bevatten (namen van collega&apos;s of patiënten). Anonimiseer
        zo&apos;n antwoord met de knop ernaast.
      </p>
      <div className="form-group" style={{ maxWidth: '360px' }}>
        <label htmlFor="zoek-open">Zoeken in open antwoorden</label>
        <input id="zoek-open" type="search" value={zoek} onChange={(e) => setZoek(e.target.value)} />
      </div>
      {gefilterd.map((b) => (
        <div key={b.id} style={{ marginBottom: '18px' }}>
          <h3>
            {b.id} – {b.tekst} <span className="admin-muted">(n = {b.antwoorden.length})</span>
          </h3>
          {b.antwoorden.length === 0 ? (
            <p className="admin-muted">Geen antwoorden.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {b.antwoorden.map((a) => (
                <li key={a.antwoordId} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px 12px', background: 'var(--off-white)', borderRadius: '8px', marginBottom: '6px' }}>
                  <span style={{ flex: 1, whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: a.tekst === GEANONIMISEERD ? 'var(--text-light)' : 'inherit' }}>
                    {a.tekst}
                  </span>
                  {a.tekst !== GEANONIMISEERD && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                      disabled={bezig === `${a.antwoordId}:${b.id}`}
                      onClick={() => anonimiseer(a.antwoordId, b.id)}
                    >
                      Anonimiseren
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
