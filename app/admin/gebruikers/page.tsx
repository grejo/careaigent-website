import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function GebruikersPage() {
  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  async function createUser(formData: FormData) {
    'use server';
    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const password = formData.get('password') as string;

    if (!name || !email || !password) return;
    if (password.length < 8) return;

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) return;

    const passwordHash = await hash(password, 12);
    await prisma.admin.create({ data: { name, email, passwordHash } });
    revalidatePath('/admin/gebruikers');
  }

  return (
    <div>
      <h1 style={{ color: 'var(--navy)', marginBottom: '8px', fontFamily: 'Raleway, sans-serif' }}>
        Gebruikers
      </h1>
      <p style={{ color: 'var(--text-mid)', marginBottom: '32px' }}>
        Beheer de admin-accounts die toegang hebben tot dit portaal.
      </p>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>E-mail</th>
              <th>Aangemaakt</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.email}</td>
                <td>{a.createdAt.toLocaleDateString('nl-BE')}</td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-mid)' }}>
                  Geen gebruikers gevonden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{
        background: 'white', borderRadius: '16px',
        boxShadow: '0 2px 16px rgba(0,40,65,0.07)',
        padding: '32px', marginTop: '32px', maxWidth: '480px',
      }}>
        <h2 style={{ color: 'var(--navy)', marginBottom: '20px', fontFamily: 'Raleway, sans-serif', fontSize: '1.1rem' }}>
          Nieuwe gebruiker aanmaken
        </h2>
        <form action={createUser}>
          <div className="form-group">
            <label htmlFor="name">Naam *</label>
            <input id="name" name="name" type="text" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">E-mailadres *</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Tijdelijk wachtwoord * (min. 8 tekens)</label>
            <input id="password" name="password" type="password" required minLength={8} />
          </div>
          <button type="submit" className="btn-primary">
            Gebruiker aanmaken
          </button>
        </form>
      </div>
    </div>
  );
}
