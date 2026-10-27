import { describe, it, expect } from 'vitest';
import {
  detectKbTopic, buildKbPayload,
  CAR_MODELS, entryPriceLakh, hasListedPrice, buildSalesKbText,
  CAR_SERVICES_KB, buildServicesKbText,
} from '../kb';
import { SALES_SYSTEM_PROMPT } from '../../../api/sparkai/chat';

// Server injection caps: must match api/sparkai/chat.ts / server/dev-server.js.
const SALES_CAP = 24000;
const SERVICES_CAP = 16000;

describe('Dual KB , topic routing', () => {
  it('routes service questions to the services KB', () => {
    expect(detectKbTopic('My brake is making noise , how much for a brake service?')).toBe('services');
    expect(detectKbTopic('A/C gas recharge কত টাকা?')).toBe('services');
    expect(detectKbTopic('সার্ভিস কবে দিতে হবে?')).toBe('services');
  });

  it('routes sales questions to the sales KB', () => {
    expect(detectKbTopic('Which hybrid car under 30 lakh?')).toBe('sales');
    expect(detectKbTopic('আমার জন্য একটা ফ্যামিলি গাড়ি দরকার')).toBe('sales');
    expect(detectKbTopic('Tell me about ready stock Noah')).toBe('sales');
  });

  it('routes mixed or unclear messages to both KBs', () => {
    expect(detectKbTopic('I want a family MPV, and when should I service it?')).toBe('both');
    expect(detectKbTopic('hello')).toBe('both');
    expect(detectKbTopic('কী জানতে চান?')).toBe('both');
  });

  it('builds a payload with only the routed KB blocks', () => {
    expect(buildKbPayload('brake pad replacement price').services).toBeTruthy();
    expect(buildKbPayload('brake pad replacement price').sales).toBeUndefined();
    expect(buildKbPayload('Prius vs Aqua for city driving').sales).toBeTruthy();
    expect(buildKbPayload('Prius vs Aqua for city driving').services).toBeUndefined();
    const both = buildKbPayload('suggest a car and its next service cost');
    expect(both.sales && both.services).toBeTruthy();
  });

  it('sends no KB blocks for pure greetings (saves Groq TPM)', () => {
    expect(buildKbPayload('hello')).toEqual({});
    expect(buildKbPayload('আসসালামু আলাইকুম')).toEqual({});
    expect(buildKbPayload('what can you help me with?')).toEqual({});
  });
});

describe('Car Sales KB , official price sheet', () => {
  const text = buildSalesKbText();

  it('covers all 23 models from the price sheet', () => {
    expect(CAR_MODELS.length).toBe(23);
    for (const m of CAR_MODELS) expect(text).toContain(m.name);
  });

  it('carries verified prices for spot-checked models', () => {
    expect(text).toContain('৳26.5/26 lakh');   // Axio ready stock hybrid
    expect(text).toContain('৳25/27');          // Aqua ready stock by grade
    expect(text).toContain('৳53/57');          // Premio ready stock by variant
    expect(text).toContain('৳38.5/39');        // Noah ready stock X non-hybrid
    expect(text).toContain('৳34.5/35');        // Civic ready stock DX hybrid
    expect(text).toContain('৳38 lakh');        // Vezel pre-order hybrid
    expect(text).toContain('৳138 lakh');       // Prado TX (source 1.38 Crore)
    expect(text).toContain('৳145 lakh');       // Prado TXL (source 1.45 Crore)
  });

  it('never guesses a price the sheet leaves blank (hands off to WhatsApp)', () => {
    const unpriced = CAR_MODELS.filter((m) => !hasListedPrice(m));
    expect(unpriced.map((m) => m.name).sort()).toEqual(['Lexus NX', 'Toyota Sienta']);
    expect(text).toContain('[PRICE NOT LISTED');
    expect(text).toContain('price not listed , WhatsApp an AutoSpark expert: +880 1760-401605');
  });

  it('includes both Ready Stock and Pre-order channels', () => {
    expect(text).toContain('Ready Stock');
    expect(text).toContain('Pre-order');
    const ready = CAR_MODELS.filter((m) => m.offers.some((o) => o.availability === 'Ready Stock'));
    const pre = CAR_MODELS.filter((m) => m.offers.some((o) => o.availability === 'Pre-order'));
    expect(ready.length).toBeGreaterThan(20);
    expect(pre.length).toBeGreaterThan(15);
  });

  it('marks unavailable fuel types so SparkPilot never offers them', () => {
    expect(text).toContain('Not available: Non-Hybrid');
    expect(text).toContain('Not available: Hybrid');
  });

  it('contains notation rules + source note', () => {
    expect(text).toContain('auction grade');
    expect(text).toContain('KB/updated/All Car Model, Package, Price - Sheet1.csv');
    expect(text).toContain('Never claim a model');
  });

  it('budget quick index is sorted ascending by entry price', () => {
    expect(entryPriceLakh(CAR_MODELS.find((m) => m.name === 'Toyota Aqua')!)).toBe(23);
    const indexBlock = text.split('[BUDGET QUICK INDEX')[1]?.split('[PRICE NOT LISTED')[0] ?? '';
    const prices = [...indexBlock.matchAll(/৳(\d+(?:\.\d+)?) lakh/g)].map((m) => parseFloat(m[1]));
    expect(prices.length).toBe(CAR_MODELS.filter(hasListedPrice).length);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  it('stays within the server injection cap', () => {
    expect(text.length).toBeLessThan(SALES_CAP);
  });
});

describe('Car Services KB , official price list', () => {
  const text = buildServicesKbText();

  it('contains every service price from the official list', () => {
    const official: [string, number][] = [
      ['Brake Oil Change', 1500], ['Engine Overhauling', 8500], ['Gear Box Open/Fitting', 5500],
      ['Engine Mounting', 2000], ['1 Part Color (White & Silver)', 5000], ['1 Part Color (Any Other Color)', 7000],
      ['Full Body Color (White/Silver)', 60000], ['Full Body Color (Any Other Color)', 80000],
      ['Super Master Service', 5500], ['Brake Service', 600], ['Car Wash', 500], ['A/C Service', 2000],
      ['Full Car Polish (Normal)', 4000], ['Full Car Polish (High Quality)', 6000],
      ['Suspension (Front)', 4500], ['Suspension (Front & Rear)', 6000],
      ['Brake Booster Replace', 8000], ['Master Service', 4000], ['Battery Service', 4500],
    ];
    for (const [name, price] of official) {
      const entry = CAR_SERVICES_KB.catalog.find((s) => s.name === name);
      expect(entry, `missing service: ${name}`).toBeTruthy();
      expect(entry!.priceTk, `wrong price: ${name}`).toBe(price);
    }
    expect(text).toContain('৳1500');
    expect(text).toContain('official AutoSpark price list');
  });

  it('stays within the server injection cap', () => {
    expect(text.length).toBeLessThan(SERVICES_CAP);
  });
});

describe('Sales-expert persona contract (server system prompt)', () => {
  it('introduces itself as SparkPilot knowing sales + services', () => {
    expect(SALES_SYSTEM_PROMPT).toContain("I'm SparkPilot");
    expect(SALES_SYSTEM_PROMPT).toContain('car sales');
    expect(SALES_SYSTEM_PROMPT).toContain('car services');
    expect(SALES_SYSTEM_PROMPT).toContain('What would you like to know?');
  });

  it('instructs human-psychology selling behavior', () => {
    expect(SALES_SYSTEM_PROMPT).toContain('HUMAN PSYCHOLOGY');
    expect(SALES_SYSTEM_PROMPT).toContain('Rapport first');
    expect(SALES_SYSTEM_PROMPT).toContain('Emotion before information');
    expect(SALES_SYSTEM_PROMPT).toContain('Active listening');
    expect(SALES_SYSTEM_PROMPT).toContain('Read the buyer');
    expect(SALES_SYSTEM_PROMPT).toContain('Honest-advisor trust');
    expect(SALES_SYSTEM_PROMPT).toContain('not a script');
  });

  it('routes across both knowledge bases with hard guardrails', () => {
    expect(SALES_SYSTEM_PROMPT).toContain('AUTOSPARK CAR SALES KNOWLEDGE BASE');
    expect(SALES_SYSTEM_PROMPT).toContain('AUTOSPARK CAR SERVICES KNOWLEDGE BASE');
    expect(SALES_SYSTEM_PROMPT).toContain('Never invent stock');
    expect(SALES_SYSTEM_PROMPT).toContain('never fake scarcity');
    expect(SALES_SYSTEM_PROMPT).toContain('NEVER ₹'); // ৳ only, never rupee/dollar signs
    expect(SALES_SYSTEM_PROMPT).toContain('never markdown tables');
  });

  it('stays one consistent AI Sales Expert and never breaks character', () => {
    expect(SALES_SYSTEM_PROMPT).toContain('CONSISTENCY');
    expect(SALES_SYSTEM_PROMPT).toContain('never break character');
    expect(SALES_SYSTEM_PROMPT).toContain('Never switch persona');
  });

  it('always shows the WhatsApp number when a matter is outside the KB', () => {
    expect(SALES_SYSTEM_PROMPT).toContain('EXPERT HANDOFF');
    expect(SALES_SYSTEM_PROMPT).toContain('+880 1760-401605');
    expect(SALES_SYSTEM_PROMPT).toContain('wa.me/8801760401605');
    expect(SALES_SYSTEM_PROMPT).toContain('Never answer an out-of-KB question without the number');
  });
});
