import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const registrations = await prisma.registration.findMany({
    where: { activityId: id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(registrations);
}
