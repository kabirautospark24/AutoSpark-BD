/** Shared payment helpers: CORS (re-exported from ../_cors), validation, sanitized logging. */
export { ALLOWED_ORIGINS, corsOrigin, setCors } from '../_cors.js';

const BD_PHONE = /^01[3-9]\d{8}$/;

export interface CartItem {
  price?: number;
  qty?: number;
  quantity?: number;
  name?: string;
}

export interface InitPayload {
  cart?: CartItem[];
  /** JSON-string cart (CheckoutPage path via the Appwrite proxy). */
  cart_items?: string;
  total_amount?: number | string;
  customer_name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  thana?: string;
  district?: string;
}

function parseCartItems(body: InitPayload): CartItem[] | null {
  const { cart, cart_items } = body ?? {};
  if (Array.isArray(cart)) return cart;
  if (typeof cart_items === 'string' && cart_items.length <= 100_000) {
    try {
      const parsed = JSON.parse(cart_items);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* not JSON — treated as missing */
    }
  }
  return null;
}

export function validateInitPayload(body: InitPayload): { ok: boolean; error?: string; amount?: number } {
  const { total_amount, customer_name, mobile, address, thana, district } = body ?? {};
  if (!customer_name || String(customer_name).trim().length < 3) return { ok: false, error: 'Invalid customer name' };
  if (!mobile || !BD_PHONE.test(String(mobile).trim())) return { ok: false, error: 'Invalid BD mobile (01XXXXXXXXX)' };
  if (!address || String(address).trim().length < 5) return { ok: false, error: 'Invalid address' };
  if (!thana || !district) return { ok: false, error: 'Thana/district required' };
  // Items are required (cart array or cart_items JSON string — all real callers send one).
  // The server-derived sum is authoritative; the client's total_amount is a cross-check only.
  const items = parseCartItems(body);
  if (!items || items.length === 0 || items.length > 100) return { ok: false, error: 'Invalid cart' };
  for (const it of items) {
    const price = Number(it?.price);
    const qty = Number(it?.qty ?? it?.quantity ?? 1);
    if (!Number.isFinite(price) || price < 0 || price > 5000000) return { ok: false, error: 'Invalid cart price' };
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return { ok: false, error: 'Invalid cart quantity' };
  }
  const sum = items.reduce((s, it) => s + Number(it.price) * Number(it.qty ?? it.quantity ?? 1), 0);
  if (!Number.isFinite(sum) || sum < 10 || sum > 5000000) return { ok: false, error: 'Invalid amount (10–5000000 BDT)' };
  const claimed = Number(total_amount);
  if (Number.isFinite(claimed) && Math.abs(sum - claimed) > Math.max(1, sum * 0.02)) {
    return { ok: false, error: 'Amount mismatch with cart total' };
  }
  if (String(customer_name).length > 100 || String(address).length > 500) return { ok: false, error: 'Field too long' };
  return { ok: true, amount: Math.round(sum) };
}

export function newTranId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `autospark-${Date.now()}-${rand}`;
}

export interface SSLValidation {
  valid: boolean;
  amount?: number;
  tranId?: string;
  raw?: { status?: unknown; tran_id?: unknown; amount?: unknown; currency?: unknown };
}

/** Verify transaction with SSLCommerz validation API (server-to-server). */
export async function validateWithSSLCommerz(valId: string): Promise<SSLValidation> {
  const STORE_ID = process.env.SSLCOMMERZ_STORE_ID || process.env.STORE_ID;
  const STORE_PASS = process.env.SSLCOMMERZ_STORE_PASSWORD || process.env.STORE_PASS;
  const IS_LIVE = (process.env.SSLCZ_IS_LIVE || 'true') !== 'false';
  if (!STORE_ID || !STORE_PASS || !valId) return { valid: false };
  const base = IS_LIVE ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com';
  try {
    const url = `${base}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(STORE_ID)}&store_passwd=${encodeURIComponent(STORE_PASS)}&v=1&format=json`;
    const r = await fetch(url);
    if (!r.ok) return { valid: false };
    const data = await r.json();
    const status = String(data?.status ?? '').toUpperCase();
    if (status === 'VALID' || status === 'VALIDATED') {
      return { valid: true, amount: Number(data.amount), tranId: String(data.tran_id ?? ''), raw: { status: data.status, tran_id: data.tran_id, amount: data.amount, currency: data.currency } };
    }
    return { valid: false, raw: { status: data.status } };
  } catch {
    return { valid: false };
  }
}
