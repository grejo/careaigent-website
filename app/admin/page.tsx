import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [activityCount, registrationCount] = await Promise.all([
    prisma.activity.count().catch(() => 0),
    prisma.registration.count().catch(() => 0),
  ]);

  return (
    <div>
      <h1 style={{ color: 'var(--navy)', marginBottom: '8px', fontFamily: 'Raleway, sans-serif' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-mid)', marginBottom: '24px' }}>Welkom in het CareAIgent beheerportaal.</p>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card-top"><span>Activiteiten</span></div>
          <div className="admin-stat-card-body">
            <span className="admin-stat-number">{activityCount}</span>
            <span className="admin-stat-label">gepland</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card-top"><span>Inschrijvingen</span></div>
          <div className="admin-stat-card-body">
            <span className="admin-stat-number">{registrationCount}</span>
            <span className="admin-stat-label">in totaal</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <Link href="/admin/activiteiten" className="btn-primary">
          Beheer activiteiten →
        </Link>
      </div>
    </div>
  );
}
