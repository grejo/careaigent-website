const ALLOWED_HOST_PATTERNS: RegExp[] = [
  /\.logic\.azure\.com$/i,
  /\.logic\.azure\.us$/i,
  /\.azurewebsites\.net$/i,
  /^prod-\d+\.westeurope\.logic\.azure\.com$/i,
  /\.powerplatform\.com$/i,
  /\.powerautomate\.com$/i,
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254",
  "metadata.google.internal",
]);

function isPrivateOrLoopbackIPv4(hostname: string): boolean {
  const m = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m || !m[1] || !m[2]) return false;
  const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export type WebhookValidation = { ok: true } | { ok: false; error: string };

export function validateWebhookUrl(input: string): WebhookValidation {
  let url: URL;
  try {
    url = new URL(input);
  } catch (err) { void err;
    return { ok: false, error: "Webhook-URL is niet geldig" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, error: "Webhook-URL moet met https:// starten" };
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host) || isPrivateOrLoopbackIPv4(host) || host === "::1") {
    return { ok: false, error: "Host niet toegelaten (interne/loopback adressen zijn geblokkeerd)" };
  }
  if (!ALLOWED_HOST_PATTERNS.some((re) => re.test(host))) {
    return {
      ok: false,
      error:
        "Host niet toegelaten. Enkel Power Automate / Azure hosts (bv. *.logic.azure.com, *.azurewebsites.net, *.powerplatform.com) zijn toegestaan.",
    };
  }
  return { ok: true };
}
