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
      <h1 style={{ color: 'var(--navy)', marginBottom: '24px' }}>Dashboard</h1>
      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-number">{activityCount}</span>
          <span className="stat-label">Activiteiten</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{registrationCount}</span>
          <span className="stat-label">Inschrijvingen</span>
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
