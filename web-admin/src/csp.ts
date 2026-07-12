import { randomBytes } from "node:crypto";

/** Generates a CSP-safe nonce for script tags. */
export function generateCspNonce(): string {
  return randomBytes(16).toString("base64");
}

/** Builds the web-admin Content-Security-Policy header value. */
export function buildCspHeader(nonce: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self'",
    // HTMX applies inline style attributes for indicators/swaps; external CSS stays on style-src.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: https://cdn.discordapp.com",
    "connect-src 'self' https://discord.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    // Chrome applies form-action to redirect chains after POST; allow Discord OAuth.
    "form-action 'self' https://discord.com",
  ];
  return directives.join("; ");
}
