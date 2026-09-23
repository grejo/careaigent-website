import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { sendDeelnemerUitnodiging } from '@/lib/mail';
import { hashToken, nieuwToken } from '@/lib/tokens';
import { siteUrl } from '@/lib/site';
import { downloadKnoppen, gekozenBijlagen, verzendSchema, voornaamVan } from '@/lib/deelnemerMail';
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

  for (const o of ontvangers) {
    const dm = await prisma.deelnemerMail.upsert({
      where: { activityId_email: { activityId: id, email: o.email } },
      create: { activityId: id, email: o.email, naam: o.naam || null, bron: o.bron, downloadToken: nieuwToken() },
      update: o.naam ? { naam: o.naam } : {},
    });

    // Wie al invulde, krijgt geen nieuwe evaluatielink (wel de documenten).
    const evalLink = metEvaluatie && !dm.evaluatieIngevuld;
    if (!evalLink && bijlagen.length === 0) {
      resultaten.push({ email: o.email, ok: false, reason: 'Evaluatie al ingevuld' });
      continue;
    }
    const token = evalLink ? nieuwToken() : null;

    const res = await sendDeelnemerUitnodiging(
      { email: o.email, naam: dm.naam ?? '' },
      {
        voornaam: voornaamVan(dm.naam),
        activiteit: activiteit,
        evaluatieUrl: token ? `${siteUrl()}/evaluatie/t/${token}` : null,
        downloads: downloadKnoppen(dm.downloadToken, bijlagen),
      },
    );

    if (res.ok) {
      await prisma.deelnemerMail.update({
        where: { id: dm.id },
        data: {
          laatstVerstuurdOp: new Date(),
          aantalVerstuurd: { increment: 1 },
          // Nieuw token vervangt het vorige: oudere links werken niet meer.
          ...(token ? { evalTokenHash: hashToken(token) } : {}),
        },
      });
    }
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
      select: { id: true, downloads: { select: { aantal: true } } },
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
