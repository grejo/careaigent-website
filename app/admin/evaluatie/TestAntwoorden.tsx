'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALLE_VRAGEN, type Antwoorden, type Antwoordwaarde } from '@/lib/evaluatie/formulierA';

type Rij = {
  id: string;
  datum: string;
  activiteit: string;
  activityId: string;
  antwoorden: Antwoorden;
  kennisScore: number | null;
  c1Opvolging: boolean;
};

function tekstVan(w: Antwoordwaarde | undefined): string | null {
  if (w === undefined || w === '' || (Array.isArray(w) && w.length === 0)) return null;
  return Array.isArray(w) ? w.join(', ') : String(w);
}

/** Antwoorden als leesbare lijst in de volgorde van het formulier (enkel ingevulde vragen). */
function regels(a: Antwoorden): { label: string; waarde: string }[] {
  const uit: { label: string; waarde: string }[] = [];
  const voeg = (label: string, w: Antwoordwaarde | undefined) => {
    const t = tekstVan(w);
    if (t !== null) uit.push({ label, waarde: t });
  };
  for (const v of ALLE_VRAGEN) {
    switch (v.type) {
      case 'email':
        break;
      case 'matrix':
        for (const r of v.rijen) for (const k of v.kolommen) voeg(`${v.id} ${r.label} – ${k.label}`, a[`${r.id}_${k.id}`]);
        break;
      case 'prepost':
        voeg(`${v.id} ${v.tekst} (vóór)`, a[`${v.id}_pre`]);
        voeg(`${v.id} ${v.tekst} (nu)`, a[`${v.id}_post`]);
        break;
      case 'single_met_andere':
      case 'multi_met_andere':
        voeg(`${v.id} ${v.tekst}`, a[v.id]);
        voeg(`${v.id} andere`, a[`${v.id}_anders`]);
        break;
      default:
        voeg(`${v.id} ${v.tekst}`, a[v.id]);
    }
  }
  return uit;
}

export default function TestAntwoorden({ activiteit, rijen }: { activiteit: string | null; rijen: Rij[] }) {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);
  const activiteitIds = Array.from(new Set(rijen.map((r) => r.activityId)));

  async function wis() {
    if (!window.confirm('Alle testantwoorden en testmails in deze selectie wissen? Je testlinks werken daarna niet meer.')) return;
    setBezig(true);
    const res = await Promise.all(
      activiteitIds.map((id) => fetch(`/api/admin/activities/${id}/deelnemers-mail/test`, { method: 'DELETE' })),
    );
    setBezig(false);
    if (res.every((r) => r.ok)) router.refresh();
    else alert('Wissen mislukt');
  }

  return (
    <div className="admin-card" id="test" style={{ marginTop: '20px', borderLeft: '4px solid var(--teal)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Testantwoorden ({rijen.length})</h2>
        <div className="admin-actions">
          <a
            href={`/api/admin/evaluatie/export?test=1${activiteit ? `&activiteit=${activiteit}` : ''}`}
            className="btn-secondary"
          >
            CSV van testantwoorden
          </a>
          <button type="button" className="btn-secondary" onClick={wis} disabled={bezig}>
            {bezig ? 'Bezig…' : 'Test wissen'}
          </button>
        </div>
      </div>
      <p className="admin-muted">
        Ingevuld via een testmail van een beheerder. Deze antwoorden tellen niet mee in de cijfers hierboven of in de
        gewone CSV-export.
      </p>
      {rijen.map((r) => (
        <details key={r.id} style={{ marginTop: '10px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--navy)' }}>
            {r.datum} · {r.activiteit} · kennischeck {r.kennisScore ?? '–'} / 3 · opvolging {r.c1Opvolging ? 'ja' : 'nee'}
          </summary>
          <table className="admin-table" style={{ marginTop: '8px' }}>
            <tbody>
              {regels(r.antwoorden).map((g) => (
                <tr key={g.label}>
                  <td style={{ width: '45%' }}>{g.label}</td>
                  <td>{g.waarde}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ))}
    </div>
  );
}
