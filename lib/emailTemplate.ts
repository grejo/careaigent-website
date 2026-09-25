// CareAIgent-gestylede HTML-mails (dependency-vrij, e-mailveilig: table-layout
// + inline CSS). Zelfde patroon als de Bibliotheektool en de Verpleegkunde-site.

const NAVY = '#002841';
const TEAL = '#219ABD';
const TEAL_DARK = '#1A7A97';
const LICHTBLAUW = '#E8F4F9';
const OFF_WHITE = '#F4F8FB';
const TEKST = '#3D5A6B';
const TEKST_DONKER = '#001B2B';
const RAND = '#D0DDE5';
const MUTED = '#5A7080';

type BadgeKind = 'success' | 'danger' | 'info';

const BADGE_STIJL: Record<BadgeKind, { bg: string; tekst: string }> = {
  success: { bg: '#E7F2E3', tekst: '#2E6B1F' },
  danger: { bg: '#FBEAEA', tekst: '#A32D2D' },
  info: { bg: LICHTBLAUW, tekst: TEAL_DARK },
};

export type EmailKnop = { label: string; url: string };

export type EmailContent = {
  subject: string;
  eyebrow: string;
  heading: string;
  intro: string;
  badge?: { text: string; kind: BadgeKind };
  detailRows?: { label: string; waarde: string; link?: string }[];
  feedback?: string | null;
  ctaLabel?: string;
  ctaUrl?: string;
  /** Extra (secundaire) knoppen onder de hoofdknop, bv. downloads. */
  knoppenTitel?: string;
  knoppen?: EmailKnop[];
  /** Korte opsomming onder de knoppen, bv. welke documenten op de handoutpagina staan. */
  knoppenLijst?: string[];
  footerNote?: string;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Enkel http(s)-URL's; al het andere wordt '#'. */
export function safeHref(value: string): string {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '#';
    return escapeHtml(parsed.toString());
  } catch {
    return '#';
  }
}

export function renderEmail(c: EmailContent): { subject: string; html: string } {
  const intro = escapeHtml(c.intro).replace(/\n/g, '<br>');
  const badge = c.badge
    ? `<div style="display:inline-block;margin-bottom:14px;padding:5px 12px;border-radius:6px;font-size:12px;font-weight:bold;background:${BADGE_STIJL[c.badge.kind].bg};color:${BADGE_STIJL[c.badge.kind].tekst};">${escapeHtml(c.badge.text)}</div><br>`
    : '';
  const detailBox =
    c.detailRows && c.detailRows.length > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${LICHTBLAUW};border-radius:8px;margin:0 0 22px;">
        <tr><td style="padding:18px 20px;border-left:4px solid ${TEAL};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${c.detailRows
              .map((r) => {
                const value = r.link
                  ? `<a href="${safeHref(r.link)}" style="color:${TEAL_DARK};text-decoration:underline;word-break:break-all;">${escapeHtml(r.waarde)}</a>`
                  : escapeHtml(r.waarde);
                return `<tr><td style="padding:5px 0;color:${MUTED};width:150px;font-size:14px;vertical-align:top;">${escapeHtml(r.label)}</td><td style="padding:5px 0;font-weight:bold;font-size:14px;color:${TEKST_DONKER};word-break:break-word;">${value}</td></tr>`;
              })
              .join('')}
          </table>
        </td></tr>
      </table>`
      : '';
  const feedbackBox = c.feedback
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td style="padding:14px 18px;background:${OFF_WHITE};border-left:4px solid ${RAND};border-radius:8px;">
        <div style="font-size:14px;color:${TEKST};line-height:1.5;">${escapeHtml(c.feedback).replace(/\n/g, '<br>')}</div>
      </td></tr></table>`
    : '';
  const cta =
    c.ctaLabel && c.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;"><tr><td style="background:${TEAL};border-radius:6px;">
        <a href="${safeHref(c.ctaUrl)}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;">${escapeHtml(c.ctaLabel)}</a>
      </td></tr></table>`
      : '';
  const knoppen =
    c.knoppen && c.knoppen.length > 0
      ? `${c.knoppenTitel ? `<div style="font-size:13px;font-weight:bold;color:${NAVY};margin:8px 0 10px;">${escapeHtml(c.knoppenTitel)}</div>` : ''}
        ${c.knoppen
          .map(
            (k) =>
              `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;"><tr><td style="border:1px solid ${TEAL};border-radius:6px;">
            <a href="${safeHref(k.url)}" style="display:inline-block;padding:10px 20px;font-size:14px;font-weight:bold;color:${TEAL_DARK};text-decoration:none;">&#8595; ${escapeHtml(k.label)}</a>
          </td></tr></table>`,
          )
          .join('')}`
      : '';
  const knoppenLijst =
    c.knoppenLijst && c.knoppenLijst.length > 0
      ? `<ul style="margin:4px 0 0;padding-left:20px;font-size:14px;line-height:1.6;color:${TEKST};">${c.knoppenLijst
          .map((t) => `<li>${escapeHtml(t)}</li>`)
          .join('')}</ul>`
      : '';
  const footerNote = escapeHtml(
    c.footerNote || 'Dit is een automatisch bericht van CareAIgent – PXL Zorginnovatie.',
  ).replace(/\n/g, '<br>');

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(c.subject)}</title></head>
<body style="margin:0;padding:0;background:${OFF_WHITE};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${OFF_WHITE};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:8px;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif;color:${TEKST_DONKER};">
    <tr><td style="background:${NAVY};padding:22px 32px;">
      <span style="color:#FFFFFF;font-size:22px;font-weight:bold;letter-spacing:0.3px;">Care<span style="color:${TEAL};">AI</span>gent</span>
    </td></tr>
    <tr><td style="height:4px;line-height:4px;font-size:0;background:${TEAL};">&nbsp;</td></tr>
    <tr><td style="padding:32px;">
      <div style="font-size:12px;font-weight:bold;color:${TEAL_DARK};letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">${escapeHtml(c.eyebrow)}</div>
      ${badge}
      <div style="font-size:24px;font-weight:bold;line-height:1.25;margin-bottom:14px;color:${NAVY};">${escapeHtml(c.heading)}</div>
      <p style="font-size:15px;line-height:1.6;color:${TEKST};margin:0 0 22px;">${intro}</p>
      ${detailBox}
      ${feedbackBox}
      ${cta}
      ${knoppen}
      ${knoppenLijst}
    </td></tr>
    <tr><td style="border-top:1px solid ${RAND};padding:20px 32px;">
      <p style="font-size:12px;line-height:1.5;color:${MUTED};margin:0;">${footerNote}</p>
      <p style="font-size:12px;color:${MUTED};margin:8px 0 0;">&copy; CareAIgent · PXL Zorginnovatie</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
  return { subject: c.subject, html };
}

// ─── Instelbare teksten ──────────────────────────────────────────────────────

export type MailTekstOverrides = {
  subject?: string | null;
  intro?: string | null;
  footerNote?: string | null;
};

export type MailStandaardTeksten = { subject: string; intro: string; footerNote: string };

/**
 * Vervangt `{token}`-placeholders. Onbekende tokens blijven letterlijk staan,
 * zodat een typfout zichtbaar is in het voorbeeld. Waarden worden hier NIET
 * geëscaped: `renderEmail` escapet het resultaat al.
 */
export function applyTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (volledig, naam: string) =>
    Object.prototype.hasOwnProperty.call(tokens, naam) ? tokens[naam] ?? '' : volledig,
  );
}

export function resolveTeksten(
  standaard: MailStandaardTeksten,
  overrides: MailTekstOverrides | undefined,
  tokens: Record<string, string>,
): MailStandaardTeksten {
  return {
    subject: applyTokens(overrides?.subject?.trim() || standaard.subject, tokens),
    intro: applyTokens(overrides?.intro?.trim() || standaard.intro, tokens),
    footerNote: applyTokens(overrides?.footerNote?.trim() || standaard.footerNote, tokens),
  };
}

// ─── Datumhulp ───────────────────────────────────────────────────────────────

export function formatDatum(d: Date): string {
  return d.toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Brussels',
  });
}

export function formatUur(d: Date): string {
  return d.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' });
}
