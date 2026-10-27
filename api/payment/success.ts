import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsOrigin, setCors, validateWithSSLCommerz } from './_helpers.js';
import { getOrder, updateOrderStatus } from '../_db.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const origin = corsOrigin(request.headers.origin as string | undefined);
  if (request.method === 'OPTIONS') {
    return response.status(200).setHeader('Access-Control-Allow-Origin', origin)
      .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type').end();
  }
  try {
    const { tran_id, val_id, amount } = request.method === 'GET' ? request.query : request.body;
    if (!tran_id || typeof tran_id !== 'string') {
      setCors(response, origin);
      return response.status(400).json({ error: 'Missing transaction ID' });
    }
    if (!val_id || typeof val_id !== 'string') {
      console.error('[payment/success] missing val_id for', String(tran_id).slice(0, 40));
      setCors(response, origin);
      return response.status(400).json({ error: 'Missing validation ID', tran_id });
    }
    // Server-to-server verification — never trust callback alone
    const check = await validateWithSSLCommerz(val_id);
    if (!check.valid) {
      console.error('[payment/success] validation failed for', String(tran_id).slice(0, 40));
      setCors(response, origin);
      return response.status(402).json({ error: 'Payment verification failed', tran_id });
    }
    // Bind the validation to OUR transaction (a valid val_id from another order must not mark this one paid).
    if (!check.tranId || check.tranId !== tran_id) {
      console.error('[payment/success] tran_id bind mismatch', String(tran_id).slice(0, 40), 'vs', String(check.tranId).slice(0, 40));
      setCors(response, origin);
      return response.status(402).json({ error: 'Transaction mismatch', tran_id });
    }
    // Amount must match the stored order (server truth) when the row exists;
    // otherwise fall back to the gateway-validated amount vs the callback amount.
    const order = await getOrder(tran_id);
    const expected = order?.amount ?? (amount !== undefined && Number.isFinite(Number(amount)) ? Number(amount) : check.amount);
    if (Number.isFinite(Number(check.amount)) && Number.isFinite(Number(expected)) && Math.abs(Number(check.amount) - Number(expected)) > 1) {
      console.error('[payment/success] amount mismatch for', String(tran_id).slice(0, 40));
      setCors(response, origin);
      return response.status(402).json({ error: 'Amount mismatch', tran_id });
    }
    console.log('[payment/success] verified', { tran_id: String(tran_id).slice(0, 40) });
    await updateOrderStatus(tran_id, 'paid', { val_id, gateway_status: String(check.raw?.status ?? 'VALID') });
    setCors(response, origin);
    return response.status(200).json({ success: true, message: 'Payment verified', tran_id, timestamp: new Date().toISOString() });
  } catch {
    console.error('[payment/success] server error');
    setCors(response, origin);
    return response.status(500).json({ error: 'Server error' });
  }
}
