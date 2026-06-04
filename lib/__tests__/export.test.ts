import { buildCsvBuffer } from '../export';

type MockReg = {
  id: string;
  activityId: string;
  naam: string;
  voornaam: string;
  email: string;
  telefoon: string;
  instelling: string;
  functie: string;
  extraData: Record<string, string>;
  createdAt: Date;
};

describe('buildCsvBuffer', () => {
  const registrations: MockReg[] = [
    {
      id: '1',
      activityId: 'act-1',
      naam: 'Janssen',
      voornaam: 'Jan',
      email: 'jan@test.be',
      telefoon: '0479',
      instelling: 'AZ Test',
      functie: 'Arts',
      extraData: { lunch: 'Ja' },
      createdAt: new Date('2026-01-01'),
    },
  ];

  it('generates CSV with header row', async () => {
    const csv = await buildCsvBuffer(registrations as any);
    const text = csv.toString('utf-8');
    expect(text).toContain('naam');
    expect(text).toContain('Janssen');
    expect(text).toContain('jan@test.be');
  });

  it('includes extra data fields in output', async () => {
    const csv = await buildCsvBuffer(registrations as any);
    const text = csv.toString('utf-8');
    expect(text).toContain('Ja');
  });
});
