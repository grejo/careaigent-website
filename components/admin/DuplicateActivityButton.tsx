'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DuplicateActivityButton({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    if (!confirm('Activiteit kopiëren?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activities/${activityId}/duplicate`, {
        method: 'POST',
      });
      if (res.ok) {
        const { id } = await res.json();
        router.push(`/admin/activiteiten/${id}`);
      } else {
        alert('Kopiëren mislukt. Probeer opnieuw.');
        setLoading(false);
      }
    } catch {
      alert('Netwerkfout. Probeer opnieuw.');
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="btn-secondary"
      style={{ fontSize: '0.8rem', padding: '4px 10px' }}
    >
      {loading ? '…' : 'Kopieer'}
    </button>
  );
}
