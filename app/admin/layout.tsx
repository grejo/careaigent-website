import Link from 'next/link';
import { auth } from '@/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="admin-layout">
      {session && (
        <aside className="admin-sidebar">
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '24px', color: 'white' }}>
            CareAIgent Admin
          </div>
          <nav>
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/activiteiten">Activiteiten</Link>
          </nav>
          <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
            <form
              action={async () => {
                'use server';
                const { signOut } = await import('@/auth');
                await signOut({ redirectTo: '/admin/login' });
              }}
            >
              <button
                type="submit"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Uitloggen
              </button>
            </form>
          </div>
        </aside>
      )}
      <div className="admin-content">{children}</div>
    </div>
  );
}
