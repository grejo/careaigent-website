import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { MAIL_REGISTRY, isMailSoort } from '@/lib/mailRegistry';
import { mailSoortInstellingSchema, eersteFout } from '@/lib/mailSchemas';

export async function PUT(req: Request, context: { params: Promise<{ soort: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { soort } = await context.params;
  if (!isMailSoort(soort)) return NextResponse.json({ error: 'Onbekende mailsoort' }, { status: 404 });
  const def = MAIL_REGISTRY[soort];

  const parsed = mailSoortInstellingSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: eersteFout(parsed.error) }, { status: 400 });

  const ontvangerEmail = parsed.data.ontvangerEmail?.trim() ?? '';
  if (def.ontvangerVerplicht && parsed.data.enabled && !ontvangerEmail) {
    return NextResponse.json(
      { error: `${def.label} heeft een ontvangeradres nodig zolang ze aanstaat.` },
      { status: 400 },
    );
  }

  const data = {
    enabled: parsed.data.enabled,
    ontvangerEmail: ontvangerEmail || null,
    replyToEmail: parsed.data.replyToEmail?.trim() || null,
    subject: parsed.data.subject?.trim() || null,
    intro: parsed.data.intro?.trim() || null,
    footerNote: parsed.data.footerNote?.trim() || null,
  };
  await prisma.mailInstelling.upsert({ where: { soort }, update: data, create: { soort, ...data } });
  return NextResponse.json({ ok: true });
}
