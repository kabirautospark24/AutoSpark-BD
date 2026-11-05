import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  corsOrigin,
  setCors,
  handleCorsPreflight,
  verifyBoundPayment,
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
  const valId = stringParam(params, 'val_id');
  const amount = params.amount;
  const json = wantsJson(request);

  const failRedirect = (reason: string) => {
    const query = new URLSearchParams();
    if (tranId) query.set('tran_id', tranId);
    query.set('reason', reason);
    redirectTo(response, `${siteUrl}/payment-fail?${query.toString()}`);
  };

  if (!tranId) {
    if (json) {
      setCors(response, origin);
      return response.status(400).json({ error: 'Missing transaction ID' });
    }
    redirectTo(response, `${siteUrl}/payment-fail?reason=missing_tran_id`);
    return;
  }

  if (!valId) {
    console.error('[payment/success] missing val_id for', tranId.slice(0, 40));
    if (json) {
      setCors(response, origin);
      return response.status(400).json({ error: 'Missing validation ID', tran_id: tranId });
    }
    failRedirect('missing_validation_id');
    return;
  }

  try {
    // Server-to-server verification, tran_id binding and amount cross-check —
    // never trust the callback alone.
    const result = await verifyBoundPayment({ valId, tranId, callbackAmount: amount });

    if (!result.ok) {
      const reason = result.reason;
      console.error('[payment/success]', reason, 'for', tranId.slice(0, 40));
      if (json) {
        setCors(response, origin);
        const message =
          reason === 'mismatch'
            ? 'Transaction mismatch'
            : reason === 'amount'
              ? 'Amount mismatch'
              : 'Payment verification failed';
        return response.status(402).json({ error: message, tran_id: tranId });
      }
      failRedirect(
        reason === 'amount'
          ? 'amount_mismatch'
          : reason === 'mismatch'
            ? 'transaction_mismatch'
            : 'verification_failed',
      );
      return;
    }

    console.log('[payment/success] verified', { tran_id: tranId.slice(0, 40) });
    await updateOrderStatus(tranId, 'paid', {
      val_id: valId,
      gateway_status: String(result.check.raw?.status ?? 'VALID'),
    });

    if (json) {
      setCors(response, origin);
      return response.status(200).json({
        success: true,
        message: 'Payment verified',
        tran_id: tranId,
        status: 'paid',
        timestamp: new Date().toISOString(),
      });
    }

    const query = new URLSearchParams({ tran_id: tranId, verified: '1' });
    redirectTo(response, `${siteUrl}/payment-success?${query.toString()}`);
  } catch (e) {
    console.error('[payment/success] server error', e);
    if (json) {
      setCors(response, origin);
      return response.status(500).json({ error: 'Server error' });
    }
    failRedirect('server_error');
  }
}
