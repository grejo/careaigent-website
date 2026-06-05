import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { compare, hash } from 'bcryptjs';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProfielPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/admin/login');

  async function changePassword(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user?.email) return;

    const current = formData.get('current') as string;
    const newPw = formData.get('new') as string;
    const confirm = formData.get('confirm') as string;

    if (!current || !newPw || !confirm) return;
    if (newPw !== confirm) return;
    if (newPw.length < 8) return;

    const admin = await prisma.admin.findUnique({ where: { email: session.user.email } });
    if (!admin) return;

    const valid = await compare(current, admin.passwordHash);
    if (!valid) return;

    const passwordHash = await hash(newPw, 12);
    await prisma.admin.update({
      where: { email: session.user.email },
      data: { passwordHash },
    });
    redirect('/admin/profiel?success=1');
  }

  return (
    <div>
      <h1 style={{ color: 'var(--navy)', marginBottom: '8px', fontFamily: 'Raleway, sans-serif' }}>
        Mijn profiel
      </h1>
      <p style={{ color: 'var(--text-mid)', marginBottom: '32px' }}>
        Bekijk je accountgegevens en wijzig je wachtwoord.
      </p>

      <div style={{
        background: 'white', borderRadius: '16px',
        boxShadow: '0 2px 16px rgba(0,40,65,0.07)',
        padding: '32px', marginBottom: '24px', maxWidth: '480px',
      }}>
        <h2 style={{ color: 'var(--navy)', marginBottom: '16px', fontFamily: 'Raleway, sans-serif', fontSize: '1.1rem' }}>
          Accountgegevens
        </h2>
        <div className="form-group">
          <label>Naam</label>
          <input type="text" defaultValue={session.user.name ?? ''} disabled style={{ background: '#f5f5f5', color: 'var(--text-mid)' }} readOnly />
        </div>
        <div className="form-group">
          <label>E-mailadres</label>
          <input type="email" defaultValue={session.user.email} disabled style={{ background: '#f5f5f5', color: 'var(--text-mid)' }} readOnly />
        </div>
      </div>

      <div style={{
        background: 'white', borderRadius: '16px',
        boxShadow: '0 2px 16px rgba(0,40,65,0.07)',
        padding: '32px', maxWidth: '480px',
      }}>
        <h2 style={{ color: 'var(--navy)', marginBottom: '20px', fontFamily: 'Raleway, sans-serif', fontSize: '1.1rem' }}>
          Wachtwoord wijzigen
        </h2>
        <form action={changePassword}>
          <div className="form-group">
            <label htmlFor="current">Huidig wachtwoord *</label>
            <input id="current" name="current" type="password" required autoComplete="current-password" />
          </div>
          <div className="form-group">
            <label htmlFor="new">Nieuw wachtwoord * (min. 8 tekens)</label>
            <input id="new" name="new" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Bevestig nieuw wachtwoord *</label>
            <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <button type="submit" className="btn-primary">
            Wachtwoord opslaan
          </button>
        </form>
      </div>
    </div>
  );
}
