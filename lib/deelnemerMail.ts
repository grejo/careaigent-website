import { z } from 'zod';
import { prisma } from './db';
import { siteUrl } from './site';
import { sendDeelnemerUitnodiging, type MailResultaat } from './mail';
import type { Handouts } from './mailRegistry';
import { hashToken, nieuwToken } from './tokens';

export const MAX_PER_VERZENDING = 10;

export const verzendSchema = z.object({
  ontvangers: z
    .array(
      z.object({
        email: z.string().trim().toLowerCase().max(254).email(),
        naam: z.string().trim().max(200).optional().nullable(),
        bron: z.enum(['INSCHRIJVING', 'MANUEEL']),
      }),
    )
    .min(1)
    .max(MAX_PER_VERZENDING),
  metEvaluatie: z.boolean(),
  bijlageIds: z.array(z.string().min(1)).max(20),
});

export const previewSchema = verzendSchema.pick({ metEvaluatie: true, bijlageIds: true });

/**
 * Eén persoonlijke handoutpagina per ontvanger; de pagina linkt per document
 * naar de getrackte download (nooit rechtstreeks naar de externe link).
 */
export function handoutsVoor(downloadToken: string, bijlagen: { titel: string }[]): Handouts | null {
  if (bijlagen.length === 0) return null;
  return { url: `${siteUrl()}/d/${downloadToken}`, titels: bijlagen.map((b) => b.titel) };
}

type Ontvanger = {
  id: string;
  email: string;
  naam: string | null;
  downloadToken: string;
  bijlageIds: string[];
  evaluatieIngevuld: boolean;
};

/**
 * Verstuurt de deelnemersmail naar één ontvanger. Per verzending een nieuw,
 * eenmalig evaluatietoken; enkel de hash wordt bewaard, en pas nadat de mail
 * vertrokken is. Met `test` gaat de mail als "[TEST]" enkel naar dit adres.
 */
export async function verstuurNaarDeelnemer(
  dm: Ontvanger,
  activiteit: Parameters<typeof sendDeelnemerUitnodiging>[1]['activiteit'],
  bijlagen: { id: string; titel: string }[],
  metEvaluatie: boolean,
  opts: { test?: boolean } = {},
): Promise<MailResultaat> {
  // Wie al invulde, krijgt geen nieuwe evaluatielink (wel de documenten).
  // Een test mag onbeperkt herhaald worden.
  const evalLink = metEvaluatie && (!dm.evaluatieIngevuld || Boolean(opts.test));
  if (!evalLink && bijlagen.length === 0) return { ok: false, reason: 'Evaluatie al ingevuld' };
  const token = evalLink ? nieuwToken() : null;

  const res = await sendDeelnemerUitnodiging(
    { email: dm.email, naam: dm.naam ?? '' },
    {
      voornaam: voornaamVan(dm.naam),
      activiteit,
      evaluatieUrl: token ? `${siteUrl()}/evaluatie/t/${token}` : null,
      handouts: handoutsVoor(dm.downloadToken, bijlagen),
    },
    opts,
  );

  if (res.ok) {
    await prisma.deelnemerMail.update({
      where: { id: dm.id },
      data: {
        laatstVerstuurdOp: new Date(),
        aantalVerstuurd: { increment: 1 },
        // Eerder verstuurde documenten blijven op de handoutpagina staan.
        bijlageIds: Array.from(new Set([...dm.bijlageIds, ...bijlagen.map((b) => b.id)])),
        // Nieuw token vervangt het vorige: oudere links werken niet meer.
        ...(token ? { evalTokenHash: hashToken(token) } : {}),
        // Nieuwe testlink: de test mag opnieuw ingevuld worden.
        ...(token && opts.test ? { evaluatieIngevuld: false } : {}),
      },
    });
  }
  return res;
}

/** Bijlagen van deze activiteit in de gevraagde volgorde; onbekende ID's vallen weg. */
export async function gekozenBijlagen(activityId: string, ids: string[]) {
  if (ids.length === 0) return [];
  const rijen = await prisma.activiteitBijlage.findMany({
    where: { activityId, id: { in: ids } },
    select: { id: true, titel: true },
  });
  return ids.map((id) => rijen.find((r) => r.id === id)).filter((r): r is { id: string; titel: string } => Boolean(r));
}

/** Voornaam uit "Voornaam Naam" (of null). */
export function voornaamVan(naam: string | null | undefined): string | null {
  const v = naam?.trim().split(/\s+/)[0];
  return v || null;
}
