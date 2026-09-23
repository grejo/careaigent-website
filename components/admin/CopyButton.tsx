'use client';
import { useState } from 'react';

export default function CopyButton({ text, label = 'Kopiëren' }: { text: string; label?: string }) {
  const [gekopieerd, setGekopieerd] = useState(false);
  async function kopieer() {
    try {
      await navigator.clipboard.writeText(text);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 1500);
    } catch {
      window.prompt('Kopieer deze link:', text);
    }
  }
  return (
    <button type="button" onClick={kopieer} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
      {gekopieerd ? '✓ Gekopieerd' : label}
    </button>
  );
}
