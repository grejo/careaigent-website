import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { bijlagenMetTellers } from '@/lib/bijlagen';
import ToggleActivityFlagButton from '@/components/admin/ToggleActivityFlagButton';
import DeelnemersMailClient, { type ClientData } from './DeelnemersMailClient';

export const dynamic = 'force-dynamic';

export default async function DeelnemersMailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activiteit = await prisma.activity.findUnique({ where: { id } });
  if (!activiteit) notFound();

  const [inschrijvingen, deelnemerMails, bijlagen] = await Promise.all([
    prisma.registration.findMany({
      where: { activityId: id },
      orderBy: [{ naam: 'asc' }, { voornaam: 'asc' }],
      select: { voornaam: true, naam: true, email: true },
    }),
    prisma.deelnemerMail.findMany({
      where: { activityId: id },
      orderBy: { email: 'asc' },
      select: { id: true, email: true, naam: true, bron: true, aantalVerstuurd: true, laatstVerstuurdOp: true, evaluatieIngevuld: true },
    }),
    bijlagenMetTellers(id),
  ]);

  const data: ClientData = {
    activityId: id,
    evaluatieOpen: activiteit.evaluatieOpen,
    inschrijvingen: inschrijvingen.map((r) => ({ email: r.email.trim().toLowerCase(), naam: `${r.voornaam} ${r.naam}`.trim() })),
    deelnemers: deelnemerMails.map((d) => ({
      ...d,
      laatstVerstuurdOp: d.laatstVerstuurdOp?.toISOString() ?? null,
      downloads: Object.fromEntries(
        bijlagen.map((b) => [b.id, b.downloads.find((x) => x.deelnemerMailId === d.id)?.aantal ?? 0]),
      ),
    })),
    bijlagen: bijlagen.map((b) => ({
      id: b.id,
      soort: b.soort,
      titel: b.titel,
      bestandsnaam: b.bestandsnaam,
      grootte: b.grootte,
      url: b.url,
      uniek: b.uniek,
      totaal: b.totaal,
    })),
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <Link href={`/admin/activiteiten/${id}/inschrijvingen`} style={{ color: 'var(--teal)', textDecoration: 'none', fontSize: '0.875rem' }}>
            ← Inschrijvingen
          </Link>
          <h1 style={{ color: 'var(--navy)', marginTop: '8px' }}>Mail naar deelnemers: {activiteit.title}</h1>
        </div>
        <div className="admin-actions">
          <ToggleActivityFlagButton activityId={id} field="evaluatieOpen" value={activiteit.evaluatieOpen} />
          <Link href={`/admin/evaluatie?activiteit=${id}`} className="btn-secondary">Resultaten evaluatie</Link>
        </div>
      </div>
      <DeelnemersMailClient data={data} />
    </div>
  );
}
