export interface OrderRow {
  tran_id: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  amount: number;
  currency?: string;
  customer_name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  thana?: string;
  district?: string;
  cart?: unknown;
  val_id?: string | null;
  gateway_status?: string | null;
  source?: string;
}

export interface LeadRow {
  name: string;
  whatsapp: string;
  language?: string;
  interest: string;
  budget_range: string;
  timeline: string;
  notes?: string;
  reference: string;
  source?: string;
}

export function dbEnabled(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}

function supabaseUrl(): string {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
}

function supabaseKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
}

async function request(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${supabaseUrl()}${path}`, {
    ...init,
    headers: {
      apikey: supabaseKey(),
      Authorization: `Bearer ${supabaseKey()}`,
      'Content-Type': 'application/json',
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });
}

export async function insertLead(row: LeadRow): Promise<boolean> {
  if (!dbEnabled()) return false;
  try {
    const r = await request('/rest/v1/leads', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ ...row, created_at: new Date().toISOString() }),
    });
    if (!r.ok) console.error('[db/insertLead]', r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) {
    console.error('[db/insertLead] failed', e);
    return false;
  }
}

export async function upsertOrder(row: OrderRow): Promise<boolean> {
  if (!dbEnabled()) return false;
  try {
    const r = await request('/rest/v1/orders?on_conflict=tran_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ ...row, currency: row.currency ?? 'BDT', updated_at: new Date().toISOString() }),
    });
    if (!r.ok) console.error('[db/upsertOrder]', r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) {
    console.error('[db/upsertOrder] failed', e);
    return false;
  }
}

export async function getOrder(tranId: string): Promise<OrderRow | null> {
  if (!dbEnabled() || !tranId) return null;
  try {
    const r = await request(`/rest/v1/orders?tran_id=eq.${encodeURIComponent(tranId)}&select=*&limit=1`, {
      method: 'GET',
    });
    if (!r.ok) {
      console.error('[db/getOrder]', r.status, (await r.text()).slice(0, 200));
      return null;
    }
    const rows = (await r.json()) as OrderRow[];
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch (e) {
    console.error('[db/getOrder] failed', e);
    return null;
  }
}

export async function updateOrderStatus(
  tranId: string,
  status: OrderRow['status'],
  extra: { val_id?: string | null; gateway_status?: string | null } = {},
): Promise<boolean> {
  if (!dbEnabled() || !tranId) return false;
  try {
    // Paid is terminal: fail/cancel/IPN-failed callbacks can never downgrade it.
    const filter =
      status === 'paid'
        ? `tran_id=eq.${encodeURIComponent(tranId)}`
        : `tran_id=eq.${encodeURIComponent(tranId)}&status=neq.paid`;
    const r = await request(`/rest/v1/orders?${filter}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status, ...extra, updated_at: new Date().toISOString() }),
    });
    if (!r.ok) console.error('[db/updateOrderStatus]', r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) {
    console.error('[db/updateOrderStatus] failed', e);
    return false;
  }
}
