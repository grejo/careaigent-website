import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MAIL_REGISTRY, buildMail, payloadContextFor, voorbeeldContextFor } from '@/lib/mailRegistry';
import { mailPreviewSchema, eersteFout } from '@/lib/mailSchemas';

/** Rendert een mailsoort met voorbeelddata en de (nog niet opgeslagen) teksten. Muteert niets. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = mailPreviewSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: eersteFout(parsed.error) }, { status: 400 });

  const { soort, subject, intro, footerNote } = parsed.data;
  const def = MAIL_REGISTRY[soort];
  const ctx = voorbeeldContextFor(soort);
  const built = buildMail(soort, ctx, { subject, intro, footerNote });
  const payload = {
    subject: built.subject,
    htmlBody: `<!DOCTYPE html>… (${built.html.length} tekens)`,
    ontvangers: [
      def.ontvangerModus === 'INSTELBAAR'
        ? { email: '(ingesteld adres)', naam: def.ontvangerNaamVast ?? def.label }
        : { email: '(volgt uit de gebeurtenis)', naam: '' },
    ],
    replyTo: def.replyToModus === 'CONTEXT' ? '(volgt uit de gebeurtenis)' : '(ingestelde of globale reply-to)',
    context: payloadContextFor(soort, ctx),
    attachments: def.bijlagen ? ['uitnodiging.ics (base64)'] : [],
  };
  return NextResponse.json({ subject: built.subject, html: built.html, payload });
}
