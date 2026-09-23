import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/** Admin-voorbeeld van een bijlage (telt niet als download). */
export async function GET(_req: Request, context: { params: Promise<{ id: string; bijlageId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, bijlageId } = await context.params;
  const b = await prisma.activiteitBijlage.findFirst({ where: { id: bijlageId, activityId: id } });
  if (!b) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  if (b.soort === 'LINK' && b.url) return NextResponse.redirect(b.url);
  return new NextResponse(new Uint8Array(b.data ?? Buffer.alloc(0)), {
    headers: {
      'Content-Type': b.mimeType ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(b.bestandsnaam ?? 'bijlage')}`,
      'Cache-Control': 'private, no-store',
    },
  });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string; bijlageId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, bijlageId } = await context.params;
  const res = await prisma.activiteitBijlage.deleteMany({ where: { id: bijlageId, activityId: id } });
  if (res.count === 0) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
