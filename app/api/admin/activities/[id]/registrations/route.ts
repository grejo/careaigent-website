import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { manualRegistrationSchema } from '@/lib/validation';

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const registrations = await prisma.registration.findMany({
    where: { activityId: id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(registrations);
}

/**
 * Deelnemer manueel toevoegen. Geen bevestigings- of meldingsmail, en geen
 * controle op open/volzet/deadline: de beheerder beslist.
 */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = manualRegistrationSchema.safeParse(body ?? {});
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0]?.toString() ?? 'general';
      errors[key] ??= issue.message;
    });
    return NextResponse.json({ errors }, { status: 422 });
  }

  const activity = await prisma.activity.findUnique({ where: { id }, select: { id: true } });
  if (!activity) return NextResponse.json({ error: 'Activiteit niet gevonden' }, { status: 404 });

  const dubbel = await prisma.registration.findFirst({
    where: { activityId: id, email: { equals: parsed.data.email, mode: 'insensitive' } },
    select: { voornaam: true, naam: true },
  });
  if (dubbel) {
    return NextResponse.json(
      { errors: { email: `Dit adres is al ingeschreven (${dubbel.voornaam} ${dubbel.naam}).` } },
      { status: 409 },
    );
  }

  try {
    const registration = await prisma.registration.create({
      data: { activityId: id, ...parsed.data, manueel: true },
    });
    return NextResponse.json({ success: true, id: registration.id, email: registration.email }, { status: 201 });
  } catch (err) {
    console.error('Manual registration create error:', err);
    return NextResponse.json({ error: 'Kon deelnemer niet opslaan. Probeer opnieuw.' }, { status: 500 });
  }
}
