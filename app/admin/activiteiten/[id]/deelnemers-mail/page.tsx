import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { bijlagenMetTellers } from '@/lib/bijlagen';
import ToggleActivityFlagButton from '@/components/admin/ToggleActivityFlagButton';
import DeelnemersMailClient, { type ClientData } from './DeelnemersMailClient';

export const dynamic = 'force-dynamic';

export default async function DeelnemersMailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activiteit = await prisma.activity.findUnique({ where: { id } });
  if (!activiteit) notFound();

  const session = await auth();
  const [inschrijvingen, deelnemerMails, testMail, bijlagen] = await Promise.all([
    prisma.registration.findMany({
      where: { activityId: id },
      orderBy: [{ naam: 'asc' }, { voornaam: 'asc' }],
      select: { id: true, voornaam: true, naam: true, email: true, nietDeelgenomen: true },
    }),
    prisma.deelnemerMail.findMany({
      where: { activityId: id, isTest: false },
      orderBy: { email: 'asc' },
      select: { id: true, email: true, naam: true, bron: true, aantalVerstuurd: true, laatstVerstuurdOp: true, evaluatieIngevuld: true },
    }),
    prisma.deelnemerMail.findFirst({
      where: { activityId: id, isTest: true },
      select: { id: true, email: true, laatstVerstuurdOp: true, evaluatieIngevuld: true },
    }),
    bijlagenMetTellers(id),
  ]);

  const data: ClientData = {
    activityId: id,
    evaluatieOpen: activiteit.evaluatieOpen,
    inschrijvingen: inschrijvingen.map((r) => ({
      id: r.id,
      email: r.email.trim().toLowerCase(),
      naam: `${r.voornaam} ${r.naam}`.trim(),
      nietDeelgenomen: r.nietDeelgenomen,
    })),
    deelnemers: deelnemerMails.map((d) => ({
      ...d,
      laatstVerstuurdOp: d.laatstVerstuurdOp?.toISOString() ?? null,
      downloads: Object.fromEntries(
        bijlagen.map((b) => [b.id, b.downloads.find((x) => x.deelnemerMailId === d.id)?.aantal ?? 0]),
      ),
    })),
    test: {
      mijnEmail: session?.user?.email ?? null,
      ontvanger: testMail
        ? {
            email: testMail.email,
            laatstVerstuurdOp: testMail.laatstVerstuurdOp?.toISOString() ?? null,
            evaluatieIngevuld: testMail.evaluatieIngevuld,
            downloads: Object.fromEntries(
              bijlagen.map((b) => [b.id, b.testDownloads.find((x) => x.deelnemerMailId === testMail.id)?.aantal ?? 0]),
            ),
          }
        : null,
    },
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
          <Link href={`/admin/evaluatie/voorbeeld?activiteit=${id}`} className="btn-secondary">Formulier bekijken</Link>
          <Link href={`/admin/evaluatie?activiteit=${id}`} className="btn-secondary">Resultaten evaluatie</Link>
        </div>
      </div>
      <DeelnemersMailClient data={data} />
    </div>
  );
}
