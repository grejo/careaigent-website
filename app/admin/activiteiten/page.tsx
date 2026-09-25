import { prisma } from '@/lib/db';
import Link from 'next/link';
import DuplicateActivityButton from '@/components/admin/DuplicateActivityButton';
import ToggleActivityFlagButton from '@/components/admin/ToggleActivityFlagButton';
import { activityStatus, STATUS_LABEL } from '@/lib/activityStatus';

export const dynamic = 'force-dynamic';

const kleineKnop = { fontSize: '0.8rem', padding: '4px 10px' } as const;

export default async function ActiviteitenPage({
  searchParams,
}: {
  searchParams: Promise<{ alle?: string }>;
}) {
  const { alle } = await searchParams;
  const toonAlle = alle === '1';

  const activities = await prisma.activity.findMany({
    orderBy: { dateStart: 'asc' },
    include: { _count: { select: { registrations: true, evaluaties: { where: { isTest: false } } } } },
  });

  const metStatus = activities.map((a) => ({ ...a, status: activityStatus(a) }));
  const zichtbaar = toonAlle
    ? metStatus
    : metStatus.filter((a) => a.status === 'OPEN' || a.status === 'GESLOTEN');
  const verborgenAantal = metStatus.length - zichtbaar.length;

  return (
    <div>
      <div className="admin-page-header">
        <h1 style={{ color: 'var(--navy)' }}>Activiteiten</h1>
        <div className="admin-actions">
          <Link href={toonAlle ? '/admin/activiteiten' : '/admin/activiteiten?alle=1'} className="btn-secondary">
            {toonAlle ? 'Enkel lopende tonen' : `Toon afgelopen en verborgen${verborgenAantal ? ` (${verborgenAantal})` : ''}`}
          </Link>
          <Link href="/admin/activiteiten/nieuw" className="btn-primary">
            + Nieuwe activiteit
          </Link>
        </div>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Datum</th>
              <th>Inschrijvingen</th>
              <th>Status</th>
              <th>Evaluatie</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {zichtbaar.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.dateStart.toLocaleDateString('nl-BE')}</td>
                <td>
                  {a._count.registrations}
                  {a.maxParticipants ? ` / ${a.maxParticipants}` : ''}
                </td>
                <td>{STATUS_LABEL[a.status]}</td>
                <td>
                  {a.evaluatieOpen ? '🟢 Open' : '—'}
                  {a._count.evaluaties > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-mid)' }}>
                      {a._count.evaluaties} ingevuld
                    </div>
                  )}
                </td>
                <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Link href={`/admin/activiteiten/${a.id}`} className="btn-secondary" style={kleineKnop}>
                    Bewerken
                  </Link>
                  <Link href={`/admin/activiteiten/${a.id}/inschrijvingen`} className="btn-secondary" style={kleineKnop}>
                    Inschrijvingen
                  </Link>
                  <Link href={`/admin/activiteiten/${a.id}/deelnemers-mail`} className="btn-secondary" style={kleineKnop}>
                    Mail deelnemers
                  </Link>
                  <DuplicateActivityButton activityId={a.id} />
                  {(a.status === 'AFGELOPEN' || a.status === 'VERBORGEN') && (
                    <ToggleActivityFlagButton activityId={a.id} field="isHidden" value={a.isHidden} small />
                  )}
                </td>
              </tr>
            ))}
            {zichtbaar.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-mid)' }}>
                  {toonAlle ? 'Nog geen activiteiten' : 'Geen lopende activiteiten'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!toonAlle && (
        <p style={{ color: 'var(--text-mid)', fontSize: '0.85rem', marginTop: '12px' }}>
          Afgelopen activiteiten sluiten automatisch voor inschrijvingen en blijven zichtbaar onder
          &lsquo;Geschiedenis&rsquo; op de agenda. Met &lsquo;Verbergen&rsquo; haal je ze volledig van de site.
        </p>
      )}
    </div>
  );
}
