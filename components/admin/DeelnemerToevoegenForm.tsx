'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  activityId: string;
  /** Vooraf ingevuld e-mailadres, bv. bij een adres dat al manueel gemaild werd. */
  standaardEmail?: string;
  /** Formulier meteen open tonen. */
  startOpen?: boolean;
  /** Na succesvol toevoegen (vóór de refresh), met het genormaliseerde adres. */
  onToegevoegd?: (email: string) => void;
};

const LEEG = { voornaam: '', naam: '', email: '', instelling: '', functie: '', telefoon: '' };
type Velden = typeof LEEG;

const VELDEN: { key: keyof Velden; label: string; type?: string; verplicht?: boolean }[] = [
  { key: 'voornaam', label: 'Voornaam', verplicht: true },
  { key: 'naam', label: 'Naam', verplicht: true },
  { key: 'email', label: 'E-mail', type: 'email', verplicht: true },
  { key: 'instelling', label: 'Organisatie', verplicht: true },
  { key: 'functie', label: 'Functie' },
  { key: 'telefoon', label: 'Telefoon', type: 'tel' },
];

/**
 * Voegt een deelnemer manueel toe als inschrijving (zonder bevestigingsmail).
 * Telt daarna overal mee zoals een gewone inschrijving.
 */
export default function DeelnemerToevoegenForm({ activityId, standaardEmail, startOpen = false, onToegevoegd }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [velden, setVelden] = useState<Velden>({ ...LEEG, email: standaardEmail ?? '' });
  const [fouten, setFouten] = useState<Partial<Record<keyof Velden | 'general', string>>>({});
  const [melding, setMelding] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  async function opslaan(e: React.FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFouten({});
    setMelding(null);
    const res = await fetch(`/api/admin/activities/${activityId}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(velden),
    });
    const json = await res.json().catch(() => ({}));
    setBezig(false);
    if (!res.ok) {
      setFouten(json.errors ?? { general: json.error ?? 'Toevoegen mislukt. Probeer opnieuw.' });
      return;
    }
    setMelding(`${velden.voornaam} ${velden.naam} is toegevoegd.`);
    setVelden(LEEG);
    onToegevoegd?.(json.email);
    router.refresh();
  }

  if (!open) {
    return (
      <div>
        <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
          + Deelnemer toevoegen
        </button>
        {melding && <p className="admin-banner ok">{melding}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={opslaan} className="admin-table-card" style={{ padding: '16px 20px' }} noValidate>
      <strong style={{ color: 'var(--navy)' }}>Deelnemer manueel toevoegen</strong>
      <p className="admin-muted" style={{ marginTop: '4px' }}>
        Wordt opgeslagen als inschrijving, zonder bevestigingsmail. Telefoon en functie zijn optioneel.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px', marginTop: '12px' }}>
        {VELDEN.map((v) => (
          <div className="form-group" key={v.key} style={{ marginBottom: '12px' }}>
            <label htmlFor={`deelnemer-${v.key}`}>
              {v.label}
              {v.verplicht && ' *'}
            </label>
            <input
              id={`deelnemer-${v.key}`}
              type={v.type ?? 'text'}
              value={velden[v.key]}
              required={v.verplicht}
              onChange={(e) => setVelden((s) => ({ ...s, [v.key]: e.target.value }))}
            />
            {fouten[v.key] && <span style={{ color: '#b71c1c', fontSize: '0.8rem' }}>{fouten[v.key]}</span>}
          </div>
        ))}
      </div>
      {fouten.general && <p className="admin-banner err">{fouten.general}</p>}
      {melding && <p className="admin-banner ok">{melding}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" className="btn-primary" disabled={bezig}>
          {bezig ? 'Opslaan…' : 'Toevoegen'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => { setOpen(false); setFouten({}); setMelding(null); }}>
          Sluiten
        </button>
      </div>
    </form>
  );
}
