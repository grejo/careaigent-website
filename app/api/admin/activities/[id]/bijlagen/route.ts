import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { MAX_BIJLAGE_BYTES, isVeiligeUrl, mimeVoorBestand } from '@/lib/bijlagen';

/**
 * POST multipart/form-data { file, titel? } → bestand opladen (max 4 MB).
 * POST application/json { soort: 'LINK', titel, url } → link toevoegen.
 */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;

  const activity = await prisma.activity.findUnique({ where: { id }, select: { id: true } });
  if (!activity) return NextResponse.json({ error: 'Activiteit niet gevonden' }, { status: 404 });

  const type = req.headers.get('content-type') ?? '';

  if (type.includes('application/json')) {
    const body = (await req.json().catch(() => null)) as { titel?: unknown; url?: unknown } | null;
    const titel = typeof body?.titel === 'string' ? body.titel.trim().slice(0, 200) : '';
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    if (!titel) return NextResponse.json({ error: 'Geef de link een titel.' }, { status: 400 });
    if (!isVeiligeUrl(url) || url.length > 2000) {
      return NextResponse.json({ error: 'Enkel geldige http(s)-links zijn toegelaten.' }, { status: 400 });
    }
    const b = await prisma.activiteitBijlage.create({ data: { activityId: id, soort: 'LINK', titel, url } });
    return NextResponse.json({ id: b.id }, { status: 201 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Geen bestand ontvangen.' }, { status: 400 });
  if (file.size > MAX_BIJLAGE_BYTES) {
    return NextResponse.json({ error: 'Bestand is groter dan 4 MB. Plak in dat geval een link (bv. OneDrive).' }, { status: 413 });
  }
  const mime = mimeVoorBestand(file.name, file.type);
  if (!mime) {
    return NextResponse.json({ error: 'Enkel pdf, docx, pptx, xlsx, png of jpg.' }, { status: 415 });
  }
  const bestandsnaam = file.name.replace(/[\\/\r\n"]/g, '_').slice(0, 200) || 'bijlage';
  const titelIn = form?.get('titel');
  const titel = (typeof titelIn === 'string' && titelIn.trim() ? titelIn.trim() : bestandsnaam).slice(0, 200);
  const data = Buffer.from(await file.arrayBuffer());

  const b = await prisma.activiteitBijlage.create({
    data: { activityId: id, soort: 'BESTAND', titel, bestandsnaam, mimeType: mime, grootte: data.length, data },
    select: { id: true },
  });
  return NextResponse.json({ id: b.id }, { status: 201 });
}
