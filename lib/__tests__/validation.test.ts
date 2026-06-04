import { registrationSchema, activitySchema } from '../validation';

describe('registrationSchema', () => {
  const valid = {
    naam: 'Janssen',
    voornaam: 'Jan',
    email: 'jan@test.be',
    telefoon: '0479123456',
    instelling: 'AZ Ziekenhuis',
    functie: 'Verpleegkundige',
    extraData: {},
  };

  it('accepts valid registration', () => {
    expect(() => registrationSchema.parse(valid)).not.toThrow();
  });

  it('rejects missing email', () => {
    expect(() => registrationSchema.parse({ ...valid, email: '' })).toThrow();
  });

  it('rejects invalid email format', () => {
    expect(() => registrationSchema.parse({ ...valid, email: 'geen-email' })).toThrow();
  });

  it('rejects empty naam', () => {
    expect(() => registrationSchema.parse({ ...valid, naam: '' })).toThrow();
  });
});

describe('activitySchema', () => {
  it('accepts valid activity', () => {
    const valid = {
      title: 'AI Opleiding',
      slug: 'ai-opleiding',
      dateStart: new Date().toISOString(),
      isOpen: true,
      extraFields: [],
    };
    expect(() => activitySchema.parse(valid)).not.toThrow();
  });

  it('rejects slug with spaces', () => {
    expect(() => activitySchema.parse({
      title: 'Test',
      slug: 'slug met spaties',
      dateStart: new Date().toISOString(),
    })).toThrow();
  });
});
