import { generateIcal } from '../email';

const mockActivity = {
  id: 'act-1',
  slug: 'test-opleiding',
  title: 'AI Opleiding Test',
  description: 'Een testbeschrijving',
  dateStart: new Date('2026-09-22T09:00:00+02:00'),
  dateEnd: new Date('2026-09-22T13:00:00+02:00'),
  location: 'PXL NEXT, Hasselt',
  maxParticipants: 20,
  registrationDeadline: null,
  isOpen: true,
  extraFields: [],
  createdAt: new Date(),
};

describe('generateIcal', () => {
  it('generates a valid iCal string', () => {
    const ics = generateIcal(mockActivity as any);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('AI Opleiding Test');
  });

  it('includes the location', () => {
    const ics = generateIcal(mockActivity as any);
    expect(ics).toContain('PXL NEXT');
  });

  it('works without dateEnd', () => {
    const actWithoutEnd = { ...mockActivity, dateEnd: null };
    expect(() => generateIcal(actWithoutEnd as any)).not.toThrow();
  });
});
