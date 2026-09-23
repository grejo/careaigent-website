import { buildEvaluatieCsv } from '../export';

describe('buildEvaluatieCsv', () => {
  it('begint met een BOM, gebruikt vraag-ID’s als kolommen en ; als scheiding', () => {
    const buf = buildEvaluatieCsv([
      {
        activiteit: 'AI-Ambassadeur',
        datum: new Date('2026-09-22T00:00:00Z'),
        formVersie: 'A-2026-09',
        antwoorden: { P2: 'Innovatiecoördinator', T4: ['Tijd', 'Budget'], B1_relevantie: 5 },
        kennisScore: 2,
      },
    ]);
    expect(Array.from(buf.subarray(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    const tekst = buf.subarray(3).toString('utf-8');
    const [kop, rij] = tekst.trim().split('\n');
    expect(kop.split(';')).toEqual(expect.arrayContaining(['P2', 'R1', 'B1_relevantie', 'L1_pre', 'L1_post', 'kennisScore']));
    expect(kop).not.toContain('C2');
    expect(new Set(kop.split(';')).size).toBe(kop.split(';').length);
    expect(rij).toContain('Innovatiecoördinator');
    expect(rij).toContain('"Tijd; Budget"');
  });
});
