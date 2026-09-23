import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { valideerFormulier } from '@/lib/evaluatie/validatie';
import { berekenKennisScore } from '@/lib/evaluatie/kennischeck.server';
import { FORM_VERSIE } from '@/lib/evaluatie/formulierA';
import { alleenDag, bepaalToegang, ruimVerlopenContactenOp, verwijderDatum } from '@/lib/evaluatie/opslag';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { nieuwToken } from '@/lib/tokens';
import { sendEvaluatieMelding } from '@/lib/mail';

const TOEGANG_FOUT = {
  onbekend: { status: 404, error: 'Deze evaluatielink is ongeldig.' },
  gesloten: { status: 409, error: 'Deze evaluatie is afgesloten.' },
  al_ingevuld: { status: 409, error: 'Je hebt deze evaluatie al ingevuld. Bedankt!' },
  geen_open_link: { status: 403, error: 'Deze evaluatie kan enkel via je persoonlijke link ingevuld worden.' },
} as const;

class AlIngevuldFout extends Error {}

export async function POST(req: Request) {
  if (!rateLimit(`evaluatie:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Te veel inzendingen. Probeer het over enkele minuten opnieuw.' }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Ongeldige invoer' }, { status: 400 });
  }

  // Honeypot: mensen zien dit veld niet. Doe alsof alles gelukt is.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ kennisScore: null, feedback: [] }, { status: 201 });
  }

  const toegang = await bepaalToegang({
    token: typeof body.token === 'string' ? body.token : null,
    editie: typeof body.editie === 'string' ? body.editie : null,
  });
  if (!toegang.ok) {
    const f = TOEGANG_FOUT[toegang.reden];
    return NextResponse.json({ error: f.error }, { status: f.status });
  }

  const antwoorden = body.antwoorden && typeof body.antwoorden === 'object' ? (body.antwoorden as Record<string, unknown>) : {};
  const resultaat = valideerFormulier({ antwoorden, email: body.email });
  if (!resultaat.ok) {
    return NextResponse.json({ fouten: resultaat.fouten }, { status: 422 });
  }

  const { kennisScore, feedback } = berekenKennisScore(resultaat.antwoorden);
  const activityId = toegang.activiteit.id;

  try {
    await prisma.$transaction(async (tx) => {
      // Persoonlijke link eerst ongeldig maken; lukt dat niet (gelijktijdige
      // inzending), dan wordt er ook niets opgeslagen.
      if (toegang.deelnemerMailId) {
        const upd = await tx.deelnemerMail.updateMany({
          where: { id: toegang.deelnemerMailId, evaluatieIngevuld: false },
          data: { evaluatieIngevuld: true },
        });
        if (upd.count !== 1) throw new AlIngevuldFout();
      }
      // Bewust GEEN verwijzing naar de uitnodiging, e-mail of IP.
      await tx.evaluatieAntwoord.create({
        data: {
          activityId,
          createdAt: alleenDag(),
          formVersie: FORM_VERSIE,
          antwoorden: resultaat.antwoorden,
          kennisScore,
          c1Opvolging: resultaat.c1Opvolging,
        },
      });
      if (resultaat.c1Opvolging && resultaat.email) {
        await tx.opvolgContact.createMany({
          data: [{ activityId, email: resultaat.email, token: nieuwToken(), verwijderOp: verwijderDatum() }],
          skipDuplicates: true,
        });
      }
    });
  } catch (err) {
    if (err instanceof AlIngevuldFout) {
      return NextResponse.json({ error: TOEGANG_FOUT.al_ingevuld.error }, { status: 409 });
    }
    console.error('[evaluatie] Opslaan mislukt:', err);
    return NextResponse.json({ error: 'Opslaan mislukt. Probeer het opnieuw.' }, { status: 500 });
  }

  await ruimVerlopenContactenOp();
  const aantalEvaluaties = await prisma.evaluatieAntwoord.count({ where: { activityId } });
  const melding = await sendEvaluatieMelding({ activiteit: toegang.activiteit, aantalEvaluaties });
  if (!melding.ok) console.info('[evaluatie] Admin-melding niet verstuurd:', melding.reason);

  return NextResponse.json({ kennisScore, feedback }, { status: 201 });
}
