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
    <>
      {/* HERO */}
      <section className="hero" style={{ minHeight: 'unset', padding: '130px 48px 80px' }}>
        <div className="hero-inner" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="hero-badge">CareAIgent · Opleidingen &amp; Evenementen</div>
          <h1>
            Onze <em>agenda</em>
          </h1>
          <p className="hero-sub">
            Schrijf u in voor onze opleidingen, workshops en studiedagen rond AI in de Vlaamse zorgsector.
          </p>
        </div>
      </section>

      {/* ACTIVITY LIST */}
      <section style={{ background: 'var(--off-white)', padding: '80px 48px 100px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {activities.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '60px 40px',
              textAlign: 'center',
              boxShadow: '0 2px 16px rgba(0,40,65,0.07)',
            }}>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-mid)', marginBottom: '8px' }}>
                Momenteel zijn er geen activiteiten gepland.
              </p>
              <p style={{ color: 'var(--text-light)' }}>
                Kom later terug of neem contact op via{' '}
                <a href="mailto:eric.lodewyckx@pxl.be" style={{ color: 'var(--teal)' }}>
                  eric.lodewyckx@pxl.be
                </a>
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {activities.map((activity) => {
                const isFull =
                  activity.maxParticipants !== null &&
                  activity._count.registrations >= activity.maxParticipants;
                const isClosed = !activity.isOpen;
                const canRegister = !isClosed && !isFull;

                const dayNum = activity.dateStart.toLocaleDateString('nl-BE', { day: 'numeric' });
                const monthYear = activity.dateStart.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' });
                const weekday = activity.dateStart.toLocaleDateString('nl-BE', { weekday: 'long' });
                const timeStr = activity.dateStart.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
                const spotsLeft = activity.maxParticipants
                  ? activity.maxParticipants - activity._count.registrations
                  : null;

                return (
                  <div
                    key={activity.id}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      boxShadow: '0 2px 20px rgba(0,40,65,0.08)',
                      overflow: 'hidden',
                      display: 'flex',
                      borderLeft: `6px solid ${canRegister ? 'var(--teal)' : 'var(--text-light)'}`,
                    }}
                  >
                    {/* Date block */}
                    <div style={{
                      background: canRegister ? 'var(--navy)' : 'var(--text-mid)',
                      color: 'white',
                      minWidth: '110px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '24px 16px',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, fontFamily: 'Raleway, sans-serif' }}>
                        {dayNum}
                      </span>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px', opacity: 0.85 }}>
                        {monthYear}
                      </span>
                      <span style={{ fontSize: '0.75rem', marginTop: '8px', color: 'var(--teal-light)', fontWeight: 600 }}>
                        {timeStr}
                      </span>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '28px 32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--teal-dark)',
                          background: 'rgba(33,154,189,0.1)',
                          padding: '3px 10px',
                          borderRadius: '20px',
                        }}>
                          {weekday}
                        </span>
                        {!canRegister && (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: isFull ? '#b71c1c' : 'var(--text-mid)',
                            background: isFull ? 'rgba(183,28,28,0.1)' : 'rgba(0,0,0,0.05)',
                            padding: '3px 10px',
                            borderRadius: '20px',
                          }}>
                            {isFull ? 'Volzet' : 'Gesloten'}
                          </span>
                        )}
                      </div>

                      <h2 style={{
                        color: 'var(--navy)',
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        fontFamily: 'Raleway, sans-serif',
                        lineHeight: 1.3,
                        margin: 0,
                      }}>
                        {activity.title}
                      </h2>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: 'var(--text-mid)', fontSize: '0.875rem' }}>
                        {activity.location && (
                          <span>📍 {activity.location}</span>
                        )}
                        {activity.dateEnd && (
                          <span>
                            🕐 {timeStr} – {activity.dateEnd.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {spotsLeft !== null && canRegister && (
                          <span style={{ color: spotsLeft <= 5 ? '#e65100' : 'var(--teal-dark)', fontWeight: 600 }}>
                            👥 {spotsLeft} {spotsLeft === 1 ? 'plaats' : 'plaatsen'} beschikbaar
                          </span>
                        )}
                        {activity.registrationDeadline && (
                          <span>
                            ⏰ Inschrijven vóór{' '}
                            {activity.registrationDeadline.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}
                          </span>
                        )}
                      </div>

                      {activity.description && (
                        <p style={{ color: 'var(--text-mid)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                          {activity.description.length > 220
                            ? activity.description.slice(0, 220) + '…'
                            : activity.description}
                        </p>
                      )}

                      <div style={{ marginTop: '8px' }}>
                        {canRegister ? (
                          <Link
                            href={`/activiteiten/${activity.slug}`}
                            className="btn-primary"
                            style={{ display: 'inline-block' }}
                          >
                            Inschrijven →
                          </Link>
                        ) : (
                          <span style={{
                            color: 'var(--text-light)',
                            fontStyle: 'italic',
                            fontSize: '0.875rem',
                          }}>
                            {isFull ? 'Deze activiteit is volzet.' : 'Inschrijvingen zijn gesloten.'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
