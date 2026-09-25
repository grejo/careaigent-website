const appSettings = { findUnique: jest.fn() };
const mailInstelling = { findUnique: jest.fn() };
jest.mock('../db', () => ({ prisma: { appSettings, mailInstelling } }));

import { MailSoort } from '@prisma/client';
import { sendMail } from '../mail';
import { MAIL_REGISTRY } from '../mailRegistry';

const WEBHOOK = 'https://prod-01.westeurope.logic.azure.com/workflows/test';

describe('sendMail', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 202, text: async () => '' });
    global.fetch = fetchMock as unknown as typeof fetch;
    appSettings.findUnique.mockResolvedValue({ powerAutomateWebhookUrl: WEBHOOK, replyToEmail: 'team@pxl.be' });
    mailInstelling.findUnique.mockResolvedValue(null);
  });

  it('post subject, html, ontvanger, reply-to en de .ics-bijlage naar de webhook', async () => {
    const ctx = MAIL_REGISTRY.INSCHRIJVING_BEVESTIGING.voorbeeldContext();
    const res = await sendMail(MailSoort.INSCHRIJVING_BEVESTIGING, ctx, { ontvangerEmail: 'an@voorbeeld.be', ontvangerNaam: 'An' });
    expect(res.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(WEBHOOK);
    const body = JSON.parse(init.body);
    expect(body.ontvangers).toEqual([{ email: 'an@voorbeeld.be', naam: 'An' }]);
    expect(body.replyTo).toBe('team@pxl.be');
    expect(body.subject).toContain('Bevestiging inschrijving');
    expect(body.attachments[0].name).toBe('uitnodiging.ics');
  });

  it('verstuurt niets als de mailsoort uit staat of geen ontvanger heeft', async () => {
    const def = MAIL_REGISTRY.INSCHRIJVING_MELDING_ADMIN;
    const res = await sendMail(MailSoort.INSCHRIJVING_MELDING_ADMIN, def.voorbeeldContext(), { replyToContext: 'x@y.be' });
    expect(res.ok).toBe(false); // defaultEnabled = false
    mailInstelling.findUnique.mockResolvedValue({ enabled: true, ontvangerEmail: null });
    const res2 = await sendMail(MailSoort.INSCHRIJVING_MELDING_ADMIN, def.voorbeeldContext(), { replyToContext: 'x@y.be' });
    expect(res2).toEqual({ ok: false, reason: 'Geen ontvangeradres ingesteld' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('gebruikt het ingestelde adres en de deelnemer als reply-to voor de admin-melding', async () => {
    mailInstelling.findUnique.mockResolvedValue({ enabled: true, ontvangerEmail: 'team@pxl.be', subject: 'Eigen: {voornaam}' });
    const def = MAIL_REGISTRY.INSCHRIJVING_MELDING_ADMIN;
    await sendMail(MailSoort.INSCHRIJVING_MELDING_ADMIN, def.voorbeeldContext(), { replyToContext: 'an@voorbeeld.be' });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.ontvangers[0].email).toBe('team@pxl.be');
    expect(body.replyTo).toBe('an@voorbeeld.be');
    expect(body.subject).toBe('Eigen: An');
  });

  it('testmodus zonder overrides gebruikt de opgeslagen teksten, ook als de mailsoort uit staat', async () => {
    mailInstelling.findUnique.mockResolvedValue({ enabled: false, subject: 'Handouts voor {voornaam}' });
    const def = MAIL_REGISTRY.DEELNEMER_EVALUATIE_UITNODIGING;
    const res = await sendMail(MailSoort.DEELNEMER_EVALUATIE_UITNODIGING, def.voorbeeldContext(), {
      test: { naar: { email: 'admin@pxl.be', naam: 'Admin' } },
    });
    expect(res.ok).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.subject).toBe('[TEST] Handouts voor An');
    expect(body.ontvangers).toEqual([{ email: 'admin@pxl.be', naam: 'Admin' }]);
    expect(body.context.test).toBe(true);
  });

  it('alsTest zet [TEST] voor het onderwerp van een gewone verzending', async () => {
    mailInstelling.findUnique.mockResolvedValue({ enabled: true, ontvangerEmail: 'team@pxl.be' });
    const def = MAIL_REGISTRY.EVALUATIE_MELDING_ADMIN;
    await sendMail(MailSoort.EVALUATIE_MELDING_ADMIN, def.voorbeeldContext(), { alsTest: true });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.subject).toMatch(/^\[TEST\] Nieuwe evaluatie/);
    expect(body.ontvangers[0].email).toBe('team@pxl.be');
  });

  it('faalt zacht bij een webhookfout', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'kapot' });
    const ctx = MAIL_REGISTRY.INSCHRIJVING_BEVESTIGING.voorbeeldContext();
    const res = await sendMail(MailSoort.INSCHRIJVING_BEVESTIGING, ctx, { ontvangerEmail: 'an@voorbeeld.be' });
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('500');
  });
});
