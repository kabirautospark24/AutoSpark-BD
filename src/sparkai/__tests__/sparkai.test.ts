import { describe, it, expect } from 'vitest';
import { normalizeWhatsApp, buildWhatsAppUrl } from '../../sparkai/config';
import { filterDemoVehicles, formatBDT } from '../../sparkai/data/demo';
import { CATALOG_VEHICLES, CATALOG_MAKES, pickVehicles, filterCatalog } from '../../sparkai/data/catalog';
import { CAR_MODELS } from '../../sparkai/kb/sales';
import { estimateFinance, mockRespond } from '../../sparkai/services/ai';
import { LeadSchema } from '../../sparkai/services/lead';

describe('SparkPilot skeleton', () => {
  it('renders logo variants without crashing', async () => {
    const { SparkPilotLogo, SparkMark } = await import('../../sparkai/components/Logo');
    expect(typeof SparkPilotLogo).toBe('function');
    expect(typeof SparkMark).toBe('function');
  });

  it('filters demo vehicles by budget + hybrid', () => {
    const r = filterDemoVehicles({ maxBudgetLakh: 25, hybrid: true });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((v) => v.budgetLakh <= 25 && v.hybrid)).toBe(true);
  });

  it('catalog IDs are unique (hybrid/non-hybrid no longer collide)', () => {
    const ids = CATALOG_VEHICLES.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Axio ready hybrid min price is 26 lakh (CSV order)', () => {
    const axio = CATALOG_VEHICLES.find((v) => v.id.includes('axio') && v.id.includes('hybrid') && !v.id.includes('non-hybrid') && v.stock === 'ready')!;
    expect(axio.budgetLakh).toBe(26);
    expect(axio.priceLabel).toBe('৳26–26.5 lakh');
  });

  it('calculates finance with real math + null rate state', () => {
    const e = estimateFinance(25, 30, 12, 48);
    expect(e.downPaymentBDT).toBe(750000);
    expect(e.monthlyBDT).toBeGreaterThan(30000);
    const noRate = estimateFinance(25, 30, null, 48);
    expect(noRate.monthlyBDT).toBeNull();
    expect(formatBDT(100000)).toContain('00,000');
  });

  it('validates + normalizes WhatsApp numbers', () => {
    expect(normalizeWhatsApp('01712345678')).toBe('8801712345678');
    expect(normalizeWhatsApp('+8801712345678')).toBe('8801712345678');
    expect(normalizeWhatsApp('abc')).toBeNull();
    expect(buildWhatsAppUrl('hi there')).toContain('text=hi%20there');
    const bad = LeadSchema.safeParse({ name: 'A', whatsapp: 'xyz', language: 'English', interest: 'Axio', budgetRange: 'x', timeline: 'y', consent: false });
    expect(bad.success).toBe(false);
    const good = LeadSchema.safeParse({ name: 'Rahim', whatsapp: '01712345678', language: 'English', interest: 'Axio Hybrid', budgetRange: '৳18–25 lakh', timeline: 'Within 1 month', consent: true });
    expect(good.success).toBe(true);
  });

  it('demo assistant remembers budget (no re-ask)', async () => {
    const r1 = await mockRespond([], 'Around 25 lakh. Hybrid preferred.', {});
    expect(r1.prefs?.budgetLakh).toBe(25);
    expect(r1.prefs?.hybrid).toBe(true);
    const r2 = await mockRespond([], 'Show me family options', r1.prefs ?? {});
    expect(r2.text).not.toMatch(/budget.*\?.*budget/i);
  }, 10000);
});

describe('Vehicle catalog derived from the sales KB', () => {
  it('covers every KB offer across all 23 models', () => {
    expect(CAR_MODELS.length).toBe(23);
    expect(CATALOG_VEHICLES.length).toBe(102); // one card per priced/on-request KB offer
    const models = new Set(CATALOG_VEHICLES.map((v) => v.model));
    expect(models.size).toBe(23);
    for (const m of CAR_MODELS) expect(models.has(m.name)).toBe(true);
    expect(CATALOG_MAKES).toEqual(expect.arrayContaining(['Toyota', 'Honda', 'Nissan', 'Mazda', 'Lexus']));
  });

  it('carries sheet-accurate labels (price range, stock, grade)', () => {
    const axio = CATALOG_VEHICLES.find((v) => v.id === 'cat-toyota-axio-hybrid-ready')!;
    expect(axio.priceLabel).toBe('৳26–26.5 lakh');
    expect(axio.stock).toBe('ready');
    expect(axio.grade).toBe('4/4.5');
    const lexus = CATALOG_VEHICLES.find((v) => v.model === 'Lexus NX')!;
    expect(lexus.priceKnown).toBe(false);
    expect(lexus.priceLabel).toBe('On request');
    // Budget filters must never surface unlisted-price cars as if they had one.
    expect(filterCatalog({ maxBudgetLakh: 100 }).every((v) => v.priceKnown !== false)).toBe(true);
  });

  it('pickVehicles spreads picks across DIFFERENT models (no same-family repeats)', () => {
    const picks = pickVehicles({}, 8);
    expect(picks.length).toBe(8);
    expect(new Set(picks.map((v) => v.model)).size).toBe(8);
  });

  it('pickVehicles respects budget, hybrid and model filters', () => {
    const hybrid25 = pickVehicles({ maxBudgetLakh: 25, hybrid: true }, 6);
    expect(hybrid25.length).toBeGreaterThan(0);
    expect(hybrid25.every((v) => v.hybrid && v.budgetLakh <= 25)).toBe(true);
    const noah = pickVehicles({ model: 'Toyota Noah' }, 3);
    expect(noah.length).toBe(3);
    expect(noah.every((v) => v.model === 'Toyota Noah')).toBe(true);
    expect(pickVehicles({ maxBudgetLakh: 5 }, 6)).toEqual([]);
  });

  it('every model family (MPV/SUV/Sedan…) is reachable via body filters', () => {
    expect(pickVehicles({ bodyType: 'MPV' }, 6).length).toBeGreaterThanOrEqual(3);
    expect(pickVehicles({ bodyType: 'SUV' }, 8).length).toBeGreaterThanOrEqual(6);
    expect(pickVehicles({ bodyType: 'Sedan' }, 8).length).toBeGreaterThanOrEqual(4);
    expect(pickVehicles({ bodyType: 'Hatchback' }, 6).length).toBeGreaterThanOrEqual(3);
  });
});
