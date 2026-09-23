import { activityStatus } from '../activityStatus';

const nu = new Date('2026-09-23T12:00:00Z');
const toekomst = new Date('2026-10-01T09:00:00Z');
const verleden = new Date('2026-09-22T09:00:00Z');

describe('activityStatus', () => {
  it('open en gesloten voor toekomstige activiteiten', () => {
    expect(activityStatus({ isOpen: true, isHidden: false, dateStart: toekomst }, nu)).toBe('OPEN');
    expect(activityStatus({ isOpen: false, isHidden: false, dateStart: toekomst }, nu)).toBe('GESLOTEN');
  });
  it('afgelopen zodra het einde voorbij is', () => {
    expect(activityStatus({ isOpen: true, isHidden: false, dateStart: verleden }, nu)).toBe('AFGELOPEN');
    expect(
      activityStatus({ isOpen: true, isHidden: false, dateStart: verleden, dateEnd: new Date('2026-09-23T13:00:00Z') }, nu),
    ).toBe('OPEN');
  });
  it('verborgen wint altijd', () => {
    expect(activityStatus({ isOpen: true, isHidden: true, dateStart: toekomst }, nu)).toBe('VERBORGEN');
  });
});
