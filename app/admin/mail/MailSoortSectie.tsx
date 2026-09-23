'use client';
import { useEffect, useRef, useState } from 'react';
import { MeldingBanner, type MailSoortData, type Melding } from './MailClient';

type Veld = 'subject' | 'intro' | 'footerNote';

export default function MailSoortSectie({ data }: { data: MailSoortData }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(data.enabled);
  const [ontvangerEmail, setOntvangerEmail] = useState(data.ontvangerEmail);
  const [replyToEmail, setReplyToEmail] = useState(data.replyToEmail);
  const [subject, setSubject] = useState(data.subject);
  const [intro, setIntro] = useState(data.intro);
  const [footerNote, setFooterNote] = useState(data.footerNote);
  const [laatsteVeld, setLaatsteVeld] = useState<Veld>('intro');

  const [saving, setSaving] = useState(false);
  const [melding, setMelding] = useState<Melding>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testBezig, setTestBezig] = useState(false);
  const [testMelding, setTestMelding] = useState<Melding>(null);

  const [previewSubject, setPreviewSubject] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewPayload, setPreviewPayload] = useState<unknown>(null);

  const subjectRef = useRef<HTMLInputElement>(null);
  const introRef = useRef<HTMLTextAreaElement>(null);
  const footerRef = useRef<HTMLTextAreaElement>(null);
  const velden = {
    subject: { waarde: subject, zet: setSubject, ref: subjectRef },
    intro: { waarde: intro, zet: setIntro, ref: introRef },
    footerNote: { waarde: footerNote, zet: setFooterNote, ref: footerRef },
  } as const;

  function voegTokenIn(token: string) {
    const veld = velden[laatsteVeld];
    const el = veld.ref.current;
    const start = el?.selectionStart ?? veld.waarde.length;
    const eind = el?.selectionEnd ?? veld.waarde.length;
    const invoeging = `{${token}}`;
    veld.zet(veld.waarde.slice(0, start) + invoeging + veld.waarde.slice(eind));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + invoeging.length, start + invoeging.length);
    });
  }

  // Voorbeeld loopt mee tijdens het typen (debounced), enkel als de kaart open is.
  useEffect(() => {
    if (!open) return;
    let actief = true;
    const timer = setTimeout(async () => {
      const res = await fetch('/api/admin/mail-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soort: data.soort,
          subject: subject || undefined,
          intro: intro || undefined,
          footerNote: footerNote || undefined,
        }),
      });
      if (!actief || !res.ok) return;
      const json = await res.json();
      setPreviewSubject(json.subject);
      setPreviewHtml(json.html);
      setPreviewPayload(json.payload);
    }, 400);
    return () => {
      actief = false;
      clearTimeout(timer);
    };
  }, [open, data.soort, subject, intro, footerNote]);

  async function opslaan() {
    setSaving(true);
    setMelding(null);
    const res = await fetch(`/api/admin/mail-settings/soort/${data.soort}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, ontvangerEmail, replyToEmail, subject, intro, footerNote }),
    });
    setSaving(false);
    const body = await res.json().catch(() => null);
    setMelding(res.ok ? { kind: 'ok', text: 'Opgeslagen.' } : { kind: 'err', text: body?.error ?? 'Opslaan mislukt' });
  }

  async function stuurTest() {
    setTestBezig(true);
    setTestMelding(null);
    const res = await fetch('/api/admin/mail-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        soort: data.soort,
        toEmail: testEmail.trim() || undefined,
        subject: subject || undefined,
        intro: intro || undefined,
        footerNote: footerNote || undefined,
      }),
    });
    setTestBezig(false);
    const body = await res.json().catch(() => null);
    setTestMelding(
      res.ok
        ? { kind: 'ok', text: `Testmail verstuurd naar ${body?.sentTo}.` }
        : { kind: 'err', text: body?.error ?? 'Verzenden mislukt' },
    );
  }

  const id = (v: string) => `${data.soort}-${v}`;

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <button type="button" className="admin-collapse" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <div>
            <h2 style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span aria-hidden>{open ? '▾' : '▸'}</span> {data.label}
              <span className={`admin-pill${enabled ? '' : ' off'}`}>{enabled ? 'Aan' : 'Uit'}</span>
            </h2>
            <p className="admin-muted" style={{ margin: 0 }}>{data.beschrijving}</p>
          </div>
        </button>
        <label style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Actief
        </label>
      </div>

      {open && (
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--light-gray)', paddingTop: '16px' }}>
          <p className="admin-muted">Ontvangers: {data.ontvangersUitleg}</p>
          <div className="admin-grid-2">
            {data.ontvangerModus === 'INSTELBAAR' && (
              <div className="form-group">
                <label htmlFor={id('ontvanger')}>
                  Ontvangeradres{data.ontvangerVerplicht && enabled ? ' (verplicht)' : ''}
                </label>
                <input id={id('ontvanger')} type="email" value={ontvangerEmail} onChange={(e) => setOntvangerEmail(e.target.value)} placeholder="careaigent@pxl.be" />
              </div>
            )}
            {data.replyToModus === 'INSTELBAAR' && (
              <div className="form-group">
                <label htmlFor={id('replyto')}>Reply-to (optioneel)</label>
                <input id={id('replyto')} type="email" value={replyToEmail} onChange={(e) => setReplyToEmail(e.target.value)} placeholder="leeg = globale reply-to" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor={id('subject')}>Onderwerp</label>
            <input ref={subjectRef} id={id('subject')} type="text" value={subject} onFocus={() => setLaatsteVeld('subject')} onChange={(e) => setSubject(e.target.value)} placeholder={data.standaard.subject} />
          </div>
          <div className="form-group">
            <label htmlFor={id('intro')}>Inleidende tekst</label>
            <textarea ref={introRef} id={id('intro')} rows={5} value={intro} onFocus={() => setLaatsteVeld('intro')} onChange={(e) => setIntro(e.target.value)} placeholder={data.standaard.intro} />
          </div>
          <div className="form-group">
            <label htmlFor={id('footer')}>Slottekst</label>
            <textarea ref={footerRef} id={id('footer')} rows={2} value={footerNote} onFocus={() => setLaatsteVeld('footerNote')} onChange={(e) => setFooterNote(e.target.value)} placeholder={data.standaard.footerNote} />
          </div>
          <p className="admin-muted">Leeg laten = de standaardtekst (grijs in het veld).</p>
          {data.tokens.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', margin: '8px 0 12px' }}>
              <span className="admin-muted">Placeholders:</span>
              {data.tokens.map((t) => (
                <button key={t} type="button" className="admin-token" onClick={() => voegTokenIn(t)}>{`{${t}}`}</button>
              ))}
            </div>
          )}
          <MeldingBanner melding={melding} />
          <button type="button" onClick={opslaan} disabled={saving} className="btn-primary">
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>

          <h3>Voorbeeld</h3>
          <p className="admin-muted" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>Onderwerp: {previewSubject}</p>
          <iframe title={`Voorbeeld – ${data.label}`} srcDoc={previewHtml} className="admin-preview" sandbox="" />
          <details style={{ marginTop: '8px' }}>
            <summary className="admin-muted" style={{ cursor: 'pointer' }}>Payload die Power Automate ontvangt</summary>
            <pre style={{ fontSize: '0.75rem', background: 'var(--off-white)', padding: '12px', borderRadius: '6px', overflowX: 'auto' }}>
              {JSON.stringify(previewPayload, null, 2)}
            </pre>
          </details>

          <h3>Testmail</h3>
          <p className="admin-muted">
            Verstuurt deze mail met voorbeeldgegevens en de tekst hierboven, ook als ze uit staat. Enkel naar het opgegeven adres.
          </p>
          <div className="admin-row">
            <div className="form-group" style={{ flex: 1, minWidth: '220px', marginBottom: 0 }}>
              <label htmlFor={id('test')}>Ontvanger (leeg = jezelf)</label>
              <input id={id('test')} type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
            </div>
            <button type="button" onClick={stuurTest} disabled={testBezig} className="btn-secondary">
              {testBezig ? 'Versturen…' : 'Stuur deze mail naar mij'}
            </button>
          </div>
          <MeldingBanner melding={testMelding} />
        </div>
      )}
    </div>
  );
}
