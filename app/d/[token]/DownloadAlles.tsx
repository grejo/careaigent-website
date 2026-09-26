'use client';
import { useState } from 'react';
import { maakZip, uniekeNamen, type ZipBestand } from '@/lib/zip';

type Bijlage = { id: string; soort: 'BESTAND' | 'LINK'; titel: string; bestandsnaam: string | null };

/**
 * Haalt alle documenten op via dezelfde getrackte route als de losse knoppen
 * (elke download telt per document) en bundelt ze in de browser tot één zip.
 * Links kunnen niet in een zip; die komen samen in "Links.txt".
 */
export default function DownloadAlles({ token, zipNaam, bijlagen }: { token: string; zipNaam: string; bijlagen: Bijlage[] }) {
  const [status, setStatus] = useState<{ bezig: boolean; tekst: string; fout?: boolean }>({ bezig: false, tekst: '' });

  async function start() {
    setStatus({ bezig: true, tekst: 'Voorbereiden…' });
    const bestanden: { naam: string; data: Uint8Array }[] = [];
    const links: string[] = [];
    const mislukt: string[] = [];

    for (let i = 0; i < bijlagen.length; i++) {
      const b = bijlagen[i];
      setStatus({ bezig: true, tekst: `Document ${i + 1} van ${bijlagen.length} ophalen…` });
      try {
        const res = await fetch(`/api/download/${encodeURIComponent(token)}/${encodeURIComponent(b.id)}`, {
          method: 'POST',
        });
        const data = res.ok ? await res.json() : null;
        if (!data?.url) throw new Error('niet gevonden');
        if (b.soort === 'LINK') {
          links.push(`${b.titel}\r\n${data.url}\r\n`);
          continue;
        }
        const bestand = await fetch(data.url, { signal: AbortSignal.timeout(60000) });
        if (!bestand.ok) throw new Error(`status ${bestand.status}`);
        bestanden.push({ naam: b.bestandsnaam || b.titel, data: new Uint8Array(await bestand.arrayBuffer()) });
      } catch {
        mislukt.push(b.titel);
      }
    }

    const namen = uniekeNamen([...bestanden.map((b) => b.naam), ...(links.length ? ['Links.txt'] : [])]);
    const inhoud: ZipBestand[] = bestanden.map((b, i) => ({ naam: namen[i], data: b.data }));
    if (links.length) inhoud.push({ naam: namen[namen.length - 1], data: new TextEncoder().encode(links.join('\r\n')) });

    if (inhoud.length === 0) {
      setStatus({ bezig: false, tekst: 'Downloaden mislukt. Probeer de documenten afzonderlijk.', fout: true });
      return;
    }

    const blob = new Blob([maakZip(inhoud)], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipNaam;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);

    setStatus({
      bezig: false,
      tekst: mislukt.length
        ? `Zip gedownload, maar dit lukte niet: ${mislukt.join(', ')}. Probeer die afzonderlijk.`
        : `Zip met ${inhoud.length} ${inhoud.length === 1 ? 'bestand' : 'bestanden'} gedownload.`,
      fout: mislukt.length > 0,
    });
  }

  return (
    <div style={{ marginTop: '12px' }}>
      <button type="button" className="btn-submit" onClick={start} disabled={status.bezig}>
        {status.bezig ? 'Bezig…' : `↓ Download alles (${bijlagen.length}) als zip`}
      </button>
      {status.tekst && (
        <p style={{ marginTop: '8px', fontSize: '0.9rem', color: status.fout ? '#b71c1c' : 'var(--mid-gray)' }} role="status">
          {status.tekst}
        </p>
      )}
    </div>
  );
}
