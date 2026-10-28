import type { VercelResponse } from '@vercel/node';

/** Shared CORS allowlist for public API endpoints (chat, payments, leads). */
export const ALLOWED_ORIGINS = new Set([
  'https://autosparkbd.com',
  'https://www.autosparkbd.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
]);

const VERCEL_APP_ORIGIN_RE = /^https:\/\/autospark-bd(-[a-z0-9-]+)?\.vercel\.app$/i;

/** Reflect only allowlisted origins; everything else gets the canonical origin. */
export function corsOrigin(reqOrigin: string | undefined): string {
  if (reqOrigin && (ALLOWED_ORIGINS.has(reqOrigin) || VERCEL_APP_ORIGIN_RE.test(reqOrigin))) return reqOrigin;
  return 'https://autosparkbd.com';
}

export function setCors(res: VercelResponse, origin: string) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
}

/**
 * Shared CORS preflight handler. Returns true when the request was an OPTIONS
 * request and has been fully answered; the caller should then return.
 *
 * Usage:
 *   const origin = corsOrigin(req.headers.origin);
 *   if (handleCorsPreflight(req, res, origin, 'POST, OPTIONS')) return;
 */
export function handleCorsPreflight(
  req: { method?: string },
  res: VercelResponse,
  origin: string,
  methods = 'GET, POST, OPTIONS'
): boolean {
  if (req.method !== 'OPTIONS') return false;
  res
    .status(200)
    .setHeader('Access-Control-Allow-Origin', origin)
    .setHeader('Access-Control-Allow-Methods', methods)
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .end();
  return true;
}
