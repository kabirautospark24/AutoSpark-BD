import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsOrigin, setCors, handleCorsPreflight } from '../_helpers.js';
import { getOrder } from '../../_db.js';

const TRAN_ID = /^[A-Za-z0-9_-]{4,80}$/;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const origin = corsOrigin(request.headers.origin as string | undefined);
  if (handleCorsPreflight(request, response, origin, 'GET, OPTIONS')) return;
  if (request.method !== 'GET') {
    setCors(response, origin);
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const raw = request.query.tranId;
  const tranId = Array.isArray(raw) ? raw[0] : raw;

  setCors(response, origin);
  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (!tranId || typeof tranId !== 'string' || !TRAN_ID.test(tranId)) {
    return response.status(400).json({ error: 'Invalid transaction ID' });
  }

  try {
    const order = await getOrder(tranId);
    if (!order) {
      return response.status(404).json({ error: 'Transaction not found', tran_id: tranId });
    }
    return response.status(200).json({
      tran_id: order.tran_id,
      status: order.status,
      amount: order.amount,
      gateway_status: order.gateway_status ?? null,
    });
  } catch (e) {
    console.error('[payment/status] lookup failed', e);
    return response.status(500).json({ error: 'Server error' });
  }
}
