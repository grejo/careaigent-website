const deelnemerMail = { findUnique: jest.fn() };
jest.mock('@/lib/db', () => ({ prisma: { deelnemerMail } }));

import { bepaalToegang } from '../opslag';

const TOKEN = 'a'.repeat(43);
const activiteit = { id: 'a1', slug: 's', title: 'T', dateStart: new Date(), evaluatieOpen: false, evaluatieOpenLink: false };

describe('bepaalToegang met persoonlijk token', () => {
  it('weigert een gewone link als de evaluatie dicht staat', async () => {
    deelnemerMail.findUnique.mockResolvedValue({ id: 'd1', evaluatieIngevuld: false, isTest: false, activity: activiteit });
    expect(await bepaalToegang({ token: TOKEN })).toEqual({ ok: false, reden: 'gesloten' });
  });

  it('laat een testlink toe als de evaluatie dicht staat en markeert hem als test', async () => {
    deelnemerMail.findUnique.mockResolvedValue({ id: 'd1', evaluatieIngevuld: false, isTest: true, activity: activiteit });
    const t = await bepaalToegang({ token: TOKEN });
    expect(t).toMatchObject({ ok: true, deelnemerMailId: 'd1', isTest: true });
  });

  it('een ingevulde testlink is ook eenmalig', async () => {
    deelnemerMail.findUnique.mockResolvedValue({ id: 'd1', evaluatieIngevuld: true, isTest: true, activity: activiteit });
    expect(await bepaalToegang({ token: TOKEN })).toEqual({ ok: false, reden: 'al_ingevuld' });
  });
});
