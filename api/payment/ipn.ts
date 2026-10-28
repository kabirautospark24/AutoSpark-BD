import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsOrigin, setCors, handleCorsPreflight, verifyBoundPayment } from './_helpers.js';
import { updateOrderStatus } from '../_db.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const origin = corsOrigin(request.headers.origin as string | undefined);
  if (handleCorsPreflight(request, response, origin, 'POST, OPTIONS')) return;
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
    // Server-to-server verification, tran_id binding and amount cross-check.
    const result = await verifyBoundPayment({
      valId: String(val_id),
      tranId: String(tran_id),
      callbackAmount: amount,
      rejectFailedStatus: true,
      gatewayStatus: status,
    });
    const tran = String(tran_id).slice(0, 40);

    if (result.ok) {
      await updateOrderStatus(tran, 'paid', {
        val_id: String(val_id),
        gateway_status: String(result.check.raw?.status ?? status ?? 'VALID'),
      });
    } else if (result.reason !== 'amount') {
      await updateOrderStatus(tran, 'failed', { val_id: String(val_id), gateway_status: String(status ?? 'FAILED') });
    }

    console.log('[payment/ipn]', { tran, verified: result.ok, reason: result.ok ? undefined : result.reason });
    setCors(response, origin);
    return response.status(200).json({ received: true, verified: result.ok, tran_id });
  } catch {
    setCors(response, origin);
    return response.status(500).json({ error: 'Server error' });
  }
}
