import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  corsOrigin,
  setCors,
  handleCorsPreflight,
  requestParams,
  stringParam,
  wantsJson,
  redirectTo,
  getSiteUrl,
} from './_helpers.js';
import { updateOrderStatus } from '../_db.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const origin = corsOrigin(request.headers.origin as string | undefined);
  if (handleCorsPreflight(request, response, origin, 'GET, POST, OPTIONS')) return;

  const siteUrl = getSiteUrl(request);
  const params = requestParams(request);
  const tranId = stringParam(params, 'tran_id');
  const reason =
    stringParam(params, 'failedreason') || stringParam(params, 'error') || stringParam(params, 'reason') || 'payment_failed';

  console.log('Payment Failed:', tranId.slice(0, 40));

  try {
    if (tranId) {
      await updateOrderStatus(tranId, 'failed');
    }
  } catch (e) {
    console.error('Payment fail status update error', e);
  }

  if (wantsJson(request)) {
    setCors(response, origin);
    return response.status(200).json({
      success: false,
      message: 'Payment failed',
      tran_id: tranId || null,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  const query = new URLSearchParams();
  if (tranId) query.set('tran_id', tranId);
  query.set('reason', reason.slice(0, 120));
  redirectTo(response, `${siteUrl}/payment-fail?${query.toString()}`);
}
