import { berekenStats, gemiddelde, nps } from '../stats';
import { KENNIS_CORRECT } from '../kennischeck.server';
import { valideerFormulier } from '../validatie';
import { geldigeAntwoorden } from './fixtures';

function rij(id: string, extra: Record<string, unknown> = {}) {
  const r = valideerFormulier({ antwoorden: { ...geldigeAntwoorden(), ...extra } });
  if (!r.ok) throw new Error(JSON.stringify(r.fouten));
  return { id, antwoorden: r.antwoorden, kennisScore: null, c1Opvolging: false };
}

describe('gemiddelde', () => {
  it('verbergt het gemiddelde bij n < 3', () => {
    expect(gemiddelde([4, 5])).toEqual({ n: 2, gem: null });
    expect(gemiddelde([4, 5, 3])).toEqual({ n: 3, gem: 4 });
  });
});

describe('nps', () => {
  it('berekent % promotors min % criticasters', () => {
    const r = nps([10, 9, 8, 6, 3]);
    expect(r.promotors).toBe(2);
    expect(r.criticasters).toBe(2);
    expect(r.passief).toBe(1);
    expect(r.score).toBe(0);
    expect(r.verdeling[10]).toBe(1);
  });
  it('geen score bij n < 3', () => {
    expect(nps([10, 10]).score).toBeNull();
  });
});

describe('berekenStats', () => {
  it('berekent leerwinst en sorteert op grootste winst', () => {
    const rijen = [rij('a', { L3_pre: 1, L3_post: 5 }), rij('b', { L3_pre: 1, L3_post: 5 }), rij('c', { L3_pre: 1, L3_post: 5 })];
    const s = berekenStats(rijen, KENNIS_CORRECT);
    expect(s.n).toBe(3);
    expect(s.leerwinst[0].id).toBe('L3');
    expect(s.leerwinst[0].verschil).toBe(4);
    expect(s.leerwinst[1].verschil).toBe(2);
  });

  it('telt drempels en verzamelt open antwoorden', () => {
    const rijen = [rij('a', { T4: ['Tijd', 'Budget'], O1: 'De quiz' }), rij('b', { T4: ['Tijd'] })];
    const s = berekenStats(rijen, KENNIS_CORRECT);
    expect(s.drempels[0]).toEqual({ label: 'Tijd', aantal: 2 });
    expect(s.open.find((o) => o.id === 'O1')?.antwoorden).toEqual([{ antwoordId: 'a', tekst: 'De quiz' }]);
    expect(s.reactie[0].gem).toBeNull(); // n = 2
  });
});
