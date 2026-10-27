import type { DemoVehicle } from '../types';
import { CAR_MODELS, type KbCarModel, type KbOffer } from '../kb/sales';

// ============================================================================
// SPARKPILOT VEHICLE CATALOG (chat cards + discovery panel)
// Derived 1:1 from the sales KB (kb/sales.ts → official price sheet CSV).
// The KB is the single source of truth: when a price/offer changes there,
// these cards change with it. NEVER hardcode a separate car list.
// ----------------------------------------------------------------------------
// One card per KB offer (Ready Stock / Pre-order × trim variant) = 102 cards
// across all 23 models. Offers with no published price (Lexus NX, Sienta)
// are included with priceKnown=false so model-specific asks still surface
// them; budget filters exclude them until an expert quotes a figure.
// ============================================================================

/** Per-model card details not present on the sheet (transmission + selling points). */
const MODEL_META: Record<string, { transmission: string; features: string[] }> = {
  'Toyota Axio': { transmission: 'CVT', features: ['Toyota Safety Sense', 'Push start', 'Reverse camera'] },
  'Toyota Fielder': { transmission: 'CVT', features: ['Huge luggage space', 'Roof rails', 'Simple maintenance'] },
  'Toyota Premio': { transmission: 'CVT', features: ['Premium sedan comfort', 'Spacious rear seat', 'Dual auto AC'] },
  'Toyota Allion': { transmission: 'CVT', features: ['Quiet cabin', 'Comfort-tuned suspension', 'Rear armrest'] },
  'Toyota Aqua': { transmission: 'CVT', features: ['Excellent city mileage', 'Compact parking', 'Push start'] },
  'Toyota C-HR': { transmission: 'CVT', features: ['Coupe-style crossover', 'LED lighting', 'Sport suspension'] },
  'Nissan X-Trail': { transmission: 'CVT · 4WD', features: ['4WD confidence', 'Spacious boot', 'Around-view monitor'] },
  'Mazda Axela': { transmission: '6AT', features: ['SKYACTIV dynamics', 'Kodo design', 'Bose audio option'] },
  'Honda CR-V': { transmission: 'CVT', features: ['Roomy SUV cabin', 'Power tailgate', 'Honda Sensing'] },
  'Toyota Corolla Cross': { transmission: 'e-CVT', features: ['Hybrid efficiency', 'High ride height', 'Toyota Safety Sense'] },
  'Toyota Harrier': { transmission: 'CVT', features: ['Premium SUV feel', 'Panoramic view', 'Power tailgate'] },
  'Toyota Sienta': { transmission: 'CVT', features: ['Sliding doors', '7-seat flexibility', 'Compact MPV footprint'] },
  'Toyota Noah': { transmission: 'CVT', features: ['7 seats, sliding doors', 'Family comfort', 'Dual auto AC'] },
  'Toyota Esquire': { transmission: 'CVT', features: ['7 seats, bold styling', 'Sliding doors', 'Family-friendly cabin'] },
  'Honda Grace': { transmission: 'DCT', features: ['Refined sedan', 'Cruise control', 'LED headlights'] },
  'Honda Civic': { transmission: 'CVT', features: ['Sport sedan feel', 'Honda Sensing', 'LED headlights'] },
  'Toyota Yaris Cross': { transmission: 'CVT', features: ['Compact crossover', 'City-friendly size', 'Hybrid fuel savings'] },
  'Honda Vezel': { transmission: 'DCT', features: ['SUV stance', 'Honda Sensing', 'Half-leather seats'] },
  'Toyota Prius': { transmission: 'CVT', features: ['Legendary efficiency', 'Heads-up display', 'Lane assist'] },
  'Honda Insight': { transmission: 'CVT', features: ['Hybrid sedan economy', 'Honda Sensing', 'Quiet cabin'] },
  'Lexus NX': { transmission: 'e-CVT · AWD', features: ['Luxury SUV', 'Mark Levinson audio option', 'Power tailgate'] },
  'Toyota Land Cruiser Prado': { transmission: '6AT · 4WD', features: ['Legendary 4WD', '7-seat luxury', 'Off-road capability'] },
  'Toyota Crown': { transmission: 'e-CVT', features: ['Flagship sedan', 'Twin-turbo option', 'Executive comfort'] },
};

// Parenthetical suffixes MUST stay in the slug ("X (Hybrid)" vs "X (Non-Hybrid)"
// previously both collapsed to "x" → 12 duplicate React keys).
const slug = (s: string) =>
  s.toLowerCase().replace(/[()]/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Offer powertrain → hybrid flag (named trims inherit the model's fuel type). */
function offerHybrid(m: KbCarModel, o: KbOffer): boolean {
  const t = o.type.toLowerCase();
  if (t.includes('non-hybrid')) return false;
  if (t.includes('hybrid')) return true;
  if (m.fuel === 'Hybrid') return true;
  if (m.fuel === 'Non-Hybrid') return false;
  return false;
}

/** '27.5/28' → 27.5 · '38' → 38 · '' → 9999 (unlisted, budget filters skip it). */
function minPriceLakh(priceLakh: string): number {
  const first = priceLakh.split('/')[0]?.trim() ?? '';
  const v = parseFloat(first.replace(/,/g, ''));
  return Number.isFinite(v) && v > 0 ? v : 9999;
}

/** Human-readable sheet price: '৳26–26.5 lakh' / '৳36.5 lakh' / 'On request'. */
function priceLabel(priceLakh: string): string {
  const t = priceLakh.trim();
  if (!t) return 'On request';
  const parts = t
    .split('/')
    .map((p) => parseFloat(p.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (parts.length >= 2) {
    const [a, b] = parts.sort((x, y) => x - y); // sheet entries may be high/low
    return a === b ? `৳${a} lakh` : `৳${a}–${b} lakh`;
  }
  return parts.length === 1 ? `৳${parts[0]} lakh` : 'On request';
}

function toCard(m: KbCarModel, o: KbOffer): DemoVehicle {
  const meta = MODEL_META[m.name] ?? { transmission: 'CVT', features: [] };
  const hybrid = offerHybrid(m, o);
  const yearMatch = o.years.match(/(\d{4})\s*[–-]\s*(\d{4})/);
  const year = yearMatch ? Number(yearMatch[2]) : 2022;
  const stock = o.availability === 'Ready Stock' ? 'ready' : 'preorder';
  const priceKnown = o.priceLakh.trim() !== '';
  return {
    id: `cat-${slug(m.name)}-${slug(o.type)}-${stock}`,
    make: m.make,
    model: m.name,
    year,
    variant: o.type,
    fuel: hybrid ? 'Hybrid · Petrol' : 'Petrol',
    hybrid,
    transmission: meta.transmission,
    bodyType: m.body,
    budgetLakh: minPriceLakh(o.priceLakh),
    stock,
    features: [...(hybrid ? ['Hybrid powertrain'] : []), ...meta.features].slice(0, 3),
    demo: true,
    priceLabel: priceLabel(o.priceLakh),
    grade: o.grade,
    mileage: o.mileage,
    modelYears: o.years,
    priceKnown,
  };
}

/** Full chat-card inventory: one card per KB offer, all 23 models covered.
 *  IDs are guaranteed unique even if the KB ever repeats a type+stock combo. */
export const CATALOG_VEHICLES: DemoVehicle[] = (() => {
  const seen = new Map<string, number>();
  return CAR_MODELS.flatMap((m) =>
    m.offers.map((o) => {
      const card = toCard(m, o);
      const n = seen.get(card.id) ?? 0;
      seen.set(card.id, n + 1);
      return n === 0 ? card : { ...card, id: `${card.id}-${n + 1}` };
    }),
  );
})();

/** Distinct makes across the catalog (for filter dropdowns). */
export const CATALOG_MAKES: string[] = [...new Set(CATALOG_VEHICLES.map((v) => v.make))];

export interface VehicleFilter {
  maxBudgetLakh?: number;
  hybrid?: boolean;
  bodyType?: string;
  make?: string;
  model?: string;
  stock?: 'ready' | 'preorder';
}

export function filterCatalog(f: VehicleFilter): DemoVehicle[] {
  return CATALOG_VEHICLES.filter((v) => {
    if (f.maxBudgetLakh != null && v.budgetLakh > f.maxBudgetLakh) return false;
    if (f.hybrid === true && !v.hybrid) return false;
    if (f.hybrid === false && v.hybrid) return false;
    if (f.bodyType && !v.bodyType.toLowerCase().includes(f.bodyType.toLowerCase())) return false;
    if (f.make && v.make.toLowerCase() !== f.make.toLowerCase()) return false;
    if (f.model && v.model.toLowerCase() !== f.model.toLowerCase()) return false;
    if (f.stock && v.stock !== f.stock) return false;
    return true;
  });
}

/**
 * Diversity-aware picker for chat cards: at most ONE offer per model first
 * (so replies never repeat the same car family), then backfills the best
 * remaining offers up to `n`. Ready stock and priced offers win ties.
 */
export function pickVehicles(f: VehicleFilter, n = 6): DemoVehicle[] {
  const matched = filterCatalog(f);
  if (!matched.length || n <= 0) return [];
  const score = (v: DemoVehicle) => {
    let s = 0;
    if (v.stock === 'ready') s += 20;
    if (v.priceKnown) s += 10;
    if (f.hybrid === true && v.hybrid) s += 5;
    if (f.hybrid === false && !v.hybrid) s += 5;
    if (v.budgetLakh < 9999) s -= v.budgetLakh / 100;
    return s;
  };
  const byModel = new Map<string, DemoVehicle[]>();
  for (const v of matched) {
    const arr = byModel.get(v.model);
    if (arr) arr.push(v);
    else byModel.set(v.model, [v]);
  }
  const ranked = [...byModel.values()].map((arr) => [...arr].sort((a, b) => score(b) - score(a)));
  // Round-robin one best offer per model until n is reached.
  const picks: DemoVehicle[] = [];
  let idx = 0;
  while (picks.length < n && ranked.some((arr) => idx < arr.length)) {
    for (const arr of ranked) {
      if (picks.length >= n) break;
      if (idx < arr.length) picks.push(arr[idx]);
    }
    idx++;
  }
  return picks;
}

/** Display label for a card price (range-aware, falls back to plain lakh). */
export function vehiclePriceLabel(v: DemoVehicle): string {
  return v.priceLabel ?? `৳${v.budgetLakh.toFixed(1)} lakh`;
}
