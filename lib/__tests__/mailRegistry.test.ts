import { MailSoort } from '@prisma/client';
import { applyTokens, renderEmail, resolveTeksten } from '../emailTemplate';
import { MAIL_REGISTRY, MAIL_SOORT_VOLGORDE } from '../mailRegistry';
import { validateWebhookUrl } from '../webhook-url';

describe('emailTemplate', () => {
  it('escapet inhoud en blokkeert niet-http links', () => {
    const { html } = renderEmail({
      subject: 'x',
      eyebrow: 'e',
      heading: '<script>alert(1)</script>',
      intro: 'a & b',
      ctaLabel: 'klik',
      ctaUrl: 'javascript:alert(1)',
    });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('a &amp; b');
    expect(html).toContain('href="#"');
  });

  it('vervangt tokens en laat onbekende staan', () => {
    expect(applyTokens('Dag {voornaam}, {onbekend}', { voornaam: 'An' })).toBe('Dag An, {onbekend}');
    const t = resolveTeksten({ subject: 'S {x}', intro: 'I', footerNote: 'F' }, { subject: '  ', intro: 'Eigen {x}' }, { x: '1' });
    expect(t).toEqual({ subject: 'S 1', intro: 'Eigen 1', footerNote: 'F' });
  });
});

describe('MAIL_REGISTRY', () => {
  it('heeft een entry en volgorde voor elke mailsoort', () => {
    expect(new Set(MAIL_SOORT_VOLGORDE)).toEqual(new Set(Object.values(MailSoort)));
  });

  it.each(Object.values(MailSoort))('%s bouwt met voorbeelddata', (soort) => {
    const def = MAIL_REGISTRY[soort];
    const built = def.build(def.voorbeeldContext() as never);
    expect(built.subject).not.toMatch(/\{[a-z]+\}/i);
    expect(built.html).toContain('<!DOCTYPE html>');
  });

  it('evaluatiemelding bevat geen antwoorden of e-mailadressen', () => {
    const def = MAIL_REGISTRY.EVALUATIE_MELDING_ADMIN;
    const { html } = def.build(def.voorbeeldContext());
    expect(html).not.toMatch(/[\w.-]+@[\w.-]+\.\w+/);
  });

  it('deelnemersmail toont evaluatieknop en één handoutknop met de documentenlijst', () => {
    const def = MAIL_REGISTRY.DEELNEMER_EVALUATIE_UITNODIGING;
    const { html } = def.build(def.voorbeeldContext());
    expect(html).toContain('Vul de evaluatie in');
    expect(html.match(/Download de handouts/g)).toHaveLength(1);
    expect(html).toContain('/d/voorbeeld"');
    expect(html).toContain('/evaluatie/t/voorbeeld"');
    expect(html).toContain('<li>Slides AI-Ambassadeur (pdf)</li>');
    expect(html).toContain('<li>Werkblad prompts (docx)</li>');
  });

  it('deelnemersmail zonder bijlagen heeft geen handoutknop', () => {
    const def = MAIL_REGISTRY.DEELNEMER_EVALUATIE_UITNODIGING;
    const { html } = def.build({ ...def.voorbeeldContext(), handouts: null });
    expect(html).not.toContain('Download de handouts');
  });

  it('bevestiging voegt een .ics-bijlage toe', () => {
    const def = MAIL_REGISTRY.INSCHRIJVING_BEVESTIGING;
    const [ics] = def.bijlagen!(def.voorbeeldContext());
    expect(ics.name).toBe('uitnodiging.ics');
    expect(Buffer.from(ics.contentBytes, 'base64').toString()).toContain('BEGIN:VCALENDAR');
  });
});

describe('validateWebhookUrl', () => {
  it('laat enkel https Power Automate-hosts toe', () => {
    expect(validateWebhookUrl('https://prod-12.westeurope.logic.azure.com/workflows/x').ok).toBe(true);
    expect(validateWebhookUrl('http://prod-12.westeurope.logic.azure.com/x').ok).toBe(false);
    expect(validateWebhookUrl('https://evil.example.com/x').ok).toBe(false);
    expect(validateWebhookUrl('https://127.0.0.1/x').ok).toBe(false);
  });
});
