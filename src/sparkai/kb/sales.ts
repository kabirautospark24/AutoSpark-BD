// ============================================================================
// KB #1: CAR SALES KNOWLEDGE BASE
// Source of truth: KB/updated/All Car Model, Package, Price - Sheet1.csv
// (the updated official sheet; .xlsx mirror in the same folder)
// ----------------------------------------------------------------------------
// Every vehicle SparkPilot may recommend lives in CAR_MODELS below:
// 23 models / 116 sheet rows / 102 priced-or-on-request offers
// (14 rows with N/A price are folded into model.unavailable[]).
//
// ► WHEN STOCK OR PRICES CHANGE: edit the matching entry in CAR_MODELS
//   (or update the source CSV and re-import). Never let SparkPilot quote
//   anything that is not listed here.
// ► A blank priceLakh means the sheet does not publish a price for that
//   offer: SparkPilot must say "price not listed" and hand off to an expert
//   on WhatsApp (+880 1760-401605) instead of guessing.
// ► The chat vehicle cards are DERIVED from this KB (data/catalog.ts);
//   never hardcode a separate car list anywhere else.
// ============================================================================

export interface KbOffer {
  availability: 'Ready Stock' | 'Pre-order';
  /** 'Hybrid' | 'Non-Hybrid' | a named trim (e.g. 'Hard Top', 'F-200', 'EX') */
  type: string;
  years: string;
  /** Japanese auction grade as listed (e.g. '4/4.5'). */
  grade: string;
  /** Price in lakh as listed: single figure, range, or per-variant figures. '' = not listed. */
  priceLakh: string;
  /** Mileage exactly as listed on the source sheet (confirm exact km with an expert). */
  mileage: string;
}

export interface KbCarModel {
  name: string;
  make: string;
  body: string;
  variants: string;
  cc: number;
  /** 'Hybrid' | 'Non-Hybrid' | 'Hybrid & Non-Hybrid' */
  fuel: string;
  /** Fuel/variant types not offered (e.g. ['Non-Hybrid']). */
  unavailable?: string[];
  offers: KbOffer[];
}

const R: KbOffer['availability'] = 'Ready Stock';
const P: KbOffer['availability'] = 'Pre-order';

// Current sheet notation: every row is Year 2021/2022 · Grade 4/4.5 ·
// Mileage 10k-50k KM. Prado prices are listed in crore on the source sheet
// (e.g. 1.38 Crore) and are normalized to lakh below (138 lakh).
const Y = '2021–2022';
const G = '4/4.5';
const KM = '10k-50k KM';

export const CAR_MODELS: KbCarModel[] = [
  {
    name: 'Toyota Axio', make: 'Toyota', body: 'Sedan', variants: 'EX', cc: 1500, fuel: 'Hybrid & Non-Hybrid',
    offers: [
      { availability: R, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '27.5/28', mileage: KM },
      { availability: R, type: 'Hybrid', years: Y, grade: G, priceLakh: '26.5/26', mileage: KM },
      { availability: P, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '25.5/26', mileage: KM },
      { availability: P, type: 'Hybrid', years: Y, grade: G, priceLakh: '24.50/25', mileage: KM },
    ],
  },
  {
    name: 'Toyota Fielder', make: 'Toyota', body: 'Wagon', variants: 'EX', cc: 1500, fuel: 'Hybrid & Non-Hybrid',
    offers: [
      { availability: R, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '27.5/28', mileage: KM },
      { availability: R, type: 'Hybrid', years: Y, grade: G, priceLakh: '26.5/26', mileage: KM },
      { availability: P, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '25.5/26', mileage: KM },
      { availability: P, type: 'Hybrid', years: Y, grade: G, priceLakh: '24.50/25', mileage: KM },
    ],
  },
  {
    name: 'Toyota Premio', make: 'Toyota', body: 'Sedan', variants: 'F, FL, FL Black, FL Base, FEX', cc: 1500, fuel: 'Non-Hybrid',
    unavailable: ['Hybrid'],
    offers: [
      { availability: R, type: 'G+/FEX', years: Y, grade: G, priceLakh: '53/57', mileage: KM },
      { availability: R, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '50/53', mileage: KM },
      { availability: P, type: 'G+/FEX', years: Y, grade: G, priceLakh: '50/53', mileage: KM },
      { availability: P, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '48/50', mileage: KM },
    ],
  },
  {
    name: 'Toyota Allion', make: 'Toyota', body: 'Sedan', variants: 'A15, A15-G, A15-Plus', cc: 1500, fuel: 'Non-Hybrid',
    unavailable: ['Hybrid'],
    offers: [
      { availability: R, type: 'G+/FEX', years: Y, grade: G, priceLakh: '53/57', mileage: KM },
      { availability: R, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '50/53', mileage: KM },
      { availability: P, type: 'G+/FEX', years: Y, grade: G, priceLakh: '50/53', mileage: KM },
      { availability: P, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '48/50', mileage: KM },
    ],
  },
  {
    name: 'Toyota Aqua', make: 'Toyota', body: 'Hatchback', variants: 'L, S, G', cc: 1500, fuel: 'Hybrid',
    unavailable: ['Non-Hybrid'],
    offers: [
      { availability: R, type: 'Hybrid', years: Y, grade: G, priceLakh: '25/27', mileage: KM },
      { availability: P, type: 'Hybrid', years: Y, grade: G, priceLakh: '23/25', mileage: KM },
    ],
  },
  {
    name: 'Toyota C-HR', make: 'Toyota', body: 'SUV / Crossover', variants: 'G mode Naro, GR Sport', cc: 1800, fuel: 'Hybrid',
    unavailable: ['Non-Hybrid'],
    offers: [
      { availability: R, type: 'Hybrid (G-LED)', years: Y, grade: G, priceLakh: '33/34.50', mileage: KM },
      { availability: P, type: 'Hybrid (G-LED)', years: Y, grade: G, priceLakh: '32.50', mileage: KM },
    ],
  },
  {
    name: 'Nissan X-Trail', make: 'Nissan', body: 'SUV', variants: 'S, SV, SL, TL', cc: 2000, fuel: 'Hybrid',
    unavailable: ['Non-Hybrid'],
    offers: [
      { availability: R, type: 'Hybrid', years: Y, grade: G, priceLakh: '36.50', mileage: KM },
      { availability: P, type: 'Hybrid', years: Y, grade: G, priceLakh: '34.50', mileage: KM },
    ],
  },
  {
    name: 'Mazda Axela', make: 'Mazda', body: 'Hatchback', variants: '-', cc: 1800, fuel: 'Hybrid & Non-Hybrid',
    unavailable: ['Hybrid'],
    offers: [
      { availability: R, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '36.50', mileage: KM },
      { availability: P, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '35.50', mileage: KM },
    ],
  },
  {
    name: 'Honda CR-V', make: 'Honda', body: 'SUV', variants: 'EX-L', cc: 2000, fuel: 'Hybrid & Non-Hybrid',
    offers: [
      { availability: R, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '52.50', mileage: KM },
      { availability: R, type: 'Hybrid', years: Y, grade: G, priceLakh: '48.50', mileage: KM },
      { availability: P, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '47.50', mileage: KM },
      { availability: P, type: 'Hybrid', years: Y, grade: G, priceLakh: '42.50', mileage: KM },
    ],
  },
  {
    name: 'Toyota Corolla Cross', make: 'Toyota', body: 'SUV / Crossover', variants: 'Z-Leather', cc: 1800, fuel: 'Hybrid',
    unavailable: ['Non-Hybrid'],
    offers: [
      { availability: R, type: 'Hard Top', years: Y, grade: G, priceLakh: '40.50', mileage: KM },
      { availability: R, type: 'Moon Roof', years: Y, grade: G, priceLakh: '45.50', mileage: KM },
      { availability: P, type: 'Hard Top', years: Y, grade: G, priceLakh: '37.50', mileage: KM },
      { availability: P, type: 'Moon Roof', years: Y, grade: G, priceLakh: '42.50', mileage: KM },
    ],
  },
  {
    name: 'Toyota Harrier', make: 'Toyota', body: 'SUV', variants: 'Z', cc: 2000, fuel: 'Hybrid & Non-Hybrid',
    offers: [
      { availability: R, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '69', mileage: KM },
      { availability: R, type: 'Hybrid', years: Y, grade: G, priceLakh: '65.50', mileage: KM },
      { availability: P, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '72', mileage: KM },
      { availability: P, type: 'Hybrid', years: Y, grade: G, priceLakh: '62.50', mileage: KM },
    ],
  },
  {
    name: 'Toyota Sienta', make: 'Toyota', body: 'MPV', variants: 'G Cuero', cc: 1500, fuel: 'Hybrid',
    unavailable: ['Non-Hybrid'],
    offers: [
      { availability: R, type: 'Hybrid', years: Y, grade: G, priceLakh: '', mileage: KM },
      { availability: P, type: 'Hybrid', years: Y, grade: G, priceLakh: '', mileage: KM },
    ],
  },
  {
    name: 'Toyota Noah', make: 'Toyota', body: 'MPV', variants: 'X, G, HG, SZ', cc: 1800, fuel: 'Hybrid & Non-Hybrid',
    offers: [
      { availability: R, type: 'X (Non-Hybrid)', years: Y, grade: G, priceLakh: '38.5/39', mileage: KM },
      { availability: R, type: 'X (Hybrid)', years: Y, grade: G, priceLakh: '35/36', mileage: KM },
      { availability: P, type: 'X (Non-Hybrid)', years: Y, grade: G, priceLakh: '36.5/37', mileage: KM },
      { availability: P, type: 'X (Hybrid)', years: Y, grade: G, priceLakh: '34.50/35', mileage: KM },
      { availability: R, type: 'G (Non-Hybrid)', years: Y, grade: G, priceLakh: '39.50/40', mileage: KM },
      { availability: R, type: 'G (Hybrid)', years: Y, grade: G, priceLakh: '35.60/36.50', mileage: KM },
      { availability: P, type: 'G (Non-Hybrid)', years: Y, grade: G, priceLakh: '37.50/38', mileage: KM },
      { availability: P, type: 'G (Hybrid)', years: Y, grade: G, priceLakh: '35.50/36', mileage: KM },
      { availability: R, type: 'HG (Non-Hybrid)', years: Y, grade: G, priceLakh: '39.50/40', mileage: KM },
      { availability: R, type: 'HG (Hybrid)', years: Y, grade: G, priceLakh: '38.50/39', mileage: KM },
      { availability: P, type: 'HG (Non-Hybrid)', years: Y, grade: G, priceLakh: '38.50/39.50', mileage: KM },
      { availability: P, type: 'HG (Hybrid)', years: Y, grade: G, priceLakh: '37.50/38', mileage: KM },
      { availability: R, type: 'SZ (Non-Hybrid)', years: Y, grade: G, priceLakh: '44.50/45', mileage: KM },
      { availability: R, type: 'SZ (Hybrid)', years: Y, grade: G, priceLakh: '42.50/43', mileage: KM },
      { availability: P, type: 'SZ (Non-Hybrid)', years: Y, grade: G, priceLakh: '42.50/43', mileage: KM },
      { availability: P, type: 'SZ (Hybrid)', years: Y, grade: G, priceLakh: '40.50/42', mileage: KM },
    ],
  },
  {
    name: 'Toyota Esquire', make: 'Toyota', body: 'MPV', variants: 'Gi, Gi Premium', cc: 1800, fuel: 'Hybrid & Non-Hybrid',
    offers: [
      { availability: R, type: 'Gi (Non-Hybrid)', years: Y, grade: G, priceLakh: '37.50/38', mileage: KM },
      { availability: R, type: 'Gi (Hybrid)', years: Y, grade: G, priceLakh: '36.5/37', mileage: KM },
      { availability: P, type: 'Gi (Non-Hybrid)', years: Y, grade: G, priceLakh: '39.5/40', mileage: KM },
      { availability: P, type: 'Gi (Hybrid)', years: Y, grade: G, priceLakh: '38.5/39', mileage: KM },
      { availability: R, type: 'Gi Premium (Non-Hybrid)', years: Y, grade: G, priceLakh: '41.50/42', mileage: KM },
      { availability: R, type: 'Gi Premium (Hybrid)', years: Y, grade: G, priceLakh: '40.50/41', mileage: KM },
      { availability: P, type: 'Gi Premium (Non-Hybrid)', years: Y, grade: G, priceLakh: '45.50/46', mileage: KM },
      { availability: P, type: 'Gi Premium (Hybrid)', years: Y, grade: G, priceLakh: '43.50/44', mileage: KM },
    ],
  },
  {
    name: 'Honda Grace', make: 'Honda', body: 'Sedan', variants: 'DX, LX, EX', cc: 1500, fuel: 'Hybrid',
    unavailable: ['Non-Hybrid'],
    offers: [
      { availability: R, type: 'DX (Hybrid)', years: Y, grade: G, priceLakh: '29/30', mileage: KM },
      { availability: R, type: 'LX (Hybrid)', years: Y, grade: G, priceLakh: '31/32', mileage: KM },
      { availability: R, type: 'EX (Hybrid)', years: Y, grade: G, priceLakh: '32/33', mileage: KM },
      { availability: P, type: 'DX (Hybrid)', years: Y, grade: G, priceLakh: '24/25', mileage: KM },
      { availability: P, type: 'LX (Hybrid)', years: Y, grade: G, priceLakh: '26.5/27', mileage: KM },
      { availability: P, type: 'EX (Hybrid)', years: Y, grade: G, priceLakh: '27.50/28', mileage: KM },
    ],
  },
  {
    name: 'Honda Civic', make: 'Honda', body: 'Sedan', variants: 'DX, LX, EX', cc: 1500, fuel: 'Hybrid',
    unavailable: ['Non-Hybrid'],
    offers: [
      { availability: R, type: 'DX (Hybrid)', years: Y, grade: G, priceLakh: '34.5/35', mileage: KM },
      { availability: R, type: 'LX (Hybrid)', years: Y, grade: G, priceLakh: '35.5/36', mileage: KM },
      { availability: R, type: 'EX (Hybrid)', years: Y, grade: G, priceLakh: '36.5/37', mileage: KM },
      { availability: P, type: 'DX (Hybrid)', years: Y, grade: G, priceLakh: '31.5/32', mileage: KM },
      { availability: P, type: 'LX (Hybrid)', years: Y, grade: G, priceLakh: '32.5/33', mileage: KM },
      { availability: P, type: 'EX (Hybrid)', years: Y, grade: G, priceLakh: '33.5/36', mileage: KM },
    ],
  },
  {
    name: 'Toyota Yaris Cross', make: 'Toyota', body: 'SUV / Crossover', variants: 'X, G, Z (P-B)', cc: 1500, fuel: 'Hybrid',
    unavailable: ['Non-Hybrid'],
    offers: [
      { availability: R, type: 'Hybrid', years: Y, grade: G, priceLakh: '34.50', mileage: KM },
      { availability: P, type: 'Hybrid', years: Y, grade: G, priceLakh: '29.50', mileage: KM },
    ],
  },
  {
    name: 'Honda Vezel', make: 'Honda', body: 'SUV / Crossover', variants: 'X, Z, RS', cc: 1500, fuel: 'Hybrid & Non-Hybrid',
    offers: [
      { availability: R, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '43/44', mileage: KM },
      { availability: R, type: 'Hybrid', years: Y, grade: G, priceLakh: '41.50/42', mileage: KM },
      { availability: P, type: 'Non-Hybrid', years: Y, grade: G, priceLakh: '41/42', mileage: KM },
      { availability: P, type: 'Hybrid', years: Y, grade: G, priceLakh: '38', mileage: KM },
    ],
  },
  {
    name: 'Toyota Prius', make: 'Toyota', body: 'Hatchback', variants: 'S, S Touring, S Safety Plus, A Touring, A Touring Premium Selection', cc: 1800, fuel: 'Hybrid',
    unavailable: ['Non-Hybrid'],
    offers: [
      { availability: R, type: 'Hybrid', years: Y, grade: G, priceLakh: '41.50', mileage: KM },
      { availability: P, type: 'Hybrid', years: Y, grade: G, priceLakh: '37.50', mileage: KM },
    ],
  },
  {
    name: 'Honda Insight', make: 'Honda', body: 'Sedan', variants: 'EX, LX', cc: 1500, fuel: 'Hybrid',
    unavailable: ['Non-Hybrid'],
    offers: [
      { availability: R, type: 'EX', years: Y, grade: G, priceLakh: '40.50/41', mileage: KM },
      { availability: R, type: 'LX', years: Y, grade: G, priceLakh: '34.50/35', mileage: KM },
      { availability: P, type: 'EX', years: Y, grade: G, priceLakh: '35.50/36', mileage: KM },
      { availability: P, type: 'LX', years: Y, grade: G, priceLakh: '34.50/35', mileage: KM },
    ],
  },
  {
    name: 'Lexus NX', make: 'Lexus', body: 'SUV', variants: 'F-200, R-300, EX-300', cc: 2500, fuel: 'Hybrid',
    unavailable: ['Non-Hybrid'],
    offers: [
      { availability: R, type: 'F-200', years: Y, grade: G, priceLakh: '', mileage: KM },
      { availability: R, type: 'R-300', years: Y, grade: G, priceLakh: '', mileage: KM },
      { availability: R, type: 'EX-300', years: Y, grade: G, priceLakh: '', mileage: KM },
      { availability: P, type: 'F-200', years: Y, grade: G, priceLakh: '', mileage: KM },
      { availability: P, type: 'R-300', years: Y, grade: G, priceLakh: '', mileage: KM },
      { availability: P, type: 'EX-300', years: Y, grade: G, priceLakh: '', mileage: KM },
    ],
  },
  {
    name: 'Toyota Land Cruiser Prado', make: 'Toyota', body: 'SUV', variants: 'TX, TXL', cc: 2500, fuel: 'Hybrid & Non-Hybrid',
    offers: [
      { availability: R, type: 'TX', years: Y, grade: G, priceLakh: '138', mileage: KM },
      { availability: R, type: 'TXL', years: Y, grade: G, priceLakh: '145', mileage: KM },
      { availability: P, type: 'TX', years: Y, grade: G, priceLakh: '130', mileage: KM },
      { availability: P, type: 'TXL', years: Y, grade: G, priceLakh: '135', mileage: KM },
    ],
  },
  {
    name: 'Toyota Crown', make: 'Toyota', body: 'Sedan', variants: 'RS Limited, RS Advance', cc: 2500, fuel: 'Hybrid',
    unavailable: ['Non-Hybrid'],
    offers: [
      { availability: R, type: 'RS', years: Y, grade: G, priceLakh: '75/76', mileage: KM },
      { availability: R, type: 'New G', years: Y, grade: G, priceLakh: '70/71', mileage: KM },
      { availability: R, type: 'Twin Turbo', years: Y, grade: G, priceLakh: '71/72', mileage: KM },
      { availability: P, type: 'RS', years: Y, grade: G, priceLakh: '70/71', mileage: KM },
      { availability: P, type: 'New G', years: Y, grade: G, priceLakh: '74/75', mileage: KM },
      { availability: P, type: 'Twin Turbo', years: Y, grade: G, priceLakh: '76/77', mileage: KM },
    ],
  },
];

/** Expert/WhatsApp handoff shared by every handoff line in this KB. */
const EXPERT = 'WhatsApp an AutoSpark expert: +880 1760-401605';

/** Models whose sheet does not publish any price (offer-level blanks only). */
export function hasListedPrice(m: KbCarModel): boolean {
  return m.offers.some((o) => o.priceLakh.trim() !== '');
}

/** Lowest listed price (lakh) for a model: used for the budget index. 999 = none listed. */
export function entryPriceLakh(m: KbCarModel): number {
  let min = Infinity;
  for (const o of m.offers) {
    const v = parseFloat(o.priceLakh.replace(/,/g, ''));
    if (!Number.isNaN(v) && v < min) min = v;
  }
  return Number.isFinite(min) ? min : 999;
}

export const SALES_KB_SOURCE_NOTE =
  'Source: AutoSpark official price sheet , KB/updated/All Car Model, Package, Price - Sheet1.csv (116 variants across 23 models).';

function priceLabel(o: KbOffer): string {
  return o.priceLakh.trim() ? `৳${o.priceLakh} lakh` : `price not listed , ${EXPERT}`;
}

function lineupText(): string {
  const lines: string[] = [];
  for (const m of CAR_MODELS) {
    lines.push(`## ${m.name} | ${m.variants !== '-' ? `variants ${m.variants}, ` : ''}${m.cc} cc | ${m.fuel} | ${m.body}`);
    for (const o of m.offers) {
      lines.push(
        `- ${o.availability} · ${o.type} · Years ${o.years} · Grade ${o.grade} · ${priceLabel(o)} · Mileage ${o.mileage}`,
      );
    }
    if (m.unavailable?.length) lines.push(`- Not available: ${m.unavailable.join(', ')} (do not offer these)`);
  }
  return lines.join('\n');
}

function priceIndexText(): string {
  const fuelTag = (m: KbCarModel) =>
    m.fuel.includes('Hybrid') && m.fuel.includes('Non') ? '' : m.fuel === 'Hybrid' ? ', Hybrid' : ', Non-Hybrid';
  const priced = CAR_MODELS
    .filter(hasListedPrice)
    .sort((a, b) => entryPriceLakh(a) - entryPriceLakh(b))
    .map((m) => `৳${entryPriceLakh(m)} lakh → ${m.name} (${m.body}${fuelTag(m)})`)
    .join('\n');
  const onRequest = CAR_MODELS.filter((m) => !hasListedPrice(m))
    .map((m) => `${m.name} (${m.body}) , price not listed , ${EXPERT}`)
    .join('\n');
  return [priced, onRequest ? `\n[PRICE NOT LISTED , expert confirms]\n${onRequest}` : ''].join('\n');
}

/** Flatten the sales KB into a single system-prompt-ready text block. */
export function buildSalesKbText(): string {
  return [
    '### AUTOSPARK CAR SALES KNOWLEDGE BASE (verified , the ONLY vehicles SparkPilot may recommend) ###',
    'NOTATION:',
    '- Prices are in Bangladeshi lakh (৳ lakh). Some entries show per-grade or per-variant figures (e.g. "53/57") or a range , present the range and confirm the exact variant price with an expert.',
    '- Prado prices are listed in crore on the source sheet (e.g. 1.38 Crore = ৳138 lakh); all figures below are stated in lakh.',
    '- Grade is the Japanese auction grade as listed ("4/4.5" on the current sheet).',
    '- Mileage is listed as a range (e.g. "10k-50k KM") , never invent an exact reading; an expert confirms the exact km for a specific car.',
    '- Years are as listed (2021/2022). Never quote a year that is not listed for that offer.',
    '- "Ready Stock" = car is in Bangladesh now. "Pre-order" = sourced via Japan auction/import; price and grade are typical, final vehicle is confirmed per order.',
    '- Blank price = the sheet does not publish a price for that offer. Say "price not listed" and hand off , never guess a number.',
    '- Never claim a model, variant, year, grade, fuel type, or price that is not listed below. If a customer wants something unlisted, offer Japan pre-order sourcing via an expert.',
    '',
    '[FULL MODEL MATRIX]',
    lineupText(),
    '',
    '[BUDGET QUICK INDEX , lowest listed price per model]',
    priceIndexText(),
    '',
    '[ABOUT AUTOSPARK SALES]',
    [
      'AutoSpark is a Japanese-car specialist dealership in Rajshahi, Bangladesh: ready-stock sales, Japan pre-order / auction import, hybrid consulting, and financing guidance.',
      'Showroom hours: Saturday–Thursday, 9:00–18:00. Expert/WhatsApp: +880 1760-401605.',
    ].join('\n'),
    '',
    '[JAPAN PRE-ORDER / AUCTION IMPORT , how it works]',
    [
      '1) Customer shares desired model + variant + year + budget.',
      '2) AutoSpark sources Japanese auction/dealer options and shares verified listings with photos, auction-sheet translation, and landed-cost estimate.',
      '3) Customer confirms the vehicle and pays the agreed booking amount.',
      '4) AutoSpark handles purchase, export documents, shipping, customs, registration support, and delivery in Bangladesh.',
      'Never quote a fixed delivery date , promise an expert-confirmed timeline instead.',
    ].join('\n'),
    '',
    '[FINANCING]',
    [
      'AutoSpark helps estimate budgets and EMI plans; final loan approval comes from the bank/financial institution.',
      'SparkPilot can compute an indicative monthly installment when the customer gives down-payment %, tenure, and annual rate.',
      'For official bank rates or approval guarantees → connect to an expert (+880 1760-401605). Never approve or promise a loan.',
    ].join('\n'),
    '',
    '[BUYING PROCESS]',
    [
      '1) Consultation (SparkPilot does this interactively) → 2) Shortlist 2–3 matching models from the matrix → 3) Expert confirms exact price, condition, availability → 4) Test drive / showroom visit in Rajshahi → 5) Booking & paperwork → delivery.',
    ].join('\n'),
    '',
    '[SALES FAQS]',
    [
      '1. Q: Are the listed prices final? A: They are the official listed prices; the expert confirms the exact variant price and availability before booking.',
      '2. Q: Do you offer test drives? A: Yes , share your name and WhatsApp number and an expert will arrange a test drive in Rajshahi.',
      '3. Q: What is ready stock vs pre-order? A: Ready stock is already in Bangladesh and can be viewed/booked now; pre-order is sourced fresh from Japan (typical grade/price shown, final vehicle confirmed per order).',
      '4. Q: Do you take trade-ins? A: An expert can evaluate your current car for exchange , share details via WhatsApp (+880 1760-401605).',
      '5. Q: Why are pre-order mileage figures different? A: Pre-order cars are sourced per order; the listed figure is typical , the exact vehicle is confirmed with photos and auction sheet.',
      '6. Q: Why is a price not shown? A: The official sheet does not publish it yet , an AutoSpark expert quotes it on WhatsApp: +880 1760-401605.',
    ].join('\n'),
    '',
    '[EXPERT HANDOFF , when to share the WhatsApp number]',
    [
      'Anything outside this KB must be handed to a human expert. Always show the number in that reply: WhatsApp +880 1760-401605 (wa.me/8801760401605).',
      'Hand off when the customer asks about: a price/variant not listed above; a discount, negotiation, or reservation; exact stock count or a specific chassis/car; trade-in valuation; registration, tax, customs, or paperwork; spare parts or accessories availability; loan approval or bank letters; delivery dates for a specific order; complaints, warranty claims, or anything legal. Say what you do know first, then hand off , never guess.',
    ].join('\n'),
    '',
    SALES_KB_SOURCE_NOTE,
  ].join('\n\n');
}
