import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ActiviteitenPage() {
  const activities = await prisma.activity.findMany({
    orderBy: { dateStart: 'asc' },
    include: { _count: { select: { registrations: true } } },
  });

  return (
    <div>
      <div className="admin-page-header">
        <h1 style={{ color: 'var(--navy)' }}>Activiteiten</h1>
        <Link href="/admin/activiteiten/nieuw" className="btn-primary">
          + Nieuwe activiteit
        </Link>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Datum</th>
              <th>Inschrijvingen</th>
              <th>Status</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.dateStart.toLocaleDateString('nl-BE')}</td>
                <td>
                  {a._count.registrations}
                  {a.maxParticipants ? ` / ${a.maxParticipants}` : ''}
                </td>
                <td>{a.isOpen ? '🟢 Open' : '🔴 Gesloten'}</td>
                <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Link
                    href={`/admin/activiteiten/${a.id}`}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                  >
                    Bewerken
                  </Link>
                  <Link
                    href={`/admin/activiteiten/${a.id}/inschrijvingen`}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                  >
                    Inschrijvingen
                  </Link>
                </td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-mid)' }}>
                  Nog geen activiteiten
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
