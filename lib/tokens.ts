import { createHash, randomBytes } from 'crypto';

/** URL-veilig random token (standaard 32 bytes). */
export function nieuwToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Tokens hebben een vaste vorm; alles anders meteen weigeren. */
export function isTokenVorm(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,100}$/.test(token);
}
