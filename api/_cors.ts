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
