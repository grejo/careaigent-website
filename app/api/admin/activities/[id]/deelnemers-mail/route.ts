import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { nieuwToken } from '@/lib/tokens';
import { gekozenBijlagen, verstuurNaarDeelnemer, verzendSchema } from '@/lib/deelnemerMail';
import { eersteFout } from '@/lib/mailSchemas';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Verstuurt de deelnemersmail naar maximaal 10 ontvangers per aanroep (de
 * client verstuurt in porties, zodat elke aanroep binnen de functietimeout
 * blijft). Per ontvanger een nieuw, eenmalig evaluatietoken; enkel de hash
 * wordt bewaard, en pas nadat de mail vertrokken is.
 */
export async function POST(req: Request, context: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;

  const parsed = verzendSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: eersteFout(parsed.error) }, { status: 400 });
  const { ontvangers, metEvaluatie, bijlageIds } = parsed.data;

  const activiteit = await prisma.activity.findUnique({ where: { id } });
  if (!activiteit) return NextResponse.json({ error: 'Activiteit niet gevonden' }, { status: 404 });
  if (metEvaluatie && !activiteit.evaluatieOpen) {
    return NextResponse.json({ error: 'Open eerst de evaluatie voor deze activiteit.' }, { status: 409 });
  }
  const bijlagen = await gekozenBijlagen(id, bijlageIds);
  if (!metEvaluatie && bijlagen.length === 0) {
    return NextResponse.json({ error: 'Kies een evaluatielink en/of minstens één bijlage.' }, { status: 400 });
  }

  const resultaten: { email: string; ok: boolean; reason?: string }[] = [];
  const afwezigen = await prisma.registration.findMany({
    where: { activityId: id, nietDeelgenomen: true },
    select: { email: true },
  });
  const afwezig = new Set(afwezigen.map((r) => r.email.trim().toLowerCase()));

  for (const o of ontvangers) {
    if (afwezig.has(o.email)) {
      resultaten.push({ email: o.email, ok: false, reason: 'Niet deelgenomen' });
      continue;
    }
    const bestaand = await prisma.deelnemerMail.findUnique({
      where: { activityId_email: { activityId: id, email: o.email } },
      select: { isTest: true },
    });
    if (bestaand?.isTest) {
      resultaten.push({ email: o.email, ok: false, reason: 'Dit adres wordt gebruikt voor de testmail. Wis eerst de test.' });
      continue;
    }
    const dm = await prisma.deelnemerMail.upsert({
      where: { activityId_email: { activityId: id, email: o.email } },
      create: { activityId: id, email: o.email, naam: o.naam || null, bron: o.bron, downloadToken: nieuwToken() },
      update: o.naam ? { naam: o.naam } : {},
    });
    const res = await verstuurNaarDeelnemer(dm, activiteit, bijlagen, metEvaluatie);
    resultaten.push({ email: o.email, ok: res.ok, reason: res.reason });
  }

  return NextResponse.json({ resultaten });
}

/**
 * Wist alle e-mailadressen (en per-persoon downloads) van deze activiteit.
 * De downloadaantallen blijven als totalen bewaard op de bijlage.
 */
export async function DELETE(_req: Request, context: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;

  await prisma.$transaction(async (tx) => {
    const bijlagen = await tx.activiteitBijlage.findMany({
      where: { activityId: id },
      // Downloads van de testmail tellen niet mee in de bewaarde totalen.
      select: { id: true, downloads: { where: { deelnemerMail: { isTest: false } }, select: { aantal: true } } },
    });
    for (const b of bijlagen) {
      if (b.downloads.length === 0) continue;
      await tx.activiteitBijlage.update({
        where: { id: b.id },
        data: {
          uniekeDownloaders: { increment: b.downloads.length },
          downloadsTotaal: { increment: b.downloads.reduce((s, d) => s + d.aantal, 0) },
        },
      });
    }
    await tx.deelnemerMail.deleteMany({ where: { activityId: id } });
  });
  return NextResponse.json({ ok: true });
}
