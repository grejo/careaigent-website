import { prisma } from './db';
import { isTokenVorm } from './tokens';

/** Zoekt ontvanger + bijlage op; de bijlage moet bij dezelfde activiteit horen. Telt niets. */
export async function vindDownload(token: string, bijlageId: string) {
  if (!isTokenVorm(token)) return null;
  const dm = await prisma.deelnemerMail.findUnique({ where: { downloadToken: token }, select: { id: true, activityId: true } });
  if (!dm) return null;
  const bijlage = await prisma.activiteitBijlage.findFirst({
    where: { id: bijlageId, activityId: dm.activityId },
    select: { id: true, soort: true, titel: true, bestandsnaam: true, mimeType: true, grootte: true, url: true },
  });
  if (!bijlage) return null;
  return { deelnemerMailId: dm.id, bijlage };
}

/** Registreert één download: unieke persoon per bijlage + totaal aantal. */
export async function registreerDownload(bijlageId: string, deelnemerMailId: string): Promise<void> {
  await prisma.bijlageDownload.upsert({
    where: { bijlageId_deelnemerMailId: { bijlageId, deelnemerMailId } },
    create: { bijlageId, deelnemerMailId },
    update: { aantal: { increment: 1 }, laatsteDownloadOp: new Date() },
  });
}

/** Handoutpagina: activiteit + de bijlagen die deze ontvanger kreeg (die nog bestaan). Telt niets. */
export async function vindHandouts(token: string) {
  if (!isTokenVorm(token)) return null;
  const dm = await prisma.deelnemerMail.findUnique({
    where: { downloadToken: token },
    select: { activityId: true, bijlageIds: true, activity: { select: { title: true, slug: true } } },
  });
  if (!dm || dm.bijlageIds.length === 0) return null;
  const rijen = await prisma.activiteitBijlage.findMany({
    where: { activityId: dm.activityId, id: { in: dm.bijlageIds } },
    select: { id: true, soort: true, titel: true, bestandsnaam: true, mimeType: true, grootte: true },
  });
  // Volgorde zoals verstuurd.
  const bijlagen = dm.bijlageIds.map((id) => rijen.find((r) => r.id === id)).filter((r) => r !== undefined);
  if (bijlagen.length === 0) return null;
  return { activiteit: dm.activity.title, slug: dm.activity.slug, bijlagen };
}
