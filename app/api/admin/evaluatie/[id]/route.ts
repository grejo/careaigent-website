import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { OPEN_VRAGEN, type Antwoorden } from '@/lib/evaluatie/formulierA';
import { GEANONIMISEERD } from '@/lib/evaluatie/stats';

/** Anonimiseert één open antwoord (bv. als er per ongeluk een naam in staat). */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;

  const body = (await req.json().catch(() => null)) as { veld?: unknown } | null;
  const veld = typeof body?.veld === 'string' ? body.veld : '';
  if (!OPEN_VRAGEN.some((v) => v.id === veld)) {
    return NextResponse.json({ error: 'Enkel open antwoorden kunnen geanonimiseerd worden.' }, { status: 400 });
  }

  const rij = await prisma.evaluatieAntwoord.findUnique({ where: { id }, select: { antwoorden: true } });
  if (!rij) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });

  const antwoorden = { ...(rij.antwoorden as Antwoorden), [veld]: GEANONIMISEERD };
  await prisma.evaluatieAntwoord.update({ where: { id }, data: { antwoorden: antwoorden as Prisma.InputJsonObject } });
  return NextResponse.json({ ok: true });
}
