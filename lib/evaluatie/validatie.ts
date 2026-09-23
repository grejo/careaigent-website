// Validatie van formulier A. Wordt zowel in de browser (per stap, voor directe
// foutmeldingen) als op de server (bron van waarheid) gebruikt. Alles wordt
// afgeleid uit de config in `formulierA.ts`.
import { z } from 'zod';
import {
  ALLE_VRAGEN,
  ANDERE,
  COMPETENTIE5,
  LIKERT5,
  BLOK5,
  NPS,
  type Antwoorden,
  type Antwoordwaarde,
  type Schaal,
  type Vraag,
} from './formulierA';

export type Invoer = { antwoorden: Record<string, unknown>; email?: unknown };

export type Resultaat =
  | { ok: true; antwoorden: Antwoorden; email: string | null; c1Opvolging: boolean }
  | { ok: false; fouten: Record<string, string> };

const ANDERS_MAX = 200;
const emailSchema = z.string().trim().toLowerCase().max(254).email();

/** Verwijdert HTML-tags en controletekens, trimt. */
export function schoonTekst(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

function isLeeg(v: unknown): boolean {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
}

function geheelGetal(v: unknown, schaal: Schaal): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < schaal.min || n > schaal.max) return null;
  return n;
}

function tekstWaarde(v: unknown): string | null {
  return typeof v === 'string' ? schoonTekst(v) : null;
}

/**
 * Valideert een reeks vragen (één stap in de browser, of alle vragen op de
 * server) en geeft de genormaliseerde antwoorden of de fouten per vraag-ID.
 */
export function valideerVragen(vragen: Vraag[], invoer: Invoer): Resultaat {
  const bron = invoer.antwoorden ?? {};
  const uit: Antwoorden = {};
  const fouten: Record<string, string> = {};
  let email: string | null = null;

  const zet = (k: string, v: Antwoordwaarde) => {
    uit[k] = v;
  };

  for (const vraag of vragen) {
    const id = vraag.id;
    switch (vraag.type) {
      case 'single': {
        const v = bron[id];
        if (isLeeg(v)) {
          if (vraag.verplicht) fouten[id] = 'Kies een antwoord.';
          break;
        }
        if (typeof v !== 'string' || !vraag.opties.includes(v)) fouten[id] = 'Ongeldige keuze.';
        else zet(id, v);
        break;
      }
      case 'single_met_andere': {
        const v = bron[id];
        if (isLeeg(v)) {
          if (vraag.verplicht) fouten[id] = 'Kies een antwoord.';
          break;
        }
        if (typeof v !== 'string' || !vraag.opties.includes(v)) {
          fouten[id] = 'Ongeldige keuze.';
          break;
        }
        zet(id, v);
        if (v === ANDERE) {
          const anders = tekstWaarde(bron[`${id}_anders`]) ?? '';
          if (!anders) fouten[id] = 'Vul in wat je bedoelt met ‘Andere’.';
          else if (anders.length > ANDERS_MAX) fouten[id] = `Maximaal ${ANDERS_MAX} tekens.`;
          else zet(`${id}_anders`, anders);
        }
        break;
      }
      case 'multi_met_andere': {
        const v = bron[id];
        if (isLeeg(v)) {
          if (vraag.verplicht) fouten[id] = 'Kies minstens één antwoord.';
          break;
        }
        if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !vraag.opties.includes(x))) {
          fouten[id] = 'Ongeldige keuze.';
          break;
        }
        // Volgorde van de config aanhouden en ontdubbelen.
        const gekozen = vraag.opties.filter((o) => (v as string[]).includes(o));
        zet(id, gekozen);
        if (gekozen.includes(ANDERE)) {
          const anders = tekstWaarde(bron[`${id}_anders`]) ?? '';
          if (!anders) fouten[id] = 'Vul in wat je bedoelt met ‘Andere’.';
          else if (anders.length > ANDERS_MAX) fouten[id] = `Maximaal ${ANDERS_MAX} tekens.`;
          else zet(`${id}_anders`, anders);
        }
        break;
      }
      case 'likert5':
      case 'nps': {
        const schaal = vraag.type === 'nps' ? NPS : LIKERT5;
        const v = bron[id];
        if (isLeeg(v)) {
          if (vraag.verplicht) fouten[id] = 'Kies een score.';
          break;
        }
        const n = geheelGetal(v, schaal);
        if (n === null) fouten[id] = `Score tussen ${schaal.min} en ${schaal.max}.`;
        else zet(id, n);
        break;
      }
      case 'prepost': {
        const pre = bron[`${id}_pre`];
        const post = bron[`${id}_post`];
        if (isLeeg(pre) || isLeeg(post)) {
          if (vraag.verplicht || !isLeeg(pre) || !isLeeg(post)) {
            fouten[id] = 'Geef een score voor VÓÓR én NU.';
          }
          break;
        }
        const a = geheelGetal(pre, COMPETENTIE5);
        const b = geheelGetal(post, COMPETENTIE5);
        if (a === null || b === null) fouten[id] = 'Score tussen 1 en 5.';
        else {
          zet(`${id}_pre`, a);
          zet(`${id}_post`, b);
        }
        break;
      }
      case 'matrix': {
        let ontbreekt = false;
        let ongeldig = false;
        for (const r of vraag.rijen) {
          for (const k of vraag.kolommen) {
            const key = `${r.id}_${k.id}`;
            const v = bron[key];
            if (isLeeg(v)) {
              ontbreekt = true;
              continue;
            }
            const n = geheelGetal(v, BLOK5);
            if (n === null) ongeldig = true;
            else zet(key, n);
          }
        }
        if (ongeldig) fouten[id] = 'Score tussen 1 en 5.';
        else if (ontbreekt && vraag.verplicht) fouten[id] = 'Geef elk blok een score voor relevantie én uitwerking.';
        break;
      }
      case 'tekst_kort':
      case 'tekst_lang': {
        const v = tekstWaarde(bron[id]);
        if (!v) {
          if (vraag.verplicht) fouten[id] = 'Dit veld is verplicht.';
          break;
        }
        if (v.length > vraag.max) fouten[id] = `Maximaal ${vraag.max} tekens.`;
        else zet(id, v);
        break;
      }
      case 'email': {
        const trigger = bron[vraag.toonAls.vraag];
        if (trigger !== vraag.toonAls.waarde) break; // niet getoond = genegeerd
        const parsed = emailSchema.safeParse(typeof invoer.email === 'string' ? invoer.email : '');
        if (!parsed.success) fouten[id] = 'Vul een geldig e-mailadres in.';
        else email = parsed.data;
        break;
      }
    }
  }

  if (Object.keys(fouten).length > 0) return { ok: false, fouten };
  return { ok: true, antwoorden: uit, email, c1Opvolging: uit.C1 === 'Ja' };
}

export function valideerFormulier(invoer: Invoer): Resultaat {
  return valideerVragen(ALLE_VRAGEN, invoer);
}
