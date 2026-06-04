import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  try {
    await prisma.registration.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Registration delete error:', err);
    return NextResponse.json({ error: 'Kon inschrijving niet verwijderen' }, { status: 500 });
  }
}
