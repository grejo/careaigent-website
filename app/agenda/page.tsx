import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Agenda',
  description: 'Overzicht van alle CareAIgent activiteiten, opleidingen en evenementen.',
  openGraph: {
    title: 'Agenda · CareAIgent',
    description: 'Overzicht van alle CareAIgent activiteiten en opleidingen.',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getActivities() {
  try {
    return await prisma.activity.findMany({
      orderBy: { dateStart: 'asc' },
      include: { _count: { select: { registrations: true } } },
    });
  } catch {
    return [];
  }
}

export default async function AgendaPage() {
  const activities = await getActivities();

  return (
    <section className="agenda-section">
      <div className="container">
        <h1 className="section-title">Agenda</h1>
        <p className="section-sub">Komende opleidingen en activiteiten van CareAIgent.</p>
        {activities.length === 0 ? (
          <p style={{ marginTop: '40px', color: 'var(--text-mid)' }}>
            Momenteel zijn er geen activiteiten gepland. Kom later terug.
          </p>
        ) : (
          <div className="activity-grid">
            {activities.map((activity) => {
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

              return (
                <div key={activity.id} className="activity-card">
                  <div className="activity-date">{dateStr}</div>
                  <h2 className="activity-title">{activity.title}</h2>
                  {activity.location && (
                    <p style={{ color: 'var(--text-mid)', marginBottom: '8px' }}>
                      📍 {activity.location}
                    </p>
                  )}
                  {activity.description && (
                    <p style={{ color: 'var(--text-mid)', fontSize: '0.95rem', marginBottom: '16px' }}>
                      {activity.description.length > 200
                        ? activity.description.slice(0, 200) + '…'
                        : activity.description}
                    </p>
                  )}
                  <div className="activity-footer">
                    {activity.maxParticipants && (
                      <span style={{ fontSize: '0.875rem', color: isFull ? '#d32f2f' : 'var(--teal-dark)' }}>
                        {isFull ? '🔴 Volzet' : `${activity.maxParticipants - activity._count.registrations} plaatsen beschikbaar`}
                      </span>
                    )}
                    {!isClosed && !isFull ? (
                      <Link href={`/activiteiten/${activity.slug}`} className="btn-primary">
                        Inschrijven →
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>
                        {isFull ? 'Volzet' : 'Inschrijvingen gesloten'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
