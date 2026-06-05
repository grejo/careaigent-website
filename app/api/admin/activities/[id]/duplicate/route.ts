import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Genereer unieke slug
  let slug = `${activity.slug}-kopie`;
  let suffix = 2;
  while (await prisma.activity.findUnique({ where: { slug } })) {
    slug = `${activity.slug}-kopie-${suffix}`;
    suffix++;
  }

  let copy;
  try {
    copy = await prisma.activity.create({
      data: {
        title: `${activity.title} (kopie)`,
        slug,
        description: activity.description,
        location: activity.location,
        maxParticipants: activity.maxParticipants,
        extraFields: activity.extraFields ?? Prisma.JsonNull,
        isOpen: false,
        dateStart: activity.dateStart,
        dateEnd: activity.dateEnd,
        registrationDeadline: activity.registrationDeadline,
      },
    });
  } catch (err) {
    console.error('Duplicate activity error:', err);
    return NextResponse.json({ error: 'Kopiëren mislukt' }, { status: 500 });
  }

  return NextResponse.json({ id: copy.id }, { status: 201 });
}
