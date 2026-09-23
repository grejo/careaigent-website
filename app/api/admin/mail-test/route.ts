import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendMailVoorbeeldTest, sendWebhookTestMail } from '@/lib/mail';
import { mailTestSchema, eersteFout } from '@/lib/mailSchemas';

/** Zonder `soort`: generieke webhooktest. Met `soort`: die mail met voorbeelddata naar jezelf. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = mailTestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: eersteFout(parsed.error) }, { status: 400 });

  const toEmail = (parsed.data.toEmail || session.user.email).toLowerCase();
  const naam = session.user.name || toEmail;
  const { soort, subject, intro, footerNote } = parsed.data;

  const result = soort
    ? await sendMailVoorbeeldTest(soort, { email: toEmail, naam }, { subject, intro, footerNote })
    : await sendWebhookTestMail(toEmail, naam);

  if (!result.ok) return NextResponse.json({ error: result.reason ?? 'Verzenden mislukt' }, { status: 503 });
  return NextResponse.json({ ok: true, sentTo: toEmail });
}
