import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { validateWebhookUrl } from '@/lib/webhook-url';
import { mailSettingsSchema, eersteFout } from '@/lib/mailSchemas';

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = mailSettingsSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: eersteFout(parsed.error) }, { status: 400 });

  const url = parsed.data.powerAutomateWebhookUrl ?? '';
  const replyTo = parsed.data.replyToEmail ?? '';
  if (url) {
    const check = validateWebhookUrl(url);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const data = { powerAutomateWebhookUrl: url || null, replyToEmail: replyTo || null };
  await prisma.appSettings.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', ...data },
  });
  return NextResponse.json({ ok: true });
}
