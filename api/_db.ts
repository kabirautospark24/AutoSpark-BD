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

function dbUrl(): string {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';
}
function supabaseUrl(): string {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
}
function supabaseKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
}

export function dbEnabled(): boolean {
  return Boolean(dbUrl());
}
function supaEnabled(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}

/** Minimal structural type of the Neon HTTP client we use (tagged-template SQL over HTTP). */
type NeonClient = { query: (text: string, params?: unknown[]) => Promise<unknown[]> };

async function neonSql(): Promise<NeonClient | null> {
  try {
    const mod = await import('@neondatabase/serverless');
    return mod.neon(dbUrl()) as unknown as NeonClient;
  } catch (e) {
    console.error('[db] neon load failed:', e);
    return null;
  }
}

async function neonQuery(text: string, params: unknown[] = []): Promise<unknown[]> {
  const sql = await neonSql();
  if (!sql) return [];
  try {
    return await sql.query(text, params);
  } catch (e) {
    console.error('[db/neon]', e);
    return [];
  }
}

async function supaRequest(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${supabaseUrl()}${path}`, {
    ...init,
    headers: { apikey: supabaseKey(), Authorization: `Bearer ${supabaseKey()}`, 'Content-Type': 'application/json', ...((init.headers as Record<string, string>) ?? {}) },
  });
}

export async function insertLead(row: LeadRow): Promise<boolean> {
  if (dbEnabled()) {
    try {
      await neonQuery(
        `INSERT INTO leads (name, whatsapp, language, interest, budget_range, timeline, notes, reference, source, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
        [row.name, row.whatsapp, row.language || 'en', row.interest, row.budget_range, row.timeline, row.notes || '', row.reference, row.source || 'sparkai'],
      );
      return true;
    } catch (e) {
      console.error('[db/insertLead/neon]', e);
    }
  }
  if (supaEnabled()) {
    try {
      const r = await supaRequest('/rest/v1/leads', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ ...row, created_at: new Date().toISOString() }) });
      return r.ok;
    } catch (e) {
      console.error('[db/insertLead]', e);
    }
  }
  return false;
}

export async function upsertOrder(row: OrderRow): Promise<boolean> {
  if (dbEnabled()) {
    try {
      await neonQuery(
        `INSERT INTO orders (tran_id, status, amount, currency, customer_name, mobile, email, address, thana, district, cart, source, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW()) ON CONFLICT (tran_id) DO UPDATE SET status=EXCLUDED.status, amount=EXCLUDED.amount, updated_at=NOW()`,
        [row.tran_id, row.status, row.amount, row.currency || 'BDT', row.customer_name, row.mobile, row.email, row.address, row.thana, row.district, JSON.stringify(row.cart ?? []), row.source || 'web'],
      );
      return true;
    } catch (e) {
      console.error('[db/upsertOrder/neon]', e);
    }
  }
  if (supaEnabled()) {
    try {
      const r = await supaRequest('/rest/v1/orders?on_conflict=tran_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ ...row, currency: row.currency ?? 'BDT', updated_at: new Date().toISOString() }) });
      return r.ok;
    } catch (e) {
      console.error('[db/upsertOrder]', e);
    }
  }
  return false;
}

export async function getOrder(tranId: string): Promise<OrderRow | null> {
  if (dbEnabled()) {
    try {
      const rows = await neonQuery(`SELECT * FROM orders WHERE tran_id = $1 LIMIT 1`, [tranId]);
      return (rows[0] as OrderRow | undefined) ?? null;
    } catch (e) {
      console.error('[db/getOrder/neon]', e);
    }
  }
  if (supaEnabled()) {
    try {
      const r = await supaRequest(`/rest/v1/orders?tran_id=eq.${encodeURIComponent(tranId)}&select=*&limit=1`, { method: 'GET' });
      if (!r.ok) return null;
      const rows = (await r.json()) as OrderRow[];
      return Array.isArray(rows) && rows[0] ? rows[0] : null;
    } catch (e) {
      console.error('[db/getOrder]', e);
    }
  }
  return null;
}

export async function updateOrderStatus(
  tranId: string,
  status: OrderRow['status'],
  extra: { val_id?: string | null; gateway_status?: string | null } = {},
): Promise<boolean> {
  if (dbEnabled()) {
    try {
      const sql =
        status === 'paid'
          ? `UPDATE orders SET status=$1, val_id=COALESCE($2,val_id), gateway_status=COALESCE($3,gateway_status), updated_at=NOW() WHERE tran_id=$4`
          : `UPDATE orders SET status=$1, val_id=COALESCE($2,val_id), gateway_status=COALESCE($3,gateway_status), updated_at=NOW() WHERE tran_id=$4 AND status <> 'paid'`;
      await neonQuery(sql, [status, extra.val_id ?? null, extra.gateway_status ?? null, tranId]);
      return true;
    } catch (e) {
      console.error('[db/updateOrderStatus/neon]', e);
    }
  }
  if (supaEnabled()) {
    try {
      const filter = status === 'paid' ? `tran_id=eq.${encodeURIComponent(tranId)}` : `tran_id=eq.${encodeURIComponent(tranId)}&status=neq.paid`;
      const r = await supaRequest(`/rest/v1/orders?${filter}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status, ...extra, updated_at: new Date().toISOString() }) });
      return r.ok;
    } catch (e) {
      console.error('[db/updateOrderStatus]', e);
    }
  }
  return false;
}
