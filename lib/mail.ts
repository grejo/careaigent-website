// Mailing via een Power Automate-webhook, zelfde patroon als de
// Bibliotheektool en de Verpleegkunde-site. De site bouwt onderwerp + HTML en
// POST't { subject, htmlBody, ontvangers, replyTo, context, attachments } naar
// de flow, die de mail verstuurt. Webhook-URL uit AppSettings (instelbaar in
// /admin/mail), met env POWER_AUTOMATE_WEBHOOK_URL als terugval. Faalt altijd
// zacht: de aanroeper krijgt { ok, reason } terug, nooit een exception.
import { MailSoort } from '@prisma/client';
import { prisma } from './db';
import { renderEmail, type MailTekstOverrides } from './emailTemplate';
import { validateWebhookUrl } from './webhook-url';
import {
  MAIL_REGISTRY,
  type MailAttachment,
  type MailContextMap,
  type InschrijvingBevestigingContext,
  type InschrijvingMeldingContext,
  type EvaluatieMeldingContext,
  type DeelnemerUitnodigingContext,
} from './mailRegistry';

export type Ontvanger = { email: string; naam: string };
export type MailResultaat = { ok: boolean; reason?: string };

const WEBHOOK_TIMEOUT_MS = 5000;

async function getAppSettings() {
  try {
    return await prisma.appSettings.findUnique({ where: { id: 'singleton' } });
  } catch {
    return null;
  }
}

async function getMailInstelling(soort: MailSoort) {
  try {
    return await prisma.mailInstelling.findUnique({ where: { soort } });
  } catch {
    return null;
  }
}

async function deliver(
  subject: string,
  htmlBody: string,
  ontvangers: Ontvanger[],
  context: Record<string, unknown>,
  replyToOverride?: string,
  attachments?: MailAttachment[],
): Promise<MailResultaat> {
  if (ontvangers.length === 0) return { ok: false, reason: 'Geen ontvangers' };

  const settings = await getAppSettings();
  const webhookUrl = settings?.powerAutomateWebhookUrl || process.env.POWER_AUTOMATE_WEBHOOK_URL || null;
  if (!webhookUrl) {
    console.log('[MAIL] Geen webhook-URL, mailing overgeslagen:', subject);
    return { ok: false, reason: 'Geen webhook-URL ingesteld (Admin › Mail)' };
  }
  const check = validateWebhookUrl(webhookUrl);
  if (!check.ok) {
    console.error('[MAIL] Webhook-URL geweigerd:', check.error);
    return { ok: false, reason: `Webhook-URL geweigerd: ${check.error}` };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        htmlBody,
        ontvangers,
        replyTo: replyToOverride || settings?.replyToEmail || undefined,
        context,
        attachments: attachments ?? [],
      }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[MAIL] Webhook gaf status', res.status, text);
      return { ok: false, reason: `Webhook gaf status ${res.status}${text ? ` – ${text.slice(0, 300)}` : ''}` };
    }
    return { ok: true };
  } catch (err) {
    console.error('[MAIL] Fout bij versturen:', err);
    return { ok: false, reason: err instanceof Error ? err.message : 'Onbekende fout' };
  }
}

export type SendMailOpts = {
  ontvangerEmail?: string;
  ontvangerNaam?: string;
  replyToContext?: string;
  /** Testmodus: negeert `enabled`, gebruikt de meegegeven teksten en stuurt enkel naar `naar`. */
  test?: { naar: Ontvanger; overrides?: MailTekstOverrides };
};

/** Legt de instelling per mailsoort over de standaard en levert af. */
export async function sendMail<S extends MailSoort>(
  soort: S,
  ctx: MailContextMap[S],
  opts: SendMailOpts = {},
): Promise<MailResultaat> {
  const def = MAIL_REGISTRY[soort];
  const instelling = await getMailInstelling(soort);
  const instelbareReplyTo = instelling?.replyToEmail?.trim() || undefined;
  const replyTo = def.replyToModus === 'CONTEXT' ? opts.replyToContext : instelbareReplyTo;
  const bijlagen = def.bijlagen?.(ctx);

  if (opts.test) {
    const built = def.build(ctx, opts.test.overrides);
    return deliver(
      `[TEST] ${built.subject}`,
      built.html,
      [opts.test.naar],
      { ...def.payloadContext(ctx), test: true },
      replyTo,
      bijlagen,
    );
  }

  if (!(instelling?.enabled ?? def.defaultEnabled)) {
    return { ok: false, reason: `${def.label} staat uit in Admin › Mail` };
  }

  let ontvangers: Ontvanger[];
  if (def.ontvangerModus === 'INSTELBAAR') {
    const email = instelling?.ontvangerEmail?.trim();
    if (!email) return { ok: false, reason: 'Geen ontvangeradres ingesteld' };
    ontvangers = [{ email, naam: def.ontvangerNaamVast ?? def.label }];
  } else {
    ontvangers = opts.ontvangerEmail ? [{ email: opts.ontvangerEmail, naam: opts.ontvangerNaam ?? '' }] : [];
  }

  const overrides: MailTekstOverrides | undefined = instelling
    ? { subject: instelling.subject, intro: instelling.intro, footerNote: instelling.footerNote }
    : undefined;
  const built = def.build(ctx, overrides);
  return deliver(built.subject, built.html, ontvangers, def.payloadContext(ctx), replyTo, bijlagen);
}

/** "Stuur deze mail naar mij" in /admin/mail: voorbeelddata, niet-opgeslagen teksten. */
export async function sendMailVoorbeeldTest(
  soort: MailSoort,
  naar: Ontvanger,
  overrides?: MailTekstOverrides,
): Promise<MailResultaat> {
  const ctx = MAIL_REGISTRY[soort].voorbeeldContext();
  return sendMail(soort, ctx as never, { test: { naar, overrides } });
}

export function sendInschrijvingBevestiging(email: string, ctx: InschrijvingBevestigingContext) {
  return sendMail(MailSoort.INSCHRIJVING_BEVESTIGING, ctx, {
    ontvangerEmail: email,
    ontvangerNaam: `${ctx.voornaam} ${ctx.naam}`,
  });
}

export function sendInschrijvingMelding(ctx: InschrijvingMeldingContext) {
  return sendMail(MailSoort.INSCHRIJVING_MELDING_ADMIN, ctx, { replyToContext: ctx.email });
}

export function sendEvaluatieMelding(ctx: EvaluatieMeldingContext) {
  return sendMail(MailSoort.EVALUATIE_MELDING_ADMIN, ctx);
}

export function sendDeelnemerUitnodiging(to: Ontvanger, ctx: DeelnemerUitnodigingContext) {
  return sendMail(MailSoort.DEELNEMER_EVALUATIE_UITNODIGING, ctx, {
    ontvangerEmail: to.email,
    ontvangerNaam: to.naam,
  });
}

/** Generieke testmail, los van elke mailsoort: bewijst dat de webhook werkt. */
export async function sendWebhookTestMail(toEmail: string, naam: string): Promise<MailResultaat> {
  const built = renderEmail({
    subject: 'Testmail – CareAIgent',
    eyebrow: 'Test',
    heading: 'Testmail geslaagd',
    intro:
      'Deze mail is verstuurd vanuit Admin › Mail op careaigent.be via de ingestelde Power Automate-webhook. Als je dit leest, werkt de configuratie.',
    badge: { text: 'Test', kind: 'info' },
    detailRows: [
      { label: 'Ontvanger', waarde: `${naam} <${toEmail}>` },
      { label: 'Verstuurd op', waarde: new Date().toLocaleString('nl-BE', { timeZone: 'Europe/Brussels' }) },
    ],
    footerNote: 'Automatische testmail, geen actie nodig.',
  });
  return deliver(built.subject, built.html, [{ email: toEmail, naam }], { type: 'TEST_MAIL' });
}
