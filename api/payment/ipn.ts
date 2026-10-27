import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsOrigin, setCors, validateWithSSLCommerz } from './_helpers.js';
import { getOrder, updateOrderStatus } from '../_db.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const origin = corsOrigin(request.headers.origin as string | undefined);
  if (request.method === 'OPTIONS') {
    return response.status(200).setHeader('Access-Control-Allow-Origin', origin)
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type').end();
  }
  if (request.method !== 'POST') {
    setCors(response, origin);
    return response.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { tran_id, val_id, status, amount } = request.body ?? {};
    if (!tran_id || !val_id) {
      setCors(response, origin);
      return response.status(400).json({ error: 'Missing tran_id/val_id' });
    }
    const check = await validateWithSSLCommerz(String(val_id));
    // Bind validation to this transaction AND require a non-FAILED gateway status.
    const bound = check.valid && !!check.tranId && check.tranId === String(tran_id);
    const verified = bound && String(status ?? '').toUpperCase() !== 'FAILED';
    // Amount cross-check: stored order row when available, else the callback amount.
    // A verified gateway amount alone (no order row, no callback amount) is accepted —
    // the server-to-server validation is authoritative for what was actually charged.
    let amountOk = true;
    if (verified && Number.isFinite(Number(check.amount))) {
      const order = await getOrder(String(tran_id));
      const expected =
        order?.amount ?? (Number.isFinite(Number(amount)) ? Number(amount) : Number(check.amount));
      amountOk = Math.abs(Number(check.amount) - Number(expected)) <= 1;
    }
    const tran = String(tran_id).slice(0, 40);

    if (verified && amountOk) {
      await updateOrderStatus(tran, 'paid', {
        val_id: String(val_id),
        gateway_status: String(check.raw?.status ?? status ?? 'VALID'),
      });
    } else if (!verified) {
      await updateOrderStatus(tran, 'failed', { val_id: String(val_id), gateway_status: String(status ?? 'FAILED') });
    }

    console.log('[payment/ipn]', { tran, verified, amountOk });
    setCors(response, origin);
    return response.status(200).json({ received: true, verified: verified && amountOk, tran_id });
  } catch {
    setCors(response, origin);
    return response.status(500).json({ error: 'Server error' });
  }
}
