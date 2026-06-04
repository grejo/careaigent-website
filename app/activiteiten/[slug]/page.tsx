import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import RegistrationForm from '@/components/RegistrationForm';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const activity = await prisma.activity.findUnique({ where: { slug } });
  if (!activity) return { title: 'Niet gevonden' };
  return {
    title: activity.title,
    description: activity.description ?? `Schrijf u in voor ${activity.title}`,
  };
}

export default async function ActivityPage({ params }: Props) {
  const { slug } = await params;
  const activity = await prisma.activity.findUnique({
    where: { slug },
    include: { _count: { select: { registrations: true } } },
  });

  if (!activity) notFound();

  const isFull =
    activity.maxParticipants !== null &&
    activity._count.registrations >= activity.maxParticipants;
  const isClosed = !activity.isOpen;
  const dateStr = activity.dateStart.toLocaleDateString('nl-BE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const extraFields = (Array.isArray(activity.extraFields) ? activity.extraFields : []) as Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'radio' | 'checkbox';
    options?: string[];
    required: boolean;
  }>;

  return (
    <section className="activity-detail-section">
      <div style={{ marginBottom: '8px' }}>
        <a href="/agenda" style={{ color: 'var(--teal)', textDecoration: 'none' }}>
          ← Terug naar agenda
        </a>
      </div>

      <h1 style={{ color: 'var(--navy)', marginBottom: '12px' }}>{activity.title}</h1>

      <div style={{ color: 'var(--text-mid)', marginBottom: '24px' }}>
        <p>📅 {dateStr}</p>
        {activity.location && <p>📍 {activity.location}</p>}
        {activity.maxParticipants && (
          <p>👥 Max. {activity.maxParticipants} deelnemers
            {!isFull && ` (${activity.maxParticipants - activity._count.registrations} plaatsen beschikbaar)`}
          </p>
        )}
        {activity.registrationDeadline && (
          <p>⏰ Inschrijven voor {activity.registrationDeadline.toLocaleDateString('nl-BE')}</p>
        )}
      </div>

      {activity.description && (
        <div style={{ marginBottom: '32px', color: 'var(--text-dark)', lineHeight: '1.7' }}>
          {activity.description.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {isClosed || isFull ? (
        <div className="registration-closed">
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>
            {isFull ? '🔴 Deze activiteit is volzet.' : '🔒 Inschrijvingen zijn gesloten.'}
          </p>
          <p>Neem contact op via <a href="mailto:eric.lodewyckx@pxl.be">eric.lodewyckx@pxl.be</a> voor meer informatie.</p>
        </div>
      ) : (
        <>
          <h2 style={{ color: 'var(--navy)', marginBottom: '8px' }}>Inschrijvingsformulier</h2>
          <RegistrationForm activitySlug={activity.slug} extraFields={extraFields} />
        </>
      )}
    </section>
  );
}
