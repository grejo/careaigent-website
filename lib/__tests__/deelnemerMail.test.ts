const deelnemerMail = { update: jest.fn() };
jest.mock('../db', () => ({ prisma: { deelnemerMail } }));
const sendDeelnemerUitnodiging = jest.fn();
jest.mock('../mail', () => ({ sendDeelnemerUitnodiging: (...a: unknown[]) => sendDeelnemerUitnodiging(...a) }));

import { handoutsVoor, verstuurNaarDeelnemer } from '../deelnemerMail';

const activiteit = { id: 'a1', slug: 's', title: 'T', dateStart: new Date() };
const dm = {
  id: 'd1',
  email: 'an@voorbeeld.be',
  naam: 'An Peeters',
  downloadToken: 'dl',
  bijlageIds: ['b1'],
  evaluatieIngevuld: false,
};
const bijlagen = [
  { id: 'b1', titel: 'Slides' },
  { id: 'b2', titel: 'Werkblad' },
];

describe('handoutsVoor', () => {
  it('geeft één pagina met alle titels, of null zonder bijlagen', () => {
    expect(handoutsVoor('dl', bijlagen)).toEqual({ url: expect.stringMatching(/\/d\/dl$/), titels: ['Slides', 'Werkblad'] });
    expect(handoutsVoor('dl', [])).toBeNull();
  });
});

describe('verstuurNaarDeelnemer', () => {
  beforeEach(() => {
    deelnemerMail.update.mockReset();
    sendDeelnemerUitnodiging.mockReset().mockResolvedValue({ ok: true });
  });

  it('bewaart na verzending de unie van de bijlagen en de hash van het nieuwe token', async () => {
    await verstuurNaarDeelnemer(dm, activiteit, bijlagen, true);
    const ctx = sendDeelnemerUitnodiging.mock.calls[0][1];
    expect(ctx.evaluatieUrl).toMatch(/\/evaluatie\/t\/[A-Za-z0-9_-]{40,}$/);
    expect(ctx.handouts.titels).toEqual(['Slides', 'Werkblad']);
    const data = deelnemerMail.update.mock.calls[0][0].data;
    expect(data.bijlageIds).toEqual(['b1', 'b2']);
    expect(data.evalTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(data.evaluatieIngevuld).toBeUndefined();
  });

  it('bewaart niets als de mail niet vertrok', async () => {
    sendDeelnemerUitnodiging.mockResolvedValue({ ok: false, reason: 'webhook' });
    const res = await verstuurNaarDeelnemer(dm, activiteit, bijlagen, true, { test: true });
    expect(res.ok).toBe(false);
    expect(deelnemerMail.update).not.toHaveBeenCalled();
  });

  it('een test krijgt ook na invullen een nieuwe link en wordt terug op "niet ingevuld" gezet', async () => {
    await verstuurNaarDeelnemer({ ...dm, evaluatieIngevuld: true }, activiteit, [], true, { test: true });
    expect(sendDeelnemerUitnodiging.mock.calls[0][2]).toEqual({ test: true });
    expect(deelnemerMail.update.mock.calls[0][0].data.evaluatieIngevuld).toBe(false);
  });

  it('een gewone ontvanger die al invulde krijgt geen nieuwe link', async () => {
    const res = await verstuurNaarDeelnemer({ ...dm, evaluatieIngevuld: true }, activiteit, [], true);
    expect(res).toEqual({ ok: false, reason: 'Evaluatie al ingevuld' });
    expect(sendDeelnemerUitnodiging).not.toHaveBeenCalled();
  });
});
