import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import DeleteRegistrationButton from '@/components/admin/DeleteRegistrationButton';
import ToggleActivityFlagButton from '@/components/admin/ToggleActivityFlagButton';
import CopyButton from '@/components/admin/CopyButton';
import { isAfgelopen } from '@/lib/activityStatus';
import { siteUrl } from '@/lib/site';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InschrijvingenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [activity, registrations] = await Promise.all([
    prisma.activity.findUnique({ where: { id } }),
    prisma.registration.findMany({ where: { activityId: id }, orderBy: { createdAt: 'desc' } }),
  ]);

  if (!activity) notFound();

  const afgelopen = isAfgelopen(activity);
  const algemeneLink = `${siteUrl()}/evaluatie?editie=${activity.slug}`;

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
          {!afgelopen && (
            <ToggleActivityFlagButton activityId={activity.id} field="isOpen" value={activity.isOpen} />
          )}
          <ToggleActivityFlagButton
            activityId={activity.id}
            field="isHidden"
            value={activity.isHidden}
            confirm={activity.isHidden ? undefined : 'Deze activiteit verdwijnt van de agenda en de detailpagina. Doorgaan?'}
          />
          <Link href={`/admin/activiteiten/${id}/deelnemers-mail`} className="btn-primary">
            ✉ Mail naar deelnemers
          </Link>
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

      <div className="admin-table-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong style={{ color: 'var(--navy)' }}>Evaluatie</strong>{' '}
            <span style={{ color: 'var(--text-mid)' }}>
              {activity.evaluatieOpen ? '🟢 open' : 'gesloten'} ·{' '}
              <Link href={`/admin/evaluatie?activiteit=${id}`} style={{ color: 'var(--teal)' }}>
                resultaten bekijken
              </Link>{' '}
              ·{' '}
              <Link href={`/admin/evaluatie/voorbeeld?activiteit=${id}`} style={{ color: 'var(--teal)' }}>
                formulier bekijken
              </Link>
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <ToggleActivityFlagButton activityId={activity.id} field="evaluatieOpen" value={activity.evaluatieOpen} small />
            <ToggleActivityFlagButton activityId={activity.id} field="evaluatieOpenLink" value={activity.evaluatieOpenLink} small />
          </div>
        </div>
        {activity.evaluatieOpenLink && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-mid)' }}>Algemene link (voor QR-code):</span>
            <code style={{ wordBreak: 'break-all' }}>{algemeneLink}</code>
            <CopyButton text={algemeneLink} />
          </div>
        )}
        <p style={{ color: 'var(--text-mid)', fontSize: '0.8rem', marginTop: '8px', marginBottom: 0 }}>
          Persoonlijke links (één keer bruikbaar) verstuur je via &lsquo;Mail naar deelnemers&rsquo;.
        </p>
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
