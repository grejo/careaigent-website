import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrationSchema } from '@/lib/validation';
import { sendConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 });
  }

  const { activitySlug, ...fields } = body as Record<string, unknown>;

  if (!activitySlug || typeof activitySlug !== 'string') {
    return NextResponse.json({ error: 'activitySlug is verplicht' }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(fields);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0]?.toString() ?? 'general';
      errors[key] = issue.message;
    });
    return NextResponse.json({ errors }, { status: 422 });
  }

  // Find the activity
  const activity = await prisma.activity.findUnique({
    where: { slug: activitySlug },
    include: { _count: { select: { registrations: true } } },
  });

  if (!activity) {
    return NextResponse.json({ error: 'Activiteit niet gevonden' }, { status: 404 });
  }

  if (!activity.isOpen) {
    return NextResponse.json({ error: 'Inschrijvingen zijn gesloten' }, { status: 409 });
  }

  if (
    activity.maxParticipants !== null &&
    activity._count.registrations >= activity.maxParticipants
  ) {
    return NextResponse.json({ error: 'Activiteit is volzet' }, { status: 409 });
  }

  // Save registration
  let registration;
  try {
    registration = await prisma.registration.create({
      data: {
        activityId: activity.id,
        naam: parsed.data.naam,
        voornaam: parsed.data.voornaam,
        email: parsed.data.email,
        telefoon: parsed.data.telefoon,
        instelling: parsed.data.instelling,
        functie: parsed.data.functie,
        extraData: parsed.data.extraData,
      },
    });
  } catch (err) {
    console.error('Registration create error:', err);
    return NextResponse.json({ error: 'Kon inschrijving niet opslaan. Probeer opnieuw.' }, { status: 500 });
  }

  sendConfirmationEmail(registration, activity).catch((err) => {
    console.error('Confirmation email failed:', err);
  });

  return NextResponse.json({ success: true, id: registration.id }, { status: 201 });
}
