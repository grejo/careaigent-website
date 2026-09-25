import { prisma } from './db';

export const MAX_BIJLAGE_BYTES = 4 * 1024 * 1024;

export const TOEGELATEN_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

/** Mimetype afleiden uit de extensie als de browser niets (of iets generieks) meegeeft. */
export function mimeVoorBestand(naam: string, opgegeven: string): string | null {
  if (TOEGELATEN_MIME[opgegeven]) return opgegeven;
  const ext = naam.toLowerCase().split('.').pop() ?? '';
  const gevonden = Object.entries(TOEGELATEN_MIME).find(([, e]) => e === ext || (ext === 'jpeg' && e === 'jpg'));
  return gevonden ? gevonden[0] : null;
}

/** Enkel http(s)-links. */
export function isVeiligeUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Bijlagen zonder de bytes, met download-tellers (incl. bewaarde tellers na wissen). */
export async function bijlagenMetTellers(activityId: string) {
  const bijlagen = await prisma.activiteitBijlage.findMany({
    where: { activityId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      soort: true,
      titel: true,
      bestandsnaam: true,
      mimeType: true,
      grootte: true,
      url: true,
      downloadsTotaal: true,
      uniekeDownloaders: true,
      createdAt: true,
      downloads: { select: { aantal: true, deelnemerMailId: true, deelnemerMail: { select: { isTest: true } } } },
    },
  });
  return bijlagen.map(({ downloads: alle, ...b }) => {
    // Downloads via de testmail van een beheerder tellen niet mee.
    const downloads = alle.filter((d) => !d.deelnemerMail.isTest).map(({ aantal, deelnemerMailId }) => ({ aantal, deelnemerMailId }));
    const testDownloads = alle.filter((d) => d.deelnemerMail.isTest).map(({ aantal, deelnemerMailId }) => ({ aantal, deelnemerMailId }));
    return {
      ...b,
      uniek: b.uniekeDownloaders + downloads.length,
      totaal: b.downloadsTotaal + downloads.reduce((s, d) => s + d.aantal, 0),
      downloads,
      testDownloads,
    };
  });
}
