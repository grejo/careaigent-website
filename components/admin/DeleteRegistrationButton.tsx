'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = { registrationId: string };

export default function DeleteRegistrationButton({ registrationId }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Inschrijving verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/registrations/${registrationId}`, { method: 'DELETE' });
    if (res.ok) {
      router.refresh();
    } else {
      alert('Verwijderen mislukt. Probeer opnieuw.');
      setDeleting(false);
    }
  }

  return (
    <button onClick={handleDelete} disabled={deleting} className="btn-danger-small">
      {deleting ? '…' : 'Verwijderen'}
    </button>
  );
}
