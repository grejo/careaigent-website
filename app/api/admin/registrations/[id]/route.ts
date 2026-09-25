import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/** Markeert een inschrijving als (niet) deelgenomen. */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as { nietDeelgenomen?: unknown } | null;
  if (typeof body?.nietDeelgenomen !== 'boolean') {
    return NextResponse.json({ error: 'nietDeelgenomen (true/false) ontbreekt' }, { status: 400 });
  }
  try {
    await prisma.registration.update({ where: { id }, data: { nietDeelgenomen: body.nietDeelgenomen } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Registration update error:', err);
    return NextResponse.json({ error: 'Kon inschrijving niet aanpassen' }, { status: 500 });
  }
}

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
