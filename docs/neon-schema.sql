-- Neon schema for AutoSpark payment + leads
-- Run once in the Neon SQL editor.

CREATE TABLE IF NOT EXISTS orders (
  tran_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BDT',
  customer_name TEXT,
  mobile TEXT,
  email TEXT,
  address TEXT,
  thana TEXT,
  district TEXT,
  cart JSONB,
  val_id TEXT,
  gateway_status TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  language TEXT,
  interest TEXT NOT NULL,
  budget_range TEXT NOT NULL,
  timeline TEXT NOT NULL,
  notes TEXT,
  reference TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS leads_reference_idx ON leads (reference);