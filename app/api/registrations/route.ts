import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrationSchema } from '@/lib/validation';
import { sendInschrijvingBevestiging, sendInschrijvingMelding } from '@/lib/mail';

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

  if (!activity || activity.isHidden) {
    return NextResponse.json({ error: 'Activiteit niet gevonden' }, { status: 404 });
  }

  if (!activity.isOpen || (activity.dateEnd ?? activity.dateStart) < new Date()) {
    return NextResponse.json({ error: 'Inschrijvingen zijn gesloten' }, { status: 409 });
  }

  if (
    activity.maxParticipants !== null &&
    activity._count.registrations >= activity.maxParticipants
  ) {
    return NextResponse.json({ error: 'Activiteit is volzet' }, { status: 409 });
  }

  if (
    activity.registrationDeadline !== null &&
    new Date() > activity.registrationDeadline
  ) {
    return NextResponse.json({ error: 'De inschrijvingstermijn is verstreken' }, { status: 409 });
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

  // Awaiten: op Netlify serverless kan een niet-afgewachte promise na de
  // response afgebroken worden. sendMail gooit nooit; hooguit 5s timeout.
  const aantalInschrijvingen = activity._count.registrations + 1;
  const [bevestiging, melding] = await Promise.all([
    sendInschrijvingBevestiging(registration.email, {
      voornaam: registration.voornaam,
      naam: registration.naam,
      activiteit: activity,
    }),
    sendInschrijvingMelding({
      voornaam: registration.voornaam,
      naam: registration.naam,
      email: registration.email,
      telefoon: registration.telefoon,
      instelling: registration.instelling,
      functie: registration.functie,
      activiteit: activity,
      aantalInschrijvingen,
      maxDeelnemers: activity.maxParticipants,
    }),
  ]);
  if (!bevestiging.ok) console.warn('[registrations] Bevestiging niet verstuurd:', bevestiging.reason);
  if (!melding.ok) console.info('[registrations] Admin-melding niet verstuurd:', melding.reason);

  return NextResponse.json({ success: true, id: registration.id }, { status: 201 });
}
