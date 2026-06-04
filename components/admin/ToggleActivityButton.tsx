'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = { activityId: string; isOpen: boolean };

export default function ToggleActivityButton({ activityId, isOpen }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/admin/activities/${activityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen: !isOpen }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      alert('Kon status niet wijzigen.');
      setLoading(false);
    }
  }

  return (
    <button onClick={toggle} disabled={loading} className={isOpen ? 'btn-warning' : 'btn-success'}>
      {loading ? '…' : isOpen ? '🔒 Inschrijvingen sluiten' : '🔓 Inschrijvingen openen'}
    </button>
  );
}
