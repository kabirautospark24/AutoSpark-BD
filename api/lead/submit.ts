import { randomUUID } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insertLead } from '../_db.js';
import { corsOrigin, setCors, handleCorsPreflight } from '../_cors.js';
import { normalizeWhatsApp } from '../../src/sparkai/config.js';

const cap = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = corsOrigin(req.headers.origin as string | undefined);
  setCors(res, origin);
  if (handleCorsPreflight(req, res, origin, 'POST, OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body ?? {};
  const name = cap(body.name, 100);
  const whatsapp = normalizeWhatsApp(cap(body.whatsapp, 20));
  const language = cap(body.language, 20) || 'en';
  const interest = cap(body.interest, 200);
  const budgetRange = cap(body.budgetRange, 40);
  const timeline = cap(body.timeline, 40);
  const notes = cap(body.notes, 500);
  const consent = Boolean(body.consent);

  const errors: string[] = [];
  if (name.length < 2) errors.push('Name is required');
  if (!whatsapp) errors.push('Valid WhatsApp number is required');
  if (interest.length < 2) errors.push('Interest/vehicle is required');
  if (!budgetRange) errors.push('Budget range is required');
  if (!timeline) errors.push('Timeline is required');
  if (!consent) errors.push('Consent is required');

  if (errors.length || !whatsapp) return res.status(400).json({ error: errors.length ? errors.join('. ') : 'Valid WhatsApp number is required' });

  const reference = `SPK-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8)}`;

  const saved = await insertLead({
    name,
    whatsapp,
    language,
    interest,
    budget_range: budgetRange,
    timeline,
    notes,
    reference,
    source: 'sparkai',
  });

  // A lead that was never persisted must not look like a success to the customer.
  if (!saved) return res.status(502).json({ error: 'Could not save your request. Please retry or WhatsApp us directly.' });

  return res.status(200).json({ ok: true, reference });
}
