import { z } from 'zod';
import { prisma } from './db';
import { siteUrl } from './site';
import type { EmailKnop } from './emailTemplate';

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

/** Downloadknoppen voor één ontvanger (getrackte URL's, nooit de externe link zelf). */
export function downloadKnoppen(downloadToken: string, bijlagen: { id: string; titel: string }[]): EmailKnop[] {
  return bijlagen.map((b) => ({ label: b.titel, url: `${siteUrl()}/d/${downloadToken}/${b.id}` }));
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
