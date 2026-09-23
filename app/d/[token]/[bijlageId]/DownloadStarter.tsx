'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function DownloadStarter({ token, bijlageId, isLink }: { token: string; bijlageId: string; isLink: boolean }) {
  const [status, setStatus] = useState<'bezig' | 'klaar' | 'fout'>('bezig');
  const gestart = useRef(false);

  const start = useCallback(async () => {
    setStatus('bezig');
    const res = await fetch(`/api/download/${encodeURIComponent(token)}/${encodeURIComponent(bijlageId)}`, { method: 'POST' }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    if (!data?.url) {
      setStatus('fout');
      return;
    }
    window.location.href = data.url;
    setStatus('klaar');
  }, [token, bijlageId]);

  useEffect(() => {
    if (gestart.current) return;
    gestart.current = true;
    start();
  }, [start]);

  return (
    <>
      <p>
        {status === 'bezig' && (isLink ? 'Je wordt doorgestuurd…' : 'Je download start…')}
        {status === 'klaar' && (isLink ? 'Je wordt doorgestuurd. Gebeurt er niets? Gebruik de knop hieronder.' : 'Je download is gestart. Niets gebeurd? Gebruik de knop hieronder.')}
        {status === 'fout' && 'Er ging iets mis. Probeer het opnieuw.'}
      </p>
      <p style={{ marginTop: '16px' }}>
        <button type="button" className="btn-submit" onClick={start}>
          {isLink ? 'Open de link' : 'Download opnieuw'}
        </button>
      </p>
    </>
  );
}
