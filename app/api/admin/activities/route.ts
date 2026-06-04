import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { activitySchema } from '@/lib/validation';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const activities = await prisma.activity.findMany({
    orderBy: { dateStart: 'asc' },
    include: { _count: { select: { registrations: true } } },
  });
  return NextResponse.json(activities);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 });
  }

  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const activity = await prisma.activity.create({
      data: {
        ...parsed.data,
        dateStart: new Date(parsed.data.dateStart),
        dateEnd: parsed.data.dateEnd ? new Date(parsed.data.dateEnd) : null,
        registrationDeadline: parsed.data.registrationDeadline
          ? new Date(parsed.data.registrationDeadline)
          : null,
      },
    });
    return NextResponse.json(activity, { status: 201 });
  } catch (err) {
    console.error('Activity create error:', err);
    return NextResponse.json({ error: 'Kon activiteit niet aanmaken' }, { status: 500 });
  }
}
