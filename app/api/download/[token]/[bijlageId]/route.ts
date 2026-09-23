import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registreerDownload, vindDownload } from '@/lib/download';

type Ctx = { params: Promise<{ token: string; bijlageId: string }> };

/**
 * POST: registreert de download en geeft de doel-URL terug. Wordt aangeroepen
 * door de downloadpagina (JavaScript), zodat mailscanners die links in mails
 * automatisch openen niet als download meetellen.
 */
export async function POST(_req: Request, context: Ctx) {
  const { token, bijlageId } = await context.params;
  const gevonden = await vindDownload(token, bijlageId);
  if (!gevonden) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  await registreerDownload(gevonden.bijlage.id, gevonden.deelnemerMailId);
  const url =
    gevonden.bijlage.soort === 'LINK' ? gevonden.bijlage.url : `/api/download/${token}/${gevonden.bijlage.id}`;
  return NextResponse.json({ url });
}

/** GET: levert het bestand (enkel geldig token + bijlage van dezelfde activiteit). Telt niet. */
export async function GET(_req: Request, context: Ctx) {
  const { token, bijlageId } = await context.params;
  const gevonden = await vindDownload(token, bijlageId);
  if (!gevonden) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  if (gevonden.bijlage.soort === 'LINK' && gevonden.bijlage.url) {
    return NextResponse.redirect(gevonden.bijlage.url);
  }
  const b = await prisma.activiteitBijlage.findUnique({ where: { id: gevonden.bijlage.id }, select: { data: true } });
  return new NextResponse(new Uint8Array(b?.data ?? Buffer.alloc(0)), {
    headers: {
      'Content-Type': gevonden.bijlage.mimeType ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(gevonden.bijlage.bestandsnaam ?? 'bijlage')}`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
