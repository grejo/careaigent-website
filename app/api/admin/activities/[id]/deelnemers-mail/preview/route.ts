import { NextResponse } from 'next/server';
import { MailSoort } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { MAIL_REGISTRY } from '@/lib/mailRegistry';
import { siteUrl } from '@/lib/site';
import { downloadKnoppen, gekozenBijlagen, previewSchema } from '@/lib/deelnemerMail';
import { eersteFout } from '@/lib/mailSchemas';

/** Voorbeeld van de deelnemersmail met de echte activiteit, bijlagen en opgeslagen teksten. */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;

  const parsed = previewSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: eersteFout(parsed.error) }, { status: 400 });

  const [activiteit, instelling] = await Promise.all([
    prisma.activity.findUnique({ where: { id } }),
    prisma.mailInstelling.findUnique({ where: { soort: MailSoort.DEELNEMER_EVALUATIE_UITNODIGING } }),
  ]);
  if (!activiteit) return NextResponse.json({ error: 'Activiteit niet gevonden' }, { status: 404 });

  const bijlagen = await gekozenBijlagen(id, parsed.data.bijlageIds);
  const built = MAIL_REGISTRY.DEELNEMER_EVALUATIE_UITNODIGING.build(
    {
      voornaam: 'An',
      activiteit,
      evaluatieUrl: parsed.data.metEvaluatie ? `${siteUrl()}/evaluatie/t/voorbeeld` : null,
      downloads: downloadKnoppen('voorbeeld', bijlagen),
    },
    instelling ?? undefined,
  );
  return NextResponse.json({ subject: built.subject, html: built.html });
}
