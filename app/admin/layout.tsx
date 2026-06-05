import { auth } from '@/auth';
import AdminNav from '@/components/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  async function signOutAction() {
    'use server';
    const { signOut } = await import('@/auth');
    await signOut({ redirectTo: '/admin/login' });
  }

  return (
    <>
      {session && <AdminNav signOutAction={signOutAction} />}
      <main className="admin-main">
        <div className="admin-main-inner">
          {children}
        </div>
      </main>
    </>
  );
}
