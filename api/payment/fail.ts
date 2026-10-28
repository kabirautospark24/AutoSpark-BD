import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsOrigin, handleCorsPreflight } from './_helpers.js';
import { updateOrderStatus } from '../_db.js';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const origin = corsOrigin(request.headers.origin as string | undefined);
  if (handleCorsPreflight(request, response, origin, 'GET, POST, OPTIONS')) return;

  try {
    const { tran_id } = request.method === 'GET' ? request.query : request.body;

    console.log('Payment Failed:', String(tran_id ?? '').slice(0, 40));

    if (typeof tran_id === 'string' && tran_id) {
      await updateOrderStatus(tran_id, 'failed');
    }

    // Return JSON response
    return response
      .status(200)
      .setHeader('Access-Control-Allow-Origin', origin)
      .json({
        success: false,
        message: 'Payment failed',
        tran_id: typeof tran_id === 'string' ? tran_id.slice(0, 80) : tran_id,
        timestamp: new Date().toISOString(),
      });
  } catch {
    console.error('Payment fail handler error');
    return response
      .status(500)
      .setHeader('Access-Control-Allow-Origin', origin)
      .json({
        error: 'Server error',
      });
  }
}
