import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const activity = await prisma.activity.findUnique({
      where: { slug },
      include: { _count: { select: { registrations: true } } },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Activity GET error:', error);
    return NextResponse.json({ error: 'Interne fout' }, { status: 500 });
  }
}
