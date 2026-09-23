import { rateLimit } from '../rateLimit';

describe('rateLimit', () => {
  it('laat 5 inzendingen per 10 minuten toe', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) expect(rateLimit('ip-a', 5, 600_000, t0 + i)).toBe(true);
    expect(rateLimit('ip-a', 5, 600_000, t0 + 10)).toBe(false);
    expect(rateLimit('ip-b', 5, 600_000, t0 + 10)).toBe(true);
    expect(rateLimit('ip-a', 5, 600_000, t0 + 600_001)).toBe(true);
  });
});
