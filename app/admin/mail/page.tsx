import { prisma } from '@/lib/db';
import { MAIL_REGISTRY, MAIL_SOORT_VOLGORDE } from '@/lib/mailRegistry';
import MailClient, { type MailSoortData } from './MailClient';

export const dynamic = 'force-dynamic';

export default async function AdminMailPage() {
  const [appSettings, instellingen] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: 'singleton' } }),
    prisma.mailInstelling.findMany(),
  ]);
  const envFallback = !appSettings?.powerAutomateWebhookUrl && Boolean(process.env.POWER_AUTOMATE_WEBHOOK_URL);

  // Enkel serialiseerbare data naar de client; builders blijven op de server.
  const mailSoorten: MailSoortData[] = MAIL_SOORT_VOLGORDE.map((soort) => {
    const def = MAIL_REGISTRY[soort];
    const i = instellingen.find((x) => x.soort === soort);
    return {
      soort,
      label: def.label,
      beschrijving: def.beschrijving,
      ontvangersUitleg: def.ontvangersUitleg,
      ontvangerModus: def.ontvangerModus,
      replyToModus: def.replyToModus,
      ontvangerVerplicht: def.ontvangerVerplicht ?? false,
      standaard: def.standaard,
      tokens: [...def.tokens],
      enabled: i?.enabled ?? def.defaultEnabled,
      ontvangerEmail: i?.ontvangerEmail ?? '',
      replyToEmail: i?.replyToEmail ?? '',
      subject: i?.subject ?? '',
      intro: i?.intro ?? '',
      footerNote: i?.footerNote ?? '',
    };
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 style={{ color: 'var(--navy)' }}>Mail-instellingen</h1>
          <p className="admin-muted" style={{ marginTop: '6px', maxWidth: '720px' }}>
            Mails vertrekken via een Power Automate-webhook, net als in de Bibliotheektool en de
            Verpleegkunde-site. De webhook is voor alle mails dezelfde; per mailsoort stel je hieronder
            aan/uit, ontvanger, reply-to en teksten in.
          </p>
        </div>
      </div>
      <MailClient
        initialWebhookUrl={appSettings?.powerAutomateWebhookUrl ?? ''}
        initialReplyTo={appSettings?.replyToEmail ?? ''}
        envFallback={envFallback}
        mailSoorten={mailSoorten}
      />
    </div>
  );
}
