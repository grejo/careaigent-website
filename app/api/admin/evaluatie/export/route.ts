import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { buildEvaluatieCsv } from '@/lib/evaluatie/export';
import type { Antwoorden } from '@/lib/evaluatie/formulierA';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const activityId = new URL(req.url).searchParams.get('activiteit') || null;
  const rijen = await prisma.evaluatieAntwoord.findMany({
    where: activityId ? { activityId } : {},
    orderBy: [{ createdAt: 'asc' }],
    include: { activity: { select: { title: true, slug: true } } },
  });

  // Het document vraagt elke export te loggen (wie, wanneer).
  await prisma.evaluatieExportLog.create({
    data: { adminEmail: session.user?.email ?? 'onbekend', activityId },
  });

  const csv = buildEvaluatieCsv(
    rijen.map((r) => ({
      activiteit: r.activity.title,
      datum: r.createdAt,
      formVersie: r.formVersie,
      antwoorden: r.antwoorden as Antwoorden,
      kennisScore: r.kennisScore,
    })),
  );
  const naam = activityId && rijen[0] ? `evaluatie-${rijen[0].activity.slug}` : 'evaluatie-alle-edities';
  return new NextResponse(new Uint8Array(csv), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${naam}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
