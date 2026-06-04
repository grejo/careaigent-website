import { registrationSchema } from '@/lib/validation';

describe('registration API input validation', () => {
  const validPayload = {
    naam: 'Peeters',
    voornaam: 'An',
    email: 'an@test.be',
    telefoon: '0479000000',
    instelling: 'WZC Test',
    functie: 'Directeur',
    extraData: { lunch: 'Ja' },
  };

  it('validates a complete registration payload', () => {
    const result = registrationSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects payload with invalid email', () => {
    const result = registrationSchema.safeParse({
      ...validPayload,
      email: 'niet-valide',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty functie', () => {
    const result = registrationSchema.safeParse({
      ...validPayload,
      functie: '',
    });
    expect(result.success).toBe(false);
  });
});
