import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsOrigin, setCors, handleCorsPreflight, verifyBoundPayment } from './_helpers.js';
import { updateOrderStatus } from '../_db.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const origin = corsOrigin(request.headers.origin as string | undefined);
  if (handleCorsPreflight(request, response, origin, 'GET, POST, OPTIONS')) return;
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
    // Server-to-server verification, tran_id binding and amount cross-check —
    // never trust the callback alone.
    const result = await verifyBoundPayment({ valId: val_id, tranId: tran_id, callbackAmount: amount });
    if (!result.ok) {
      console.error('[payment/success]', result.reason, 'for', String(tran_id).slice(0, 40));
      setCors(response, origin);
      const message =
        result.reason === 'mismatch' ? 'Transaction mismatch' : result.reason === 'amount' ? 'Amount mismatch' : 'Payment verification failed';
      return response.status(402).json({ error: message, tran_id });
    }
    console.log('[payment/success] verified', { tran_id: String(tran_id).slice(0, 40) });
    await updateOrderStatus(tran_id, 'paid', { val_id, gateway_status: String(result.check.raw?.status ?? 'VALID') });
    setCors(response, origin);
    return response.status(200).json({ success: true, message: 'Payment verified', tran_id, timestamp: new Date().toISOString() });
  } catch {
    console.error('[payment/success] server error');
    setCors(response, origin);
    return response.status(500).json({ error: 'Server error' });
  }
}
