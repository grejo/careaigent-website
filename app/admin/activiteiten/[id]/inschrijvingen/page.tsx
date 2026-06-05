import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import DeleteRegistrationButton from '@/components/admin/DeleteRegistrationButton';
import ToggleActivityButton from '@/components/admin/ToggleActivityButton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InschrijvingenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [activity, registrations] = await Promise.all([
    prisma.activity.findUnique({ where: { id } }),
    prisma.registration.findMany({ where: { activityId: id }, orderBy: { createdAt: 'desc' } }),
  ]);

  if (!activity) notFound();

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <Link href="/admin/activiteiten" style={{ color: 'var(--teal)', textDecoration: 'none', fontSize: '0.875rem' }}>
            ← Activiteiten
          </Link>
          <h1 style={{ color: 'var(--navy)', marginTop: '8px' }}>
            Inschrijvingen: {activity.title}
          </h1>
        </div>
        <div className="admin-actions">
          <ToggleActivityButton activityId={activity.id} isOpen={activity.isOpen} />
          <a
            href={`/api/admin/activities/${id}/registrations/export?format=csv`}
            className="btn-secondary"
          >
            Download CSV
          </a>
          <a
            href={`/api/admin/activities/${id}/registrations/export?format=xlsx`}
            className="btn-secondary"
          >
            Download Excel
          </a>
        </div>
      </div>

      <p style={{ color: 'var(--text-mid)', marginBottom: '16px' }}>
        {registrations.length} inschrijving{registrations.length !== 1 ? 'en' : ''}
        {activity.maxParticipants ? ` / max. ${activity.maxParticipants}` : ''}
      </p>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>E-mail</th>
              <th>Telefoon</th>
              <th>Instelling</th>
              <th>Functie</th>
              <th>Datum</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id}>
                <td>{r.voornaam} {r.naam}</td>
                <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
                <td>{r.telefoon}</td>
                <td>{r.instelling}</td>
                <td>{r.functie}</td>
                <td>{r.createdAt.toLocaleDateString('nl-BE')}</td>
                <td>
                  <DeleteRegistrationButton registrationId={r.id} />
                </td>
              </tr>
            ))}
            {registrations.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-mid)' }}>
                  Nog geen inschrijvingen
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
