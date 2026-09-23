'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type ActivityFlag = 'isOpen' | 'isHidden' | 'evaluatieOpen' | 'evaluatieOpenLink';

const LABELS: Record<ActivityFlag, { aan: string; uit: string }> = {
  isOpen: { aan: '🔒 Inschrijvingen sluiten', uit: '🔓 Inschrijvingen openen' },
  isHidden: { aan: '👁 Terug zichtbaar maken', uit: '🙈 Verbergen van de site' },
  evaluatieOpen: { aan: '⏹ Evaluatie sluiten', uit: '📝 Evaluatie openen' },
  evaluatieOpenLink: { aan: '🔗 Algemene link uitschakelen', uit: '🔗 Algemene link / QR toelaten' },
};

type Props = {
  activityId: string;
  field: ActivityFlag;
  value: boolean;
  /** Vraag bevestiging voor het omzetten. */
  confirm?: string;
  small?: boolean;
};

export default function ToggleActivityFlagButton({ activityId, field, value, confirm, small }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (confirm && !window.confirm(confirm)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/activities/${activityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !value }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert('Kon status niet wijzigen.');
    }
  }

  // 'Aan' zetten van isOpen/evaluatie is een positieve actie (groen),
  // uitzetten of verbergen een waarschuwing (oranje).
  const positief = field === 'isHidden' ? value : !value;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={positief ? 'btn-success' : 'btn-warning'}
      style={small ? { fontSize: '0.8rem', padding: '4px 10px' } : undefined}
    >
      {loading ? '…' : value ? LABELS[field].aan : LABELS[field].uit}
    </button>
  );
}
