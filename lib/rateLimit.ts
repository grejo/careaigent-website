// Eenvoudige rate limiter in het geheugen. Op serverless werkt dit per
// instantie (best effort); samen met de honeypot houdt het massale of
// geautomatiseerde inzendingen tegen. Er wordt niets bewaard in de databank
// en de sleutel (IP) verdwijnt na het venster.
const emmers = new Map<string, number[]>();

export function rateLimit(sleutel: string, limiet: number, vensterMs: number, nu = Date.now()): boolean {
  const recent = (emmers.get(sleutel) ?? []).filter((t) => nu - t < vensterMs);
  if (recent.length >= limiet) {
    emmers.set(sleutel, recent);
    return false;
  }
  recent.push(nu);
  emmers.set(sleutel, recent);
  if (emmers.size > 5000) {
    emmers.forEach((v, k) => {
      if (v.every((t) => nu - t >= vensterMs)) emmers.delete(k);
    });
  }
  return true;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'onbekend'
  );
}
