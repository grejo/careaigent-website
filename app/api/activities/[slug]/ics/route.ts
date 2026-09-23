import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateIcal } from '@/lib/ical';

export async function GET(_req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const activity = await prisma.activity.findUnique({ where: { slug } });
  if (!activity || activity.isHidden) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  }
  return new NextResponse(generateIcal(activity), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${activity.slug}.ics"`,
    },
  });
}
