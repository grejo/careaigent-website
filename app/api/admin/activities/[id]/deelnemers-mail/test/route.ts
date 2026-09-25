import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { nieuwToken } from '@/lib/tokens';
import { gekozenBijlagen, previewSchema, verstuurNaarDeelnemer } from '@/lib/deelnemerMail';
import { eersteFout } from '@/lib/mailSchemas';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Echte testmail naar de ingelogde beheerder: echte evaluatielink en echte
 * handoutpagina, maar gemarkeerd als test (telt nergens mee). Werkt ook als de
 * evaluatie nog niet open staat, en kan onbeperkt herhaald worden.
 */
export async function POST(req: Request, context: Ctx) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;

  const parsed = previewSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: eersteFout(parsed.error) }, { status: 400 });
  const { metEvaluatie, bijlageIds } = parsed.data;

  const activiteit = await prisma.activity.findUnique({ where: { id } });
  if (!activiteit) return NextResponse.json({ error: 'Activiteit niet gevonden' }, { status: 404 });
  const bijlagen = await gekozenBijlagen(id, bijlageIds);
  if (!metEvaluatie && bijlagen.length === 0) {
    return NextResponse.json({ error: 'Kies een evaluatielink en/of minstens één bijlage.' }, { status: 400 });
  }

  const bestaand = await prisma.deelnemerMail.findUnique({
    where: { activityId_email: { activityId: id, email } },
    select: { isTest: true },
  });
  if (bestaand && !bestaand.isTest) {
    return NextResponse.json(
      { error: `${email} staat al als echte ontvanger in de lijst. Een test naar dit adres zou de cijfers vervuilen.` },
      { status: 409 },
    );
  }

  const dm = await prisma.deelnemerMail.upsert({
    where: { activityId_email: { activityId: id, email } },
    create: {
      activityId: id,
      email,
      naam: session?.user?.name || null,
      bron: 'MANUEEL',
      isTest: true,
      downloadToken: nieuwToken(),
    },
    update: {},
  });

  const res = await verstuurNaarDeelnemer(dm, activiteit, bijlagen, metEvaluatie, { test: true });
  if (!res.ok) return NextResponse.json({ error: res.reason ?? 'Verzenden mislukt' }, { status: 503 });
  return NextResponse.json({ ok: true, sentTo: email });
}

/** Wist de testontvanger (met zijn downloads) en de testantwoorden van deze activiteit. */
export async function DELETE(_req: Request, context: Ctx) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;

  const [antwoorden, ontvangers] = await prisma.$transaction([
    prisma.evaluatieAntwoord.deleteMany({ where: { activityId: id, isTest: true } }),
    prisma.deelnemerMail.deleteMany({ where: { activityId: id, isTest: true } }),
  ]);
  return NextResponse.json({ ok: true, antwoorden: antwoorden.count, ontvangers: ontvangers.count });
}
