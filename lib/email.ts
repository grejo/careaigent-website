import { Resend } from 'resend';
import ical from 'ical-generator';

// Lazy instantiation so tests that only use generateIcal don't require a real API key
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

type ActivityLike = {
  slug: string;
  title: string;
  description?: string | null;
  dateStart: Date;
  dateEnd?: Date | null;
  location?: string | null;
};

type RegistrationLike = {
  voornaam: string;
  naam: string;
  email: string;
};

export function generateIcal(activity: ActivityLike): string {
  const cal = ical({ name: 'CareAIgent' });
  cal.createEvent({
    start: activity.dateStart,
    end: activity.dateEnd ?? activity.dateStart,
    summary: activity.title,
    description: activity.description ?? '',
    location: activity.location ?? '',
    url: `https://careaigent.be/activiteiten/${activity.slug}`,
  });
  return cal.toString();
}

export async function sendConfirmationEmail(
  registration: RegistrationLike,
  activity: ActivityLike
): Promise<void> {
  const icsContent = generateIcal(activity);
  const dateFormatted = activity.dateStart.toLocaleDateString('nl-BE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  await getResend().emails.send({
    from: 'CareAIgent <noreply@careaigent.be>',
    to: registration.email,
    subject: `Bevestiging inschrijving: ${activity.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <h1 style="color: #002841;">Bevestiging inschrijving</h1>
        <p>Beste ${registration.voornaam} ${registration.naam},</p>
        <p>Uw inschrijving voor <strong>${activity.title}</strong> is bevestigd.</p>
        <ul>
          <li><strong>Datum:</strong> ${dateFormatted}</li>
          <li><strong>Locatie:</strong> ${activity.location ?? 'Wordt later meegedeeld'}</li>
        </ul>
        <p>U vindt een kalenderuitnodiging in bijlage (.ics bestand).</p>
        <p>Bij vragen: <a href="mailto:eric.lodewyckx@pxl.be">eric.lodewyckx@pxl.be</a></p>
        <p>Met vriendelijke groeten,<br>Team CareAIgent</p>
      </div>
    `,
    attachments: [
      {
        filename: 'uitnodiging.ics',
        content: Buffer.from(icsContent).toString('base64'),
      },
    ],
  });
}
