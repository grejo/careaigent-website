import { prisma } from '@/lib/db';
import { hashToken, isTokenVorm } from '@/lib/tokens';

/** Tijdstip afgerond op de dag (UTC), zodat een antwoord niet via het tijdstip te koppelen is. */
export function alleenDag(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const OPVOLG_BEWAARTERMIJN_MAANDEN = 6;

export function verwijderDatum(van = new Date()): Date {
  const d = new Date(van);
  d.setMonth(d.getMonth() + OPVOLG_BEWAARTERMIJN_MAANDEN);
  return d;
}

/** Wist opvolgcontacten waarvan de bewaartermijn verstreken is. Faalt stil. */
export async function ruimVerlopenContactenOp(): Promise<void> {
  try {
    await prisma.opvolgContact.deleteMany({ where: { verwijderOp: { lt: new Date() } } });
  } catch (err) {
    console.error('[evaluatie] Opruimen opvolgcontacten mislukt:', err);
  }
}

export type EvaluatieToegang =
  | {
      ok: true;
      activiteit: { id: string; slug: string; title: string; dateStart: Date };
      deelnemerMailId: string | null;
      /** Testlink van een beheerder: antwoord wordt als test opgeslagen. */
      isTest: boolean;
    }
  | { ok: false; reden: 'onbekend' | 'gesloten' | 'al_ingevuld' | 'geen_open_link' };

const activiteitSelect = { id: true, slug: true, title: true, dateStart: true, evaluatieOpen: true, evaluatieOpenLink: true } as const;

/** Bepaalt voor welke activiteit er ingevuld mag worden, via persoonlijk token of algemene editie-link. */
export async function bepaalToegang(opts: { token?: string | null; editie?: string | null }): Promise<EvaluatieToegang> {
  if (opts.token) {
    if (!isTokenVorm(opts.token)) return { ok: false, reden: 'onbekend' };
    const dm = await prisma.deelnemerMail.findUnique({
      where: { evalTokenHash: hashToken(opts.token) },
      select: { id: true, evaluatieIngevuld: true, isTest: true, activity: { select: activiteitSelect } },
    });
    if (!dm) return { ok: false, reden: 'onbekend' };
    if (dm.evaluatieIngevuld) return { ok: false, reden: 'al_ingevuld' };
    // Een testlink werkt ook vóór de evaluatie opengezet wordt.
    if (!dm.activity.evaluatieOpen && !dm.isTest) return { ok: false, reden: 'gesloten' };
    return { ok: true, activiteit: dm.activity, deelnemerMailId: dm.id, isTest: dm.isTest };
  }
  if (opts.editie) {
    const a = await prisma.activity.findUnique({ where: { slug: opts.editie }, select: activiteitSelect });
    if (!a) return { ok: false, reden: 'onbekend' };
    if (!a.evaluatieOpen) return { ok: false, reden: 'gesloten' };
    if (!a.evaluatieOpenLink) return { ok: false, reden: 'geen_open_link' };
    return { ok: true, activiteit: a, deelnemerMailId: null, isTest: false };
  }
  return { ok: false, reden: 'onbekend' };
}
