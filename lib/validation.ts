import { z } from 'zod';

export const registrationSchema = z.object({
  naam: z.string().min(1, 'Naam is verplicht'),
  voornaam: z.string().min(1, 'Voornaam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  telefoon: z.string().min(1, 'Telefoonnummer is verplicht'),
  instelling: z.string().min(1, 'Instelling is verplicht'),
  functie: z.string().min(1, 'Functie is verplicht'),
  extraData: z.record(z.string(), z.any()).default({}),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const activitySchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug mag alleen kleine letters, cijfers en koppeltekens bevatten'),
  description: z.string().optional().nullable(),
  dateStart: z.string().min(1, 'Startdatum is verplicht'),
  dateEnd: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  maxParticipants: z.number().int().positive().optional().nullable(),
  registrationDeadline: z.string().optional().nullable(),
  isOpen: z.boolean().default(true),
  extraFields: z.array(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(['text', 'textarea', 'radio', 'checkbox']),
      options: z.array(z.string()).optional(),
      required: z.boolean().default(false),
    })
  ).default([]),
});

export type ActivityInput = z.infer<typeof activitySchema>;
