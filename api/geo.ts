import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Country lookup used by the regional notice banner.
 *
 * The lookup happens here, server side, so the browser never makes a
 * cross-origin request to a third party (which produced a CORS console error
 * on every page load). The answer is edge cached for a day.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const response = await fetch('https://api.country.is/', {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`lookup failed with status ${response.status}`);
    const data = (await response.json()) as { country?: string };
    return res.status(200).json({ country: data?.country ?? null });
  } catch {
    // Fail open: an unknown country simply means no banner is shown.
    return res.status(200).json({ country: null });
  }
}
