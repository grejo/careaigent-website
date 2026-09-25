import type { Registration } from '@prisma/client';
import { buildCsvBuffer } from '../export';

const basis: Registration = {
  id: 'r1',
  activityId: 'a1',
  naam: 'Peeters',
  voornaam: 'An',
  email: 'an@voorbeeld.be',
  telefoon: '0470',
  instelling: 'WZC',
  functie: 'Manager',
  extraData: {},
  nietDeelgenomen: false,
  createdAt: new Date('2026-09-01T08:00:00Z'),
};

describe('inschrijvingen-export', () => {
  it('bevat een kolom deelgenomen (ja/nee)', async () => {
    const csv = (await buildCsvBuffer([basis, { ...basis, id: 'r2', email: 'jan@voorbeeld.be', nietDeelgenomen: true }])).toString();
    const [kop, rij1, rij2] = csv.trim().split('\n');
    expect(kop.split(',')).toContain('deelgenomen');
    expect(rij1).toContain(',ja,');
    expect(rij2).toContain(',nee,');
  });
});
