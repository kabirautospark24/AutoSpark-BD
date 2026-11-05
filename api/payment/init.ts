import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  corsOrigin,
  setCors,
  handleCorsPreflight,
  validateInitPayload,
  newTranId,
  readBody,
  getSiteUrl,
  gatewayBaseUrl,
} from './_helpers.js';
import { upsertOrder } from '../_db.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const origin = corsOrigin(request.headers.origin as string | undefined);
  if (handleCorsPreflight(request, response, origin, 'POST, OPTIONS')) return;
  if (request.method !== 'POST') {
    setCors(response, origin);
    return response.status(405).json({ error: 'Method not allowed' });
  }

  let step = 'start';
  try {
    step = 'parse-body';
    const body = readBody(request);
    const { cart, customer_name, mobile, email, address, thana, district } = body;
    step = 'validate';
    const check = validateInitPayload(body);
    if (!check.ok) {
      setCors(response, origin);
      return response.status(400).json({ error: check.error });
    }
    const amount = check.amount as number;

    const STORE_ID = process.env.SSLCOMMERZ_STORE_ID || process.env.STORE_ID;
    const STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD || process.env.STORE_PASS;
    const SITE_URL = getSiteUrl(request);
    if (!STORE_ID || !STORE_PASSWORD) {
      console.error('[payment/init] missing gateway credentials');
      setCors(response, origin);
      return response.status(500).json({ error: 'Payment gateway not configured.' });
    }

    // Server-generated unique id (ignore client tran_id to prevent fixation)
    const tran_id = newTranId();
    const product_name = Array.isArray(cart)
      ? cart.map((item: { name?: string }) => String(item.name || 'Item').slice(0, 60)).join(', ').slice(0, 200)
      : 'Order';
    const safeEmail = typeof email === 'string' && email.includes('@') ? email.slice(0, 100) : 'customer@autosparkbd.com';

    await upsertOrder({
      tran_id,
      status: 'pending',
      amount,
      customer_name: String(customer_name),
      mobile: String(mobile),
      email: safeEmail,
      address: String(address),
      thana: String(thana),
      district: String(district),
      cart: Array.isArray(cart) ? cart : [],
      source: 'web',
    }).catch((e) => console.error('[payment/init] upsertOrder failed (non-fatal):', e));

    const params = new URLSearchParams();
    params.append('store_id', STORE_ID);
    params.append('store_passwd', STORE_PASSWORD);
    params.append('total_amount', String(amount));
    params.append('currency', 'BDT');
    params.append('tran_id', tran_id);
    // Gateway callbacks must hit serverless handlers: SSLCommerz POSTs here and
    // a static SPA route cannot read the POST body. The handlers verify the
    // payment, update the order, then 303-redirect the browser to the SPA.
    params.append('success_url', `${SITE_URL}/api/payment/success`);
    params.append('fail_url', `${SITE_URL}/api/payment/fail`);
    params.append('cancel_url', `${SITE_URL}/api/payment/cancel`);
    params.append('ipn_url', `${SITE_URL}/api/payment/ipn`);
    params.append('product_name', product_name);
    params.append('product_category', 'Automotive');
    params.append('product_profile', 'general');
    params.append('cus_name', String(customer_name).slice(0, 100));
    params.append('cus_email', safeEmail);
    params.append('cus_add1', String(address).slice(0, 200));
    params.append('cus_city', String(thana).slice(0, 60));
    params.append('cus_state', String(district).slice(0, 60));
    params.append('cus_postcode', '1200');
    params.append('cus_country', 'Bangladesh');
    params.append('cus_phone', String(mobile));
    params.append('shipping_method', 'Courier');
    params.append('ship_name', String(customer_name).slice(0, 100));
    params.append('ship_add1', String(address).slice(0, 200));
    params.append('ship_city', String(thana).slice(0, 60));
    params.append('ship_state', String(district).slice(0, 60));
    params.append('ship_postcode', '1200');
    params.append('ship_country', 'Bangladesh');

    console.log('[payment/init] init', { tran_id, amount });
    step = 'ssl-fetch';
    const gatewayUrl = `${gatewayBaseUrl()}/gwprocess/v4/api.php`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let sslResponse: Response;
    try {
      sslResponse = await fetch(gatewayUrl, {
        method: 'POST',
        body: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
      });
    } catch (e) {
      console.error('[payment/init] gateway connection failed', e);
      setCors(response, origin);
      return response.status(503).json({ error: 'Failed to connect to payment gateway' });
    } finally {
      clearTimeout(timeout);
    }

    if (!sslResponse.ok) {
      console.error('[payment/init] gateway http', sslResponse.status);
      setCors(response, origin);
      return response.status(400).json({ error: 'Payment gateway error' });
    }
    const rawText = await sslResponse.text();
    let sslczData: { status?: string; GatewayPageURL?: string; failedreason?: string } = {};
    try {
      sslczData = rawText ? JSON.parse(rawText) : {};
    } catch {
      sslczData = {};
    }
    if (sslczData.status !== 'SUCCESS' || !sslczData.GatewayPageURL) {
      console.error('[payment/init] gateway rejected', rawText.slice(0, 500));
      setCors(response, origin);
      return response.status(400).json({
        error: `Payment failed: ${sslczData.failedreason || 'Unknown gateway error'}`,
      });
    }

    setCors(response, origin);
    return response.status(200).json({ GatewayPageURL: sslczData.GatewayPageURL, tran_id, amount });
  } catch (e) {
    console.error('[payment/init] server error at', step, e);
    setCors(response, origin);
    return response.status(500).json({ error: 'Server error' });
  }
}
