// Pure berekeningen voor het evaluatiedashboard. Gemiddelden worden verborgen
// (null) zolang n < MIN_N, om herleidbaarheid te vermijden.
import { ALLE_VRAGEN, OPEN_VRAGEN, type Antwoorden, type Vraag } from './formulierA';

export const MIN_N = 3;

export type Gemiddelde = { n: number; gem: number | null };
export type Telling = { label: string; aantal: number };

type Rij = { id: string; antwoorden: Antwoorden; kennisScore: number | null; c1Opvolging: boolean };

function getallen(rijen: Rij[], key: string): number[] {
  return rijen.map((r) => r.antwoorden[key]).filter((v): v is number => typeof v === 'number');
}

export function gemiddelde(waarden: number[]): Gemiddelde {
  const n = waarden.length;
  if (n < MIN_N) return { n, gem: null };
  return { n, gem: Math.round((waarden.reduce((s, v) => s + v, 0) / n) * 100) / 100 };
}

function vraag(id: string): Vraag {
  const v = ALLE_VRAGEN.find((x) => x.id === id);
  if (!v) throw new Error(`Onbekende vraag ${id}`);
  return v;
}

function opties(id: string): string[] {
  const v = vraag(id);
  return 'opties' in v ? v.opties : [];
}

/** Aantal keer gekozen per optie (ook voor multi-select), in configvolgorde. */
export function verdeling(rijen: Rij[], id: string): Telling[] {
  const tel = new Map<string, number>(opties(id).map((o) => [o, 0]));
  for (const r of rijen) {
    const v = r.antwoorden[id];
    const lijst = Array.isArray(v) ? v : typeof v === 'string' ? [v] : [];
    for (const x of lijst) tel.set(x, (tel.get(x) ?? 0) + 1);
  }
  return Array.from(tel.entries()).map(([label, aantal]) => ({ label, aantal }));
}

export type NpsResultaat = {
  n: number;
  score: number | null;
  promotors: number;
  passief: number;
  criticasters: number;
  verdeling: number[];
};

/** NPS = % promotors (9–10) − % criticasters (0–6). */
export function nps(waarden: number[]): NpsResultaat {
  const n = waarden.length;
  const verdeling = Array.from({ length: 11 }, (_, i) => waarden.filter((v) => v === i).length);
  const promotors = waarden.filter((v) => v >= 9).length;
  const criticasters = waarden.filter((v) => v <= 6).length;
  return {
    n,
    score: n < MIN_N ? null : Math.round(((promotors - criticasters) / n) * 100),
    promotors,
    passief: n - promotors - criticasters,
    criticasters,
    verdeling,
  };
}

export type Leerwinst = { id: string; tekst: string; n: number; pre: number | null; post: number | null; verschil: number | null };

export function berekenStats(rijen: Rij[], kennisCorrect: Record<string, string>) {
  const likert = (ids: string[]) =>
    ids.map((id) => ({ id, tekst: vraag(id).tekst, ...gemiddelde(getallen(rijen, id)) }));

  const matrix = vraag('R7');
  const blokken =
    matrix.type === 'matrix'
      ? matrix.rijen.map((r) => ({
          id: r.id,
          label: r.label,
          relevantie: gemiddelde(getallen(rijen, `${r.id}_relevantie`)),
          uitwerking: gemiddelde(getallen(rijen, `${r.id}_uitwerking`)),
        }))
      : [];

  const leerwinst: Leerwinst[] = ALLE_VRAGEN.filter((v) => v.type === 'prepost')
    .map((v) => {
      // Enkel antwoorden met zowel VÓÓR als NU, zodat het verschil klopt.
      const paren = rijen
        .map((r) => [r.antwoorden[`${v.id}_pre`], r.antwoorden[`${v.id}_post`]])
        .filter((p): p is [number, number] => typeof p[0] === 'number' && typeof p[1] === 'number');
      const pre = gemiddelde(paren.map((p) => p[0]));
      const post = gemiddelde(paren.map((p) => p[1]));
      return {
        id: v.id,
        tekst: v.tekst,
        n: paren.length,
        pre: pre.gem,
        post: post.gem,
        verschil: pre.gem !== null && post.gem !== null ? Math.round((post.gem - pre.gem) * 100) / 100 : null,
      };
    })
    .sort((a, b) => (b.verschil ?? -Infinity) - (a.verschil ?? -Infinity));

  const kennisScores = rijen.map((r) => r.kennisScore).filter((v): v is number => v !== null);
  const kennisPerVraag = Object.entries(kennisCorrect).map(([id, juist]) => {
    const beantwoord = rijen.filter((r) => typeof r.antwoorden[id] === 'string');
    const correct = beantwoord.filter((r) => r.antwoorden[id] === juist).length;
    return {
      id,
      tekst: vraag(id).tekst,
      n: beantwoord.length,
      pctCorrect: beantwoord.length < MIN_N ? null : Math.round((correct / beantwoord.length) * 100),
    };
  });

  const drempels = verdeling(rijen, 'T4').sort((a, b) => b.aantal - a.aantal);

  const open = OPEN_VRAGEN.map((v) => ({
    id: v.id,
    tekst: v.tekst,
    antwoorden: rijen
      .filter((r) => typeof r.antwoorden[v.id] === 'string' && (r.antwoorden[v.id] as string).trim() !== '')
      .map((r) => ({ antwoordId: r.id, tekst: r.antwoorden[v.id] as string })),
  }));

  return {
    n: rijen.length,
    reactie: likert(['R1', 'R2', 'R3', 'R4', 'R5', 'R6']),
    blokken,
    nps: nps(getallen(rijen, 'R8')),
    leerwinst,
    kennis: { n: kennisScores.length, gem: gemiddelde(kennisScores).gem, perVraag: kennisPerVraag },
    transfer: likert(['T1', 'T2']),
    drempels,
    interesse: verdeling(rijen, 'T5'),
    profiel: {
      functie: verdeling(rijen, 'P2'),
      instelling: verdeling(rijen, 'P3'),
      mandaat: verdeling(rijen, 'P4'),
    },
    opvolgingToestemming: rijen.filter((r) => r.c1Opvolging).length,
    open,
  };
}

export type Stats = ReturnType<typeof berekenStats>;

export const GEANONIMISEERD = '[verwijderd door beheerder]';
