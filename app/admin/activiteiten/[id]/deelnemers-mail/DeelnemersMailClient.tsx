'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Bijlage = {
  id: string;
  soort: 'BESTAND' | 'LINK';
  titel: string;
  bestandsnaam: string | null;
  grootte: number | null;
  url: string | null;
  uniek: number;
  totaal: number;
};

type Deelnemer = {
  id: string;
  email: string;
  naam: string | null;
  bron: string;
  aantalVerstuurd: number;
  laatstVerstuurdOp: string | null;
  evaluatieIngevuld: boolean;
  downloads: Record<string, number>;
};

export type ClientData = {
  activityId: string;
  evaluatieOpen: boolean;
  inschrijvingen: { email: string; naam: string }[];
  deelnemers: Deelnemer[];
  bijlagen: Bijlage[];
  /** Echte testmail naar de ingelogde beheerder; telt nergens mee. */
  test: {
    mijnEmail: string | null;
    ontvanger: {
      email: string;
      laatstVerstuurdOp: string | null;
      evaluatieIngevuld: boolean;
      downloads: Record<string, number>;
    } | null;
  };
};

type Rij = {
  email: string;
  naam: string | null;
  bron: 'INSCHRIJVING' | 'MANUEEL';
  deelnemer: Deelnemer | null;
};

type Melding = { kind: 'ok' | 'err' | 'warn'; text: string } | null;

const PORTIE = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function grootteLabel(bytes: number | null): string {
  if (!bytes) return '';
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} kB`;
}

export default function DeelnemersMailClient({ data }: { data: ClientData }) {
  const router = useRouter();
  const base = `/api/admin/activities/${data.activityId}`;

  // ── Ontvangerslijst: inschrijvingen ∪ eerder gemailde (ook manuele) adressen ──
  const [extraRijen, setExtraRijen] = useState<Rij[]>([]);
  const rijen: Rij[] = useMemo(() => {
    const perEmail = new Map<string, Rij>();
    for (const i of data.inschrijvingen) {
      if (!perEmail.has(i.email)) perEmail.set(i.email, { email: i.email, naam: i.naam, bron: 'INSCHRIJVING', deelnemer: null });
    }
    for (const d of data.deelnemers) {
      const bestaand = perEmail.get(d.email);
      perEmail.set(d.email, {
        email: d.email,
        naam: bestaand?.naam ?? d.naam,
        bron: bestaand?.bron ?? (d.bron === 'INSCHRIJVING' ? 'INSCHRIJVING' : 'MANUEEL'),
        deelnemer: d,
      });
    }
    for (const r of extraRijen) if (!perEmail.has(r.email)) perEmail.set(r.email, r);
    return Array.from(perEmail.values());
  }, [data.inschrijvingen, data.deelnemers, extraRijen]);

  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(
    () => new Set(data.inschrijvingen.map((i) => i.email).filter((e) => !data.deelnemers.some((d) => d.email === e))),
  );
  const [extraTekst, setExtraTekst] = useState('');
  const [extraMelding, setExtraMelding] = useState<Melding>(null);

  function toggle(email: string, aan: boolean) {
    setGeselecteerd((s) => {
      const n = new Set(s);
      if (aan) n.add(email);
      else n.delete(email);
      return n;
    });
  }

  function voegAdressenToe() {
    const kandidaten = extraTekst
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const ongeldig = kandidaten.filter((e) => !EMAIL_RE.test(e));
    const geldig = Array.from(new Set(kandidaten.filter((e) => EMAIL_RE.test(e))));
    const nieuw = geldig.filter((e) => !rijen.some((r) => r.email === e));
    setExtraRijen((r) => [...r, ...nieuw.map((email) => ({ email, naam: null, bron: 'MANUEEL' as const, deelnemer: null }))]);
    setGeselecteerd((s) => new Set([...Array.from(s), ...geldig]));
    setExtraTekst(ongeldig.join('\n'));
    setExtraMelding(
      ongeldig.length
        ? { kind: 'err', text: `${ongeldig.length} ongeldig adres(sen) bleven staan in het veld.` }
        : { kind: 'ok', text: `${geldig.length} adres(sen) toegevoegd en aangevinkt.` },
    );
  }

  // ── Inhoud ──
  const [metEvaluatie, setMetEvaluatie] = useState(data.evaluatieOpen);
  const [bijlageIds, setBijlageIds] = useState<string[]>(data.bijlagen.map((b) => b.id));
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);

  useEffect(() => {
    let actief = true;
    const t = setTimeout(async () => {
      const res = await fetch(`${base}/deelnemers-mail/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metEvaluatie, bijlageIds }),
      });
      if (actief && res.ok) setPreview(await res.json());
    }, 250);
    return () => {
      actief = false;
      clearTimeout(t);
    };
  }, [base, metEvaluatie, bijlageIds]);

  // ── Verzenden ──
  const [bezig, setBezig] = useState(false);
  const [voortgang, setVoortgang] = useState({ klaar: 0, totaal: 0 });
  const [resultaten, setResultaten] = useState<Record<string, { ok: boolean; reason?: string }>>({});
  const [verzendMelding, setVerzendMelding] = useState<Melding>(null);

  const ontvangers = rijen.filter((r) => geselecteerd.has(r.email));

  async function verstuur() {
    if (ontvangers.length === 0) return;
    if (!metEvaluatie && bijlageIds.length === 0) {
      setVerzendMelding({ kind: 'err', text: 'Kies de evaluatielink en/of minstens één bijlage.' });
      return;
    }
    if (!window.confirm(`De mail versturen naar ${ontvangers.length} ${ontvangers.length === 1 ? 'persoon' : 'personen'}?`)) return;

    setBezig(true);
    setVerzendMelding(null);
    setResultaten({});
    setVoortgang({ klaar: 0, totaal: ontvangers.length });
    let ok = 0;
    let fout = 0;
    for (let i = 0; i < ontvangers.length; i += PORTIE) {
      const portie = ontvangers.slice(i, i + PORTIE);
      const res = await fetch(`${base}/deelnemers-mail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ontvangers: portie.map((r) => ({ email: r.email, naam: r.naam, bron: r.bron })),
          metEvaluatie,
          bijlageIds,
        }),
      }).catch(() => null);
      const body = res ? await res.json().catch(() => null) : null;
      if (!res?.ok || !body?.resultaten) {
        const reden = body?.error ?? 'Verzenden mislukt';
        setResultaten((r) => ({ ...r, ...Object.fromEntries(portie.map((p) => [p.email, { ok: false, reason: reden }])) }));
        fout += portie.length;
        if (res && res.status < 500) break; // validatiefout: stoppen
      } else {
        const lijst = body.resultaten as { email: string; ok: boolean; reason?: string }[];
        setResultaten((r) => ({ ...r, ...Object.fromEntries(lijst.map((x) => [x.email, { ok: x.ok, reason: x.reason }])) }));
        ok += lijst.filter((x) => x.ok).length;
        fout += lijst.filter((x) => !x.ok).length;
      }
      setVoortgang({ klaar: Math.min(i + PORTIE, ontvangers.length), totaal: ontvangers.length });
    }
    setBezig(false);
    setVerzendMelding({
      kind: fout ? (ok ? 'warn' : 'err') : 'ok',
      text: `${ok} mail(s) verstuurd${fout ? `, ${fout} niet verstuurd (zie de lijst)` : ''}.`,
    });
    setExtraRijen([]);
    router.refresh();
  }

  // ── Echte testmail naar mezelf ──
  const [testMetEvaluatie, setTestMetEvaluatie] = useState(true);
  const [testBezig, setTestBezig] = useState(false);
  const [testMelding, setTestMelding] = useState<Melding>(null);

  async function stuurTest() {
    if (!testMetEvaluatie && bijlageIds.length === 0) {
      setTestMelding({ kind: 'err', text: 'Kies de evaluatielink en/of minstens één bijlage.' });
      return;
    }
    setTestBezig(true);
    setTestMelding(null);
    const res = await fetch(`${base}/deelnemers-mail/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metEvaluatie: testMetEvaluatie, bijlageIds }),
    }).catch(() => null);
    const body = res ? await res.json().catch(() => null) : null;
    setTestBezig(false);
    if (!res?.ok) {
      setTestMelding({ kind: 'err', text: body?.error ?? 'Verzenden mislukt' });
      return;
    }
    setTestMelding({ kind: 'ok', text: `Testmail verstuurd naar ${body.sentTo}. Open ze in je mailbox en doorloop alles zoals een deelnemer.` });
    router.refresh();
  }

  async function wisTest() {
    if (!window.confirm('Testmail, testdownloads en testantwoorden van deze activiteit wissen? Je testlinks werken daarna niet meer.')) return;
    const res = await fetch(`${base}/deelnemers-mail/test`, { method: 'DELETE' });
    if (res.ok) {
      setTestMelding({ kind: 'ok', text: 'Test gewist.' });
      router.refresh();
    } else setTestMelding({ kind: 'err', text: 'Wissen mislukt' });
  }

  // ── Bijlagen beheren ──
  const [bijlageMelding, setBijlageMelding] = useState<Melding>(null);
  const [uploadBezig, setUploadBezig] = useState(false);
  const [linkTitel, setLinkTitel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get('file');
    if (!(file instanceof File) || file.size === 0) return;
    if (file.size > 4 * 1024 * 1024) {
      setBijlageMelding({ kind: 'err', text: 'Bestand is groter dan 4 MB. Plak in dat geval een link (bv. OneDrive).' });
      return;
    }
    setUploadBezig(true);
    setBijlageMelding(null);
    const res = await fetch(`${base}/bijlagen`, { method: 'POST', body: fd });
    setUploadBezig(false);
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setBijlageMelding({ kind: 'err', text: body?.error ?? 'Opladen mislukt' });
      return;
    }
    form.reset();
    if (body?.id) setBijlageIds((ids) => [...ids, body.id]);
    setBijlageMelding({ kind: 'ok', text: 'Bijlage opgeladen.' });
    router.refresh();
  }

  async function voegLinkToe(e: React.FormEvent) {
    e.preventDefault();
    setBijlageMelding(null);
    const res = await fetch(`${base}/bijlagen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soort: 'LINK', titel: linkTitel, url: linkUrl }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setBijlageMelding({ kind: 'err', text: body?.error ?? 'Toevoegen mislukt' });
      return;
    }
    setLinkTitel('');
    setLinkUrl('');
    if (body?.id) setBijlageIds((ids) => [...ids, body.id]);
    setBijlageMelding({ kind: 'ok', text: 'Link toegevoegd.' });
    router.refresh();
  }

  async function verwijderBijlage(b: Bijlage) {
    if (!window.confirm(`“${b.titel}” verwijderen? Links in al verstuurde mails werken dan niet meer.`)) return;
    const res = await fetch(`${base}/bijlagen/${b.id}`, { method: 'DELETE' });
    if (res.ok) {
      setBijlageIds((ids) => ids.filter((x) => x !== b.id));
      router.refresh();
    } else setBijlageMelding({ kind: 'err', text: 'Verwijderen mislukt' });
  }

  async function wisAdressen() {
    if (
      !window.confirm(
        'Alle e-mailadressen en per-persoon statistieken van deze activiteit wissen? De totalen per bijlage blijven bewaard. Persoonlijke evaluatie- en downloadlinks werken daarna niet meer.',
      )
    )
      return;
    const res = await fetch(`${base}/deelnemers-mail`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else alert('Wissen mislukt');
  }

  // ── Samenvatting ──
  const gemaild = data.deelnemers.filter((d) => d.aantalVerstuurd > 0);
  const ingevuld = gemaild.filter((d) => d.evaluatieIngevuld).length;

  const selecteer = (filter: (r: Rij) => boolean) => setGeselecteerd(new Set(rijen.filter(filter).map((r) => r.email)));

  return (
    <div>
      {/* Samenvatting */}
      <div className="admin-card">
        <h2>Overzicht</h2>
        <div className="admin-grid-2" style={{ marginTop: '12px' }}>
          <div>
            <div className="eval-kpi">
              {ingevuld} / {gemaild.length}
            </div>
            <div className="admin-muted">gemailde personen vulden de evaluatie in</div>
          </div>
          {data.bijlagen.map((b) => (
            <div key={b.id}>
              <div className="eval-kpi">
                {b.uniek} / {gemaild.length}
              </div>
              <div className="admin-muted">
                personen downloadden <strong>{b.titel}</strong> ({b.totaal} keer in totaal)
              </div>
            </div>
          ))}
        </div>
        <p className="admin-muted" style={{ marginTop: '12px', marginBottom: 0 }}>
          Een download telt pas als de downloadpagina in de browser opent. Automatische linkcontroles van
          virusscanners tellen daardoor meestal niet mee.
        </p>
      </div>

      {/* Bijlagen */}
      <div className="admin-card">
        <h2>Bijlagen</h2>
        <p className="admin-muted">
          Bestanden tot 4 MB (pdf, docx, pptx, xlsx, png, jpg) of een link (OneDrive, SharePoint, YouTube…). In de mail
          staat één knop naar een persoonlijke handoutpagina met alle gekozen documenten, zodat je per document ziet wie het opende.
        </p>
        {data.bijlagen.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0' }}>
            {data.bijlagen.map((b) => (
              <li key={b.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderBottom: '1px solid var(--light-gray)' }}>
                <span>{b.soort === 'LINK' ? '🔗' : '📄'}</span>
                <strong style={{ color: 'var(--navy)' }}>{b.titel}</strong>
                <span className="admin-muted">
                  {b.soort === 'LINK' ? b.url : `${b.bestandsnaam ?? ''} · ${grootteLabel(b.grootte)}`}
                </span>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                  <a href={`${base}/bijlagen/${b.id}`} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }} target="_blank" rel="noopener noreferrer">
                    Bekijken
                  </a>
                  <button type="button" className="btn-danger-small" onClick={() => verwijderBijlage(b)}>
                    Verwijderen
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="admin-grid-2" style={{ marginTop: '12px' }}>
          <form onSubmit={upload}>
            <h3 style={{ marginTop: 0 }}>Bestand opladen</h3>
            <div className="form-group">
              <label htmlFor="bijlage-titel">Titel in de mail (optioneel)</label>
              <input id="bijlage-titel" name="titel" type="text" maxLength={200} placeholder="bv. Slides AI-Ambassadeur (pdf)" />
            </div>
            <div className="form-group">
              <label htmlFor="bijlage-file">Bestand</label>
              <input id="bijlage-file" name="file" type="file" required accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg" />
            </div>
            <button type="submit" className="btn-secondary" disabled={uploadBezig}>
              {uploadBezig ? 'Opladen…' : 'Opladen'}
            </button>
          </form>
          <form onSubmit={voegLinkToe}>
            <h3 style={{ marginTop: 0 }}>Link plakken</h3>
            <div className="form-group">
              <label htmlFor="link-titel">Titel in de mail</label>
              <input id="link-titel" type="text" required maxLength={200} value={linkTitel} onChange={(e) => setLinkTitel(e.target.value)} placeholder="bv. Opname van de sessie" />
            </div>
            <div className="form-group">
              <label htmlFor="link-url">URL</label>
              <input id="link-url" type="url" required value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
            </div>
            <button type="submit" className="btn-secondary">Link toevoegen</button>
          </form>
        </div>
        {bijlageMelding && <p className={`admin-banner ${bijlageMelding.kind}`}>{bijlageMelding.text}</p>}
      </div>

      {/* Inhoud */}
      <div className="admin-card">
        <h2>Inhoud van de mail</h2>
        <div className="form-group" style={{ marginTop: '12px' }}>
          <label className="radio-label">
            <input type="checkbox" checked={metEvaluatie} disabled={!data.evaluatieOpen} onChange={(e) => setMetEvaluatie(e.target.checked)} />
            Persoonlijke evaluatielink toevoegen (één keer bruikbaar; wie al invulde krijgt geen nieuwe link)
          </label>
          {!data.evaluatieOpen && (
            <p className="admin-banner warn">De evaluatie staat dicht. Open ze bovenaan om de link mee te sturen.</p>
          )}
          {data.bijlagen.map((b) => (
            <label key={b.id} className="radio-label">
              <input
                type="checkbox"
                checked={bijlageIds.includes(b.id)}
                onChange={(e) => setBijlageIds((ids) => (e.target.checked ? [...ids, b.id] : ids.filter((x) => x !== b.id)))}
              />
              Op de handoutpagina: {b.titel}
            </label>
          ))}
        </div>
        <p className="admin-muted">
          Onderwerp en tekst pas je aan in <a href="/admin/mail" style={{ color: 'var(--teal)' }}>Admin › Mail</a> (mailsoort
          &lsquo;Mail naar deelnemers&rsquo;).
        </p>
        {preview && (
          <>
            <p className="admin-muted" style={{ fontFamily: 'monospace' }}>Onderwerp: {preview.subject}</p>
            <iframe title="Voorbeeld deelnemersmail" srcDoc={preview.html} className="admin-preview" sandbox="" />
          </>
        )}
      </div>

      {/* Echte test */}
      <div className="admin-card" style={{ borderLeft: '4px solid var(--teal)' }}>
        <h2>Echte test naar mezelf</h2>
        <p className="admin-muted">
          Verstuurt deze mail met een echte evaluatielink en een echte handoutpagina naar{' '}
          <strong>{data.test.mijnEmail ?? 'je eigen adres'}</strong>, met &lsquo;[TEST]&rsquo; in het onderwerp. Je
          downloads en je antwoorden tellen nergens mee. De testlink werkt ook als de evaluatie nog dicht staat, en je
          kan de test zo vaak herhalen als je wil. De bijlagen hierboven gelden ook voor de test.
        </p>
        <label className="radio-label">
          <input type="checkbox" checked={testMetEvaluatie} onChange={(e) => setTestMetEvaluatie(e.target.checked)} />
          Evaluatielink meesturen
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          <button type="button" className="btn-primary" onClick={stuurTest} disabled={testBezig || !data.test.mijnEmail}>
            {testBezig ? 'Versturen…' : 'Stuur testmail naar mij'}
          </button>
          {data.test.ontvanger && (
            <>
              <a href={`/admin/evaluatie?activiteit=${data.activityId}#test`} className="btn-secondary">
                Bekijk testantwoorden
              </a>
              <button type="button" className="btn-secondary" onClick={wisTest}>
                Test wissen
              </button>
            </>
          )}
        </div>
        {testMelding && <p className={`admin-banner ${testMelding.kind}`}>{testMelding.text}</p>}
        {data.test.ontvanger && (
          <ul className="admin-muted" style={{ margin: '12px 0 0', paddingLeft: '18px' }}>
            <li>
              Laatst verstuurd:{' '}
              {data.test.ontvanger.laatstVerstuurdOp
                ? new Date(data.test.ontvanger.laatstVerstuurdOp).toLocaleString('nl-BE')
                : 'nog niet (verzending mislukt)'}
            </li>
            <li>Evaluatie ingevuld: {data.test.ontvanger.evaluatieIngevuld ? 'ja' : 'nee'}</li>
            {data.bijlagen.map((b) => (
              <li key={b.id}>
                {b.titel}: {data.test.ontvanger?.downloads[b.id] ?? 0} keer gedownload
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Ontvangers */}
      <div className="admin-card">
        <h2>Ontvangers bevestigen</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '10px 0' }}>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={() => selecteer(() => true)}>
            Iedereen
          </button>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={() => selecteer(() => false)}>
            Niemand
          </button>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={() => selecteer((r) => !r.deelnemer || r.deelnemer.aantalVerstuurd === 0)}>
            Nog niet gemaild
          </button>
          <button type="button" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={() => selecteer((r) => Boolean(r.deelnemer && r.deelnemer.aantalVerstuurd > 0 && !r.deelnemer.evaluatieIngevuld))}>
            Herinnering: gemaild maar nog niet ingevuld
          </button>
        </div>

        <div className="admin-table-card" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th aria-label="Selecteren" />
                <th>Naam</th>
                <th>E-mail</th>
                <th>Bron</th>
                <th>Verstuurd</th>
                <th>Evaluatie</th>
                {data.bijlagen.map((b) => (
                  <th key={b.id} title={b.titel}>↓ {b.titel.length > 18 ? `${b.titel.slice(0, 18)}…` : b.titel}</th>
                ))}
                <th>Resultaat</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((r) => {
                const d = r.deelnemer;
                const res = resultaten[r.email];
                return (
                  <tr key={r.email}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Selecteer ${r.email}`}
                        checked={geselecteerd.has(r.email)}
                        onChange={(e) => toggle(r.email, e.target.checked)}
                      />
                    </td>
                    <td>{r.naam ?? '—'}</td>
                    <td>{r.email}</td>
                    <td>{r.bron === 'INSCHRIJVING' ? 'Inschrijving' : 'Manueel'}</td>
                    <td>
                      {d && d.aantalVerstuurd > 0
                        ? `${d.aantalVerstuurd}× · ${new Date(d.laatstVerstuurdOp!).toLocaleDateString('nl-BE')}`
                        : '—'}
                    </td>
                    <td>{d?.evaluatieIngevuld ? '✅ ingevuld' : d && d.aantalVerstuurd > 0 ? 'nog niet' : '—'}</td>
                    {data.bijlagen.map((b) => (
                      <td key={b.id}>{d?.downloads[b.id] ? `✅ ${d.downloads[b.id]}×` : '—'}</td>
                    ))}
                    <td>
                      {res ? (
                        res.ok ? (
                          <span style={{ color: '#2e7d32' }}>✓ verstuurd</span>
                        ) : (
                          <span style={{ color: '#b71c1c' }}>{res.reason ?? 'mislukt'}</span>
                        )
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {rijen.length === 0 && (
                <tr>
                  <td colSpan={7 + data.bijlagen.length} style={{ textAlign: 'center', color: 'var(--text-mid)' }}>
                    Nog geen inschrijvingen. Voeg hieronder manueel adressen toe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label htmlFor="extra-adressen">Extra adressen (gescheiden door komma, puntkomma of nieuwe regel)</label>
          <textarea id="extra-adressen" rows={3} value={extraTekst} onChange={(e) => setExtraTekst(e.target.value)} placeholder="naam@instelling.be" />
        </div>
        <button type="button" className="btn-secondary" onClick={voegAdressenToe} disabled={!extraTekst.trim()}>
          Toevoegen aan de lijst
        </button>
        {extraMelding && <p className={`admin-banner ${extraMelding.kind}`}>{extraMelding.text}</p>}

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--light-gray)' }}>
          {bezig && (
            <div style={{ marginBottom: '10px' }}>
              <div className="admin-progress">
                <span style={{ width: `${voortgang.totaal ? (voortgang.klaar / voortgang.totaal) * 100 : 0}%` }} />
              </div>
              <p className="admin-muted">
                {voortgang.klaar} van {voortgang.totaal} verwerkt…
              </p>
            </div>
          )}
          {verzendMelding && <p className={`admin-banner ${verzendMelding.kind}`}>{verzendMelding.text}</p>}
          <button type="button" className="btn-primary" onClick={verstuur} disabled={bezig || ontvangers.length === 0}>
            {bezig ? 'Versturen…' : `✉ Versturen naar ${ontvangers.length} ${ontvangers.length === 1 ? 'persoon' : 'personen'}`}
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h2>Privacy</h2>
        <p className="admin-muted">
          De evaluatie-antwoorden zijn nooit gekoppeld aan deze adressen: je ziet enkel <em>dat</em> iemand invulde, niet
          wat. Wis de adressen als de opvolging voorbij is; de totalen per bijlage blijven bewaard.
        </p>
        <button type="button" className="btn-danger-small" onClick={wisAdressen} disabled={data.deelnemers.length === 0}>
          E-mailadressen van deze activiteit wissen ({data.deelnemers.length})
        </button>
      </div>
    </div>
  );
}
