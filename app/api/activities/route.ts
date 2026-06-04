import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      where: { isOpen: true },
      orderBy: { dateStart: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        dateStart: true,
        dateEnd: true,
        location: true,
        maxParticipants: true,
        registrationDeadline: true,
        isOpen: true,
        _count: { select: { registrations: true } },
      },
    });
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Activities GET error:', error);
    return NextResponse.json({ error: 'Interne fout' }, { status: 500 });
  }
}
