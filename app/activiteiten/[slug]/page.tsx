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

  const timeStr = activity.dateStart.toLocaleTimeString('nl-BE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const spotsLeft =
    activity.maxParticipants !== null
      ? activity.maxParticipants - activity._count.registrations
      : null;

  return (
    <>
      {/* HERO */}
      <section className="activity-hero">
        <div className="activity-hero-inner">
          <a href="/agenda" className="activity-hero-back">← Terug naar agenda</a>
          <div className="hero-badge" style={{ marginBottom: '20px' }}>
            CareAIgent · Opleidingen &amp; Evenementen
          </div>
          <h1>{activity.title}</h1>
          <div className="activity-hero-meta">
            <span>📅 {dateStr}</span>
            {activity.location && <span>📍 {activity.location}</span>}
            {activity.dateEnd && (
              <span>
                🕐 {timeStr} – {activity.dateEnd.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {spotsLeft !== null && !isClosed && !isFull && (
              <span className={spotsLeft <= 5 ? 'meta-highlight' : ''}>
                👥 {spotsLeft} {spotsLeft === 1 ? 'plaats' : 'plaatsen'} beschikbaar
              </span>
            )}
            {activity.registrationDeadline && (
              <span>
                ⏰ Inschrijven vóór{' '}
                {activity.registrationDeadline.toLocaleDateString('nl-BE', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* TWO-COLUMN CONTENT */}
      <section className="activity-content-section">
        <div className="activity-content-grid">
          {/* LEFT: description */}
          <div className="activity-description">
            {activity.description ? (
              activity.description.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))
            ) : (
              <p style={{ color: 'var(--text-mid)', fontStyle: 'italic' }}>
                Geen verdere beschrijving beschikbaar.
              </p>
            )}
          </div>

          {/* RIGHT: form card */}
          <div className={`activity-form-card${isClosed || isFull ? ' activity-closed-card' : ''}`}>
            <div className="activity-form-card-header">
              <h2>
                {isFull ? '🔴 Volzet' : isClosed ? '🔒 Gesloten' : 'Inschrijven'}
              </h2>
            </div>
            <div className="activity-form-card-body">
              {isClosed || isFull ? (
                <>
                  <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-dark)' }}>
                    {isFull
                      ? 'Deze activiteit is volzet.'
                      : 'Inschrijvingen zijn gesloten.'}
                  </p>
                  <p style={{ color: 'var(--text-mid)', fontSize: '0.9rem' }}>
                    Neem contact op via{' '}
                    <a href="mailto:eric.lodewyckx@pxl.be" style={{ color: 'var(--teal)' }}>
                      eric.lodewyckx@pxl.be
                    </a>{' '}
                    voor meer informatie.
                  </p>
                </>
              ) : (
                <RegistrationForm activitySlug={activity.slug} extraFields={extraFields} />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
