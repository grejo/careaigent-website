import { auth, signOut } from '@/auth';
import AdminNav from '@/components/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/admin/login' });
  }

  if (!session) {
    return <main style={{ background: 'var(--off-white)', minHeight: '100vh' }}>{children}</main>;
  }

  return (
    <>
      <AdminNav
        signOutAction={signOutAction}
        userName={session.user?.name ?? session.user?.email ?? ''}
      />
      <main className="admin-main">
        <div className="admin-main-inner">
          {children}
        </div>
      </main>
    </>
  );
}
