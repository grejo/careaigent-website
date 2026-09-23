import Link from 'next/link';
import { prisma } from '@/lib/db';
import { berekenStats, MIN_N, type Gemiddelde, type Telling } from '@/lib/evaluatie/stats';
import { KENNIS_CORRECT } from '@/lib/evaluatie/kennischeck.server';
import { ruimVerlopenContactenOp } from '@/lib/evaluatie/opslag';
import type { Antwoorden } from '@/lib/evaluatie/formulierA';
import OpenAntwoorden from './OpenAntwoorden';

export const dynamic = 'force-dynamic';

function fmt(n: number | null, decimalen = 2): string {
  return n === null ? '–' : n.toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: decimalen });
}

function Balk({ label, waarde, max, n, pre }: { label: string; waarde: number | null; max: number; n?: number; pre?: boolean }) {
  const pct = waarde === null ? 0 : Math.max(0, Math.min(100, (waarde / max) * 100));
  return (
    <div className="eval-bar-row">
      <span>
        {label}
        {n !== undefined && <span className="admin-muted"> (n = {n})</span>}
      </span>
      <span className={`eval-bar${pre ? ' pre' : ''}`} aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </span>
      <span className="eval-bar-val">{fmt(waarde)}</span>
    </div>
  );
}

function GemBalk({ label, g, max = 5 }: { label: string; g: Gemiddelde; max?: number }) {
  return <Balk label={label} waarde={g.gem} max={max} n={g.n} />;
}

function Verdeling({ titel, tellingen }: { titel: string; tellingen: Telling[] }) {
  const max = Math.max(1, ...tellingen.map((t) => t.aantal));
  return (
    <div>
      <h3>{titel}</h3>
      {tellingen.map((t) => (
        <div key={t.label} className="eval-bar-row">
          <span>{t.label}</span>
          <span className="eval-bar" aria-hidden>
            <span style={{ width: `${(t.aantal / max) * 100}%` }} />
          </span>
          <span className="eval-bar-val">{t.aantal}</span>
        </div>
      ))}
    </div>
  );
}

export default async function EvaluatieDashboard({ searchParams }: { searchParams: Promise<{ activiteit?: string }> }) {
  const { activiteit } = await searchParams;
  await ruimVerlopenContactenOp();

  const [activiteiten, rijen, opvolgContacten, uitnodigingen] = await Promise.all([
    prisma.activity.findMany({
      where: { OR: [{ evaluatieOpen: true }, { evaluaties: { some: {} } }] },
      orderBy: { dateStart: 'desc' },
      select: {
        id: true,
        title: true,
        dateStart: true,
        evaluatieOpen: true,
        _count: { select: { evaluaties: true, registrations: true } },
      },
    }),
    prisma.evaluatieAntwoord.findMany({
      where: activiteit ? { activityId: activiteit } : {},
      select: { id: true, antwoorden: true, kennisScore: true, c1Opvolging: true },
    }),
    prisma.opvolgContact.count({ where: activiteit ? { activityId: activiteit } : {} }),
    prisma.deelnemerMail.groupBy({
      by: ['evaluatieIngevuld'],
      where: { aantalVerstuurd: { gt: 0 }, ...(activiteit ? { activityId: activiteit } : {}) },
      _count: true,
    }),
  ]);

  const stats = berekenStats(
    rijen.map((r) => ({ ...r, antwoorden: r.antwoorden as Antwoorden })),
    KENNIS_CORRECT,
  );
  const gekozen = activiteiten.find((a) => a.id === activiteit);
  const uitgenodigd = uitnodigingen.reduce((s, g) => s + g._count, 0);
  const viaLinkIngevuld = uitnodigingen.find((g) => g.evaluatieIngevuld)?._count ?? 0;
  const inschrijvingen = gekozen ? gekozen._count.registrations : null;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 style={{ color: 'var(--navy)' }}>Evaluatie</h1>
          <p className="admin-muted" style={{ marginTop: '4px' }}>
            Train de Trainer: AI-Ambassadeur in de Zorg · formulier A. Gemiddelden verschijnen vanaf n = {MIN_N}.
          </p>
        </div>
        <div className="admin-actions">
          <a href={`/api/admin/evaluatie/export${activiteit ? `?activiteit=${activiteit}` : ''}`} className="btn-secondary">
            CSV-export
          </a>
        </div>
      </div>

      <form method="get" className="admin-card" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0, minWidth: '260px', flex: 1 }}>
          <label htmlFor="activiteit">Editie</label>
          <select id="activiteit" name="activiteit" defaultValue={activiteit ?? ''}>
            <option value="">Alle edities samen</option>
            {activiteiten.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} – {a.dateStart.toLocaleDateString('nl-BE')} ({a._count.evaluaties})
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">Toon</button>
      </form>

      {/* Respons */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card-top"><span>Respons</span></div>
          <div className="admin-stat-card-body">
            <span className="admin-stat-number">{stats.n}</span>
            <span className="admin-stat-label">
              evaluaties
              {inschrijvingen ? ` · ${Math.round((stats.n / inschrijvingen) * 100)}% van ${inschrijvingen} inschrijvingen` : ''}
            </span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card-top"><span>Persoonlijke links</span></div>
          <div className="admin-stat-card-body">
            <span className="admin-stat-number">{viaLinkIngevuld} / {uitgenodigd}</span>
            <span className="admin-stat-label">uitgenodigden vulden in</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card-top"><span>Aanbevelingsscore (NPS)</span></div>
          <div className="admin-stat-card-body">
            <span className="admin-stat-number">{stats.nps.score === null ? '–' : stats.nps.score}</span>
            <span className="admin-stat-label">n = {stats.nps.n}</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card-top"><span>Kennischeck</span></div>
          <div className="admin-stat-card-body">
            <span className="admin-stat-number">{fmt(stats.kennis.gem)} / 3</span>
            <span className="admin-stat-label">n = {stats.kennis.n}</span>
          </div>
        </div>
      </div>

      {gekozen && (
        <p className="admin-muted" style={{ margin: '12px 0' }}>
          <Link href={`/admin/activiteiten/${gekozen.id}/deelnemers-mail`} style={{ color: 'var(--teal)' }}>
            Mail naar deelnemers en persoonlijke links →
          </Link>
        </p>
      )}

      {stats.n === 0 ? (
        <div className="admin-card" style={{ marginTop: '20px' }}>
          <p className="admin-muted" style={{ margin: 0 }}>Nog geen evaluaties voor deze selectie.</p>
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <div className="admin-grid-2">
            <div className="admin-card">
              <h2>Reactie (1–5)</h2>
              {stats.reactie.map((r) => (
                <GemBalk key={r.id} label={`${r.id} ${r.tekst}`} g={r} />
              ))}
            </div>

            <div className="admin-card">
              <h2>Blokken (1–5)</h2>
              {stats.blokken.map((b) => (
                <div key={b.id} style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--navy)' }}>{b.label}</div>
                  <GemBalk label="Relevantie" g={b.relevantie} />
                  <GemBalk label="Uitwerking" g={b.uitwerking} />
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <h2>Leerwinst (retrospectief VÓÓR → NU, 1–5)</h2>
            <p className="admin-muted">Gesorteerd op grootste winst. Grijs = vóór, teal = nu.</p>
            {stats.leerwinst.map((l) => (
              <div key={l.id} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
                  {l.id} {l.tekst} <span className="admin-muted">(n = {l.n})</span>
                  <span style={{ float: 'right', color: 'var(--teal-dark)' }}>
                    {l.verschil === null ? '–' : `${l.verschil > 0 ? '+' : ''}${fmt(l.verschil)}`}
                  </span>
                </div>
                <Balk label="Vóór" waarde={l.pre} max={5} pre />
                <Balk label="Nu" waarde={l.post} max={5} />
              </div>
            ))}
          </div>

          <div className="admin-grid-2">
            <div className="admin-card">
              <h2>Aanbevelingsscore</h2>
              <p className="admin-muted">
                NPS = % promotors (9–10) − % criticasters (0–6). Promotors {stats.nps.promotors} · passief{' '}
                {stats.nps.passief} · criticasters {stats.nps.criticasters}.
              </p>
              <Verdeling titel="Verdeling 0–10" tellingen={stats.nps.verdeling.map((aantal, i) => ({ label: String(i), aantal }))} />
            </div>

            <div className="admin-card">
              <h2>Kennischeck</h2>
              {stats.kennis.perVraag.map((k) => (
                <Balk key={k.id} label={`${k.id} ${k.tekst}`} waarde={k.pctCorrect} max={100} n={k.n} />
              ))}
              <p className="admin-muted">Waarde = % juist van wie de vraag beantwoordde.</p>
            </div>
          </div>

          <div className="admin-grid-2">
            <div className="admin-card">
              <h2>Transfer</h2>
              {stats.transfer.map((t) => (
                <GemBalk key={t.id} label={`${t.id} ${t.tekst}`} g={t} />
              ))}
              <Verdeling titel="Verwachte drempels (T4)" tellingen={stats.drempels} />
              <Verdeling titel="Interesse peer learning / vervolgtraject (T5)" tellingen={stats.interesse} />
            </div>

            <div className="admin-card">
              <h2>Profiel</h2>
              <Verdeling titel="Functie (P2)" tellingen={stats.profiel.functie} />
              <Verdeling titel="Type instelling (P3)" tellingen={stats.profiel.instelling} />
              <Verdeling titel="Formeel AI-mandaat (P4)" tellingen={stats.profiel.mandaat} />
            </div>
          </div>

          <div className="admin-card">
            <h2>Opvolging</h2>
            <p style={{ margin: 0 }}>
              {stats.opvolgingToestemming} van {stats.n} gaven toestemming voor een opvolgbevraging na 3 maanden;{' '}
              {opvolgContacten} e-mailadres(sen) bewaard (apart van de antwoorden, automatisch gewist na 6 maanden).
            </p>
          </div>

          <div className="admin-card">
            <h2>Open antwoorden</h2>
            <OpenAntwoorden blokken={stats.open} />
          </div>
        </div>
      )}
    </div>
  );
}
