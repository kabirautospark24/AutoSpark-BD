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

import { neon } from '@neondatabase/serverless';

function dbUrl(): string {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';
}

export function dbEnabled(): boolean {
  return Boolean(dbUrl());
}

// ---------- Neon (preferred) ----------
async function neonQuery<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const sql = neon(dbUrl());
  const rows = await sql.query(text, params);
  return rows as T[];
}

// ---------- Supabase fallback (legacy) ----------
function supabaseUrl(): string {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
}
function supabaseKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
}
function supaEnabled(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
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
        `INSERT INTO leads (name, whatsapp, language, interest, budget_range, timeline, notes, reference, source, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
        [row.name, row.whatsapp, row.language || 'en', row.interest, row.budget_range, row.timeline, row.notes || '', row.reference, row.source || 'sparkai'],
      );
      return true;
    } catch (e) {
      console.error('[db/insertLead/neon]', e);
      return false;
    }
  }
  if (supaEnabled()) {
    try {
      const r = await supaRequest('/rest/v1/leads', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ ...row, created_at: new Date().toISOString() }) });
      if (!r.ok) console.error('[db/insertLead]', r.status, (await r.text()).slice(0, 200));
      return r.ok;
    } catch (e) {
      console.error('[db/insertLead] failed', e);
      return false;
    }
  }
  return false;
}

export async function upsertOrder(row: OrderRow): Promise<boolean> {
  if (dbEnabled()) {
    try {
      await neonQuery(
        `INSERT INTO orders (tran_id, status, amount, currency, customer_name, mobile, email, address, thana, district, cart, source, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
         ON CONFLICT (tran_id) DO UPDATE SET status=EXCLUDED.status, amount=EXCLUDED.amount, updated_at=NOW()`,
        [row.tran_id, row.status, row.amount, row.currency || 'BDT', row.customer_name, row.mobile, row.email, row.address, row.thana, row.district, JSON.stringify(row.cart ?? []), row.source || 'web'],
      );
      return true;
    } catch (e) {
      console.error('[db/upsertOrder/neon]', e);
      return false;
    }
  }
  if (supaEnabled()) {
    try {
      const r = await supaRequest('/rest/v1/orders?on_conflict=tran_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ ...row, currency: row.currency ?? 'BDT', updated_at: new Date().toISOString() }) });
      if (!r.ok) console.error('[db/upsertOrder]', r.status, (await r.text()).slice(0, 200));
      return r.ok;
    } catch (e) {
      console.error('[db/upsertOrder] failed', e);
      return false;
    }
  }
  return false;
}

export async function getOrder(tranId: string): Promise<OrderRow | null> {
  if (dbEnabled()) {
    try {
      const rows = await neonQuery<OrderRow>(`SELECT * FROM orders WHERE tran_id = $1 LIMIT 1`, [tranId]);
      return rows[0] || null;
    } catch (e) {
      console.error('[db/getOrder/neon]', e);
      return null;
    }
  }
  if (supaEnabled()) {
    try {
      const r = await supaRequest(`/rest/v1/orders?tran_id=eq.${encodeURIComponent(tranId)}&select=*&limit=1`, { method: 'GET' });
      if (!r.ok) return null;
      const rows = (await r.json()) as OrderRow[];
      return Array.isArray(rows) && rows[0] ? rows[0] : null;
    } catch (e) {
      console.error('[db/getOrder] failed', e);
      return null;
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
      return false;
    }
  }
  if (supaEnabled()) {
    try {
      const filter = status === 'paid' ? `tran_id=eq.${encodeURIComponent(tranId)}` : `tran_id=eq.${encodeURIComponent(tranId)}&status=neq.paid`;
      const r = await supaRequest(`/rest/v1/orders?${filter}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status, ...extra, updated_at: new Date().toISOString() }) });
      if (!r.ok) console.error('[db/updateOrderStatus]', r.status, (await r.text()).slice(0, 200));
      return r.ok;
    } catch (e) {
      console.error('[db/updateOrderStatus] failed', e);
      return false;
    }
  }
  return false;
}
