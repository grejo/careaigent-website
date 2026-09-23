import { z } from 'zod';
import { MailSoort } from '@prisma/client';

const optioneleEmail = z
  .string()
  .trim()
  .max(254)
  .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Ongeldig e-mailadres')
  .optional();

const tekst = (max: number) => z.string().max(max).optional();

export const mailSettingsSchema = z.object({
  powerAutomateWebhookUrl: z.string().trim().max(2000).optional(),
  replyToEmail: optioneleEmail,
});

export const mailSoortInstellingSchema = z.object({
  enabled: z.boolean(),
  ontvangerEmail: optioneleEmail,
  replyToEmail: optioneleEmail,
  subject: tekst(300),
  intro: tekst(3000),
  footerNote: tekst(1000),
});

export const mailPreviewSchema = z.object({
  soort: z.nativeEnum(MailSoort),
  subject: tekst(300),
  intro: tekst(3000),
  footerNote: tekst(1000),
});

export const mailTestSchema = mailPreviewSchema.partial({ soort: true }).extend({
  toEmail: optioneleEmail,
});

export function eersteFout(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? `${issue.path.join('.') || 'invoer'}: ${issue.message}` : 'Ongeldige invoer';
}
