// Juiste antwoorden van de kennischeck. Enkel server-side importeren: zo komen
// ze nooit in de browserbundel en wordt de score op de server berekend.
import 'server-only';
import type { Antwoorden } from './formulierA';

export const KENNIS_CORRECT: Record<string, string> = {
  K1: 'Knowledge',
  K2: 'De MDR (Medical Device Regulation)',
  K3: 'Gebruik van AI-tools buiten het zicht of de goedkeuring van de organisatie',
};

export type KennisFeedback = { id: string; gegeven: string | null; correct: boolean; juisteAntwoord: string };

/** Score 0–3, of null als geen enkele kennisvraag beantwoord werd. */
export function berekenKennisScore(antwoorden: Antwoorden): {
  kennisScore: number | null;
  feedback: KennisFeedback[];
} {
  let beantwoord = 0;
  let score = 0;
  const feedback = Object.entries(KENNIS_CORRECT).map(([id, juist]) => {
    const gegeven = typeof antwoorden[id] === 'string' ? (antwoorden[id] as string) : null;
    if (gegeven) beantwoord++;
    const correct = gegeven === juist;
    if (correct) score++;
    return { id, gegeven, correct, juisteAntwoord: juist };
  });
  return { kennisScore: beantwoord > 0 ? score : null, feedback };
}
