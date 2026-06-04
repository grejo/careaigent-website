import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { activitySchema } from '@/lib/validation';

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 });
  }

  const parsed = activitySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...parsed.data,
        dateStart: parsed.data.dateStart ? new Date(parsed.data.dateStart) : undefined,
        dateEnd:
          parsed.data.dateEnd !== undefined
            ? parsed.data.dateEnd
              ? new Date(parsed.data.dateEnd)
              : null
            : undefined,
        registrationDeadline:
          parsed.data.registrationDeadline !== undefined
            ? parsed.data.registrationDeadline
              ? new Date(parsed.data.registrationDeadline)
              : null
            : undefined,
      },
    });
    return NextResponse.json(activity);
  } catch (err) {
    console.error('Activity update error:', err);
    return NextResponse.json({ error: 'Kon activiteit niet bijwerken' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  try {
    await prisma.activity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Activity delete error:', err);
    return NextResponse.json({ error: 'Kon activiteit niet verwijderen' }, { status: 500 });
  }
}
