'use client';
import { useState } from 'react';
import type { MailSoort } from '@prisma/client';
import MailSoortSectie from './MailSoortSectie';

export type MailSoortData = {
  soort: MailSoort;
  label: string;
  beschrijving: string;
  ontvangersUitleg: string;
  ontvangerModus: 'CONTEXT' | 'INSTELBAAR';
  replyToModus: 'CONTEXT' | 'INSTELBAAR';
  ontvangerVerplicht: boolean;
  standaard: { subject: string; intro: string; footerNote: string };
  tokens: string[];
  enabled: boolean;
  ontvangerEmail: string;
  replyToEmail: string;
  subject: string;
  intro: string;
  footerNote: string;
};

export type Melding = { kind: 'ok' | 'err'; text: string } | null;

export function MeldingBanner({ melding }: { melding: Melding }) {
  if (!melding) return null;
  return <p className={`admin-banner ${melding.kind}`}>{melding.text}</p>;
}

export default function MailClient({
  initialWebhookUrl,
  initialReplyTo,
  envFallback,
  mailSoorten,
}: {
  initialWebhookUrl: string;
  initialReplyTo: string;
  envFallback: boolean;
  mailSoorten: MailSoortData[];
}) {
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl);
  const [replyTo, setReplyTo] = useState(initialReplyTo);
  const [saving, setSaving] = useState(false);
  const [melding, setMelding] = useState<Melding>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testBezig, setTestBezig] = useState(false);
  const [testMelding, setTestMelding] = useState<Melding>(null);

  async function opslaan() {
    setSaving(true);
    setMelding(null);
    const res = await fetch('/api/admin/mail-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ powerAutomateWebhookUrl: webhookUrl, replyToEmail: replyTo }),
    });
    setSaving(false);
    const data = await res.json().catch(() => null);
    setMelding(res.ok ? { kind: 'ok', text: 'Opgeslagen.' } : { kind: 'err', text: data?.error ?? 'Opslaan mislukt' });
  }

  async function stuurTest() {
    setTestBezig(true);
    setTestMelding(null);
    const res = await fetch('/api/admin/mail-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toEmail: testEmail.trim() || undefined }),
    });
    setTestBezig(false);
    const data = await res.json().catch(() => null);
    setTestMelding(
      res.ok
        ? { kind: 'ok', text: `Testmail verstuurd naar ${data?.sentTo}.` }
        : { kind: 'err', text: data?.error ?? 'Verzenden mislukt' },
    );
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div className="admin-card">
        <h2>Webhook (globaal)</h2>
        <div className="form-group" style={{ marginTop: '12px' }}>
          <label htmlFor="webhook">Power Automate webhook-URL</label>
          <input
            id="webhook"
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://prod-XX.westeurope.logic.azure.com/workflows/..."
            style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
          />
          <p className="admin-muted" style={{ marginTop: '4px' }}>
            Enkel https en Power Automate/Azure-hosts (<code>*.logic.azure.com</code>, <code>*.powerplatform.com</code>, …).
            Leeg = geen enkele mail vertrekt.
          </p>
        </div>
        <div className="form-group">
          <label htmlFor="replyto">Globale reply-to (optioneel)</label>
          <input id="replyto" type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="careaigent@pxl.be" />
        </div>
        {envFallback && (
          <p className="admin-banner warn">
            Momenteel actief via de omgevingsvariabele <code>POWER_AUTOMATE_WEBHOOK_URL</code>. Sla hier een URL op om die te overschrijven.
          </p>
        )}
        <MeldingBanner melding={melding} />
        <button type="button" onClick={opslaan} disabled={saving} className="btn-primary">
          {saving ? 'Opslaan…' : 'Opslaan'}
        </button>
        <details style={{ marginTop: '16px' }}>
          <summary className="admin-muted" style={{ cursor: 'pointer' }}>Wat ontvangt de flow?</summary>
          <p className="admin-muted" style={{ marginTop: '8px' }}>
            Een POST met JSON <code>{'{ subject, htmlBody, ontvangers: [{ email, naam }], replyTo, context, attachments: [{ name, contentType, contentBytes }] }'}</code>.
            De bevestigingsmail bevat een .ics-bestand in <code>attachments</code> (base64); de mail zelf heeft
            ook een knop &lsquo;Toevoegen aan agenda&rsquo;, dus de flow hoeft de bijlage niet te verwerken.
          </p>
        </details>
      </div>

      <div className="admin-card">
        <h2>Webhook testen</h2>
        <p className="admin-muted">Stuurt een korte, generieke testmail via de bewaarde webhook.</p>
        <div className="admin-row" style={{ marginTop: '10px' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '220px', marginBottom: 0 }}>
            <label htmlFor="testmail">Ontvanger (leeg = jezelf)</label>
            <input id="testmail" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
          </div>
          <button type="button" onClick={stuurTest} disabled={testBezig} className="btn-secondary">
            {testBezig ? 'Versturen…' : 'Verstuur testmail'}
          </button>
        </div>
        <MeldingBanner melding={testMelding} />
      </div>

      {mailSoorten.map((d) => (
        <MailSoortSectie key={d.soort} data={d} />
      ))}
    </div>
  );
}
