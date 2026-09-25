'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = { registrationId: string; nietDeelgenomen: boolean };

/** Zet een inschrijving op "niet deelgenomen" of terug op "deelgenomen". */
export default function NietDeelgenomenButton({ registrationId, nietDeelgenomen }: Props) {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);

  async function wissel() {
    setBezig(true);
    const res = await fetch(`/api/admin/registrations/${registrationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nietDeelgenomen: !nietDeelgenomen }),
    });
    setBezig(false);
    if (res.ok) router.refresh();
    else alert('Aanpassen mislukt. Probeer opnieuw.');
  }

  return (
    <button
      type="button"
      onClick={wissel}
      disabled={bezig}
      className="btn-secondary"
      style={{ fontSize: '0.8rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
      title={nietDeelgenomen ? 'Toch deelgenomen: krijgt weer de deelnemersmail' : 'Niet komen opdagen: krijgt geen deelnemersmail'}
    >
      {bezig ? '…' : nietDeelgenomen ? 'Toch deelgenomen' : 'Niet deelgenomen'}
    </button>
  );
}
