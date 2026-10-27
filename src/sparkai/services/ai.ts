import type { ChatMessage, ConversationIntent, CustomerPreferences, DemoVehicle } from '../types';
import { pickVehicles, formatLakh } from '../data/demo';
import { CAR_MODELS } from '../kb/sales';
import { SPARKPILOT_GROQ, SPARKPILOT_CONFIG } from '../config';
import { resolveKbTopic } from '../kb';

export interface AIResponse {
  text: string;
  vehicles?: DemoVehicle[];
  followUp?: string;
  prefs?: Partial<CustomerPreferences>;
  intent?: ConversationIntent;
  isLive?: boolean;
}

const hasBn = (t: string) => /[\u0980-\u09FF]/.test(t);
const num = (t: string): number | undefined => {
  const m = t.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(lakh|lac|laks|million|crore)?/i);
  if (!m) return undefined;
  let v = parseFloat(m[1]);
  const u = (m[2] || '').toLowerCase();
  if (u === 'crore') v *= 100;
  if (u === 'million') v *= 11.85;
  if (v > 200 && v < 10000000) v = v / 100000; // raw BDT → lakh
  if (v >= 10000000) v = v / 100000;
  return v > 5 && v < 300 ? Math.round(v * 10) / 10 : undefined;
};

/** Short model names from the KB, matched as whole words (e.g. 'noah', 'cr-v'). */
const MODEL_KEYWORDS: { name: string; re: RegExp }[] = CAR_MODELS.map((m) => {
  const short = m.name.replace(/^(Toyota|Honda|Nissan|Mazda|Lexus) /, '');
  const esc = short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { name: m.name, re: new RegExp(`\\b${esc}\\b`, 'i') };
});

function detectModel(t: string): string | undefined {
  for (const { name, re } of MODEL_KEYWORDS) if (re.test(t)) return name;
  return undefined;
}

/** Chat cards shown per reply: diverse models first, never the same 3 cars. */
const CARD_LIMIT = 8;

/** WhatsApp expert handoff line: shown whenever the matter is outside the KB. */
const expertHandoff = (bn: boolean) =>
  bn
    ? `\n\n_বিস্তারিত বা এক্সপার্টের সিদ্ধান্ত দরকার হলে WhatsApp করুন: ${SPARKPILOT_CONFIG.phoneDisplay} (wa.me/${SPARKPILOT_CONFIG.whatsappNumber})._`
    : `\n\n_Needs an expert? WhatsApp ${SPARKPILOT_CONFIG.phoneDisplay} (wa.me/${SPARKPILOT_CONFIG.whatsappNumber})._`;

/**
 * Deterministic fallback responder used only when the live Groq model is unreachable.
 * Rule: remembers stated prefs, asks one question at a time, never invents stock.
 */
export async function mockRespond(_history: ChatMessage[], input: string, prefs: CustomerPreferences, opts?: { signal?: AbortSignal }): Promise<AIResponse> {
  if (opts?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
  if (opts?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const t = input.toLowerCase();
  const bn = hasBn(input);
  const next: CustomerPreferences = { ...prefs };
  const b = num(t);
  if (b) next.budgetLakh = b;
  if (/hybrid/.test(t) && !/non.?hybrid/.test(t)) next.hybrid = true;
  if (/non.?hybrid|non hybrid|octane only|petrol only/.test(t)) next.hybrid = false;
  for (const k of ['sedan', 'suv', 'hatchback', 'mpv', 'wagon', '7-seater', '7 seater']) {
    if (t.includes(k)) next.bodyType = k.includes('7') ? 'MPV' : k[0].toUpperCase() + k.slice(1);
  }
  for (const m of ['toyota', 'honda', 'nissan', 'mazda', 'suzuki', 'lexus']) {
    if (t.includes(m)) next.manufacturer = m[0].toUpperCase() + m.slice(1);
  }
  const mentioned = detectModel(t);
  if (mentioned) next.model = mentioned;
  if (bn) next.language = 'bn';

  const pick = (n = 6) =>
    pickVehicles({ maxBudgetLakh: next.budgetLakh, hybrid: next.hybrid, bodyType: next.bodyType, make: next.manufacturer, model: next.model }, n);
  const demoNote = bn
    ? `\n\n_নোট: দাম ও স্টক এক্সপার্টের সাথে যাচাই করে নিন। WhatsApp: ${SPARKPILOT_CONFIG.phoneDisplay} (wa.me/${SPARKPILOT_CONFIG.whatsappNumber})._`
    : `\n\n_Note: confirm price & availability with an expert before booking. WhatsApp ${SPARKPILOT_CONFIG.phoneDisplay} (wa.me/${SPARKPILOT_CONFIG.whatsappNumber})._`;

  if (/^(hi|hello|salam|assalam|hey|adab|nomoskar|হাই|হ্যালো|আসসালামু|সালাম)/.test(t.trim())) {
    return { text: bn || /salam|assalam/.test(t) ? 'ওয়ালাইকুম আসসালাম! আমি SparkPilot , AutoSpark-এর সেলস ও সার্ভিস এক্সপার্ট। AutoSpark-এর গাড়ি বিক্রি ও কার সার্ভিস , সবকিছু জানি। কী জানতে চান?' : "Hello! I'm SparkPilot , I know everything about AutoSpark car sales and car services. What would you like to know?", prefs: next, intent: 'general' };
  }
  if (/pre.?order|japan|auction|import/.test(t)) {
    return { text: (bn ? 'জাপান প্রি-অর্ডার নিয়ে সাহায্য করছি। কোন গাড়ি (মডেল + বছর), বাজেট, আর কবে নাগাদ চান , জানাবেন?' : 'I can help with a Japan pre-order. Which model + year, your budget, and your timeline?') + expertHandoff(bn), prefs: next, intent: 'preorder', followUp: 'preorder' };
  }
  if (/service|battery|diagnos|maintenance|repair|সার্ভিস|ব্যাটারি/.test(t)) {
    return { text: (bn ? 'সার্ভিসের জন্য: গাড়ির মডেল/বছর আর সমস্যাটা (যেমন হাইব্রিড ব্যাটারি চেক, ডায়াগনসিস, জেনারেল সার্ভিস) জানান , এক্সপার্ট ফলো-আপের ব্যবস্থা করছি।' : 'For service: please share your model/year and the concern (e.g. hybrid battery check, diagnostics, general service) , I will arrange expert follow-up.') + expertHandoff(bn), prefs: next, intent: 'service', followUp: 'service' };
  }
  if (/financ|loan|installment|down ?payment|emi|কিস্তি|লোন/.test(t) || /budget|বাজেট/.test(t)) {
    if (next.budgetLakh) {
      const v = pick();
      return { text: `${bn ? `আপনার ${next.budgetLakh} লাখ বাজেট নোট করেছি` : `Noted your budget of ${formatLakh(next.budgetLakh)}`}.${v.length ? (bn ? ` এই বাজেটে ${v.length}টি অপশন:` : ` Here are ${v.length} options in range:`) : (bn ? ' এই বাজেটে মিল পাইনি , বাজেট একটু বাড়িয়ে দেখবেন?' : ' No matches in that range , shall we stretch the budget slightly?')}${demoNote}${v.length ? '' : expertHandoff(bn)}`, vehicles: v, prefs: next, intent: 'budget' };
    }
    return { text: bn ? 'আপনার আনুমানিক বাজেট কত (লাখে)? আর Hybrid পছন্দ করেন?' : 'What is your approximate budget (in lakh), and do you prefer hybrid?', prefs: next, intent: 'budget' };
  }
  if (/compare|vs |difference|পার্থক্য|তুলনা/.test(t)) {
    const v = [...pickVehicles({ model: 'Toyota Axio', hybrid: true }, 1), ...pickVehicles({ model: 'Honda Vezel', hybrid: true }, 1)];
    return { text: (bn ? 'দুটি জনপ্রিয় অপশনের তুলনা দিলাম , Compare ট্যাবে বিস্তারিত দেখুন।' : 'Here is a comparison of two popular options , see the Compare tab for detail.') + demoNote, vehicles: v.length ? v : pick(2), prefs: next, intent: 'compare', followUp: 'compare' };
  }
  if (/expert|human|call|phone|whatsapp|যোগাযোগ|কথা বলতে/.test(t)) {
    return { text: (bn ? `অবশ্যই! নিচের ফর্মে আপনার নাম ও WhatsApp নম্বর দিন , AutoSpark এক্সপার্ট শীঘ্রই যোগাযোগ করবেন। সরাসরি WhatsApp করতে পারেন: ${SPARKPILOT_CONFIG.phoneDisplay} (wa.me/${SPARKPILOT_CONFIG.whatsappNumber}).` : `Of course! Please share your name and WhatsApp number below , an AutoSpark expert will follow up shortly. Or WhatsApp us directly: ${SPARKPILOT_CONFIG.phoneDisplay} (wa.me/${SPARKPILOT_CONFIG.whatsappNumber}).`), prefs: next, intent: 'expert', followUp: 'lead' };
  }
  if (/family|7.?seat|noah|mpv|বাচ্চা|পরিবার/.test(t)) {
    const v = pickVehicles({ maxBudgetLakh: next.budgetLakh, hybrid: next.hybrid, bodyType: 'MPV' }, 6);
    return { text: (bn ? 'পরিবারের জন্য ৭-সিটের আরামদায়ক অপশন:' : 'Comfortable 7-seater family options:') + demoNote, vehicles: v, prefs: { ...next, bodyType: 'MPV' }, intent: 'find-car' };
  }
  if (b || /hybrid/.test(t) || next.manufacturer || next.bodyType || next.model || /car|gari|গাড়ি|suv|sedan|toyota|honda/.test(t)) {
    const v = pick();
    if (!next.budgetLakh && !next.model) {
      return { text: bn ? `ধন্যবাদ! ${next.manufacturer ?? ''} ${next.bodyType ?? 'গাড়ি'} পছন্দ নোট করেছি। আপনার বাজেট আনুমানিক কত (লাখে)?` : `Thanks , noted your interest in ${next.manufacturer ?? ''} ${next.bodyType ?? 'cars'}. What is your approximate budget (in lakh)?`, vehicles: v.length ? v : undefined, prefs: next, intent: 'find-car' };
    }
    return { text: `${bn ? `আপনার পছন্দ মনে রাখছি${next.budgetLakh ? ` , বাজেট ${next.budgetLakh} লাখ` : ''}${next.hybrid ? ', Hybrid' : ''}. এই অপশনগুলো দেখুন:` : `Keeping your preferences${next.budgetLakh ? `, budget ${formatLakh(next.budgetLakh)}` : ''}${next.hybrid ? ', hybrid' : ''}. Consider these options:`}${demoNote}`, vehicles: v, prefs: next, intent: 'find-car' };
  }
  const v = pick(4);
  return { text: bn ? 'বুঝতে পেরেছি। সেরা সাজেশন দিতে , বাজেট (লাখে) আর Hybrid চান কিনা জানাবেন?' : "Got it. To suggest the best options , could you share your budget (in lakh) and whether you'd like hybrid?", vehicles: v.length ? v : undefined, prefs: next, intent: 'general' };
}

/** Parse prefs deterministically (shared by mock + live path so memory never regresses). */
export function parsePrefs(input: string, prefs: CustomerPreferences): CustomerPreferences {
  const t = input.toLowerCase();
  const next: CustomerPreferences = { ...prefs };
  const b = num(t);
  if (b) next.budgetLakh = b;
  if (/hybrid/.test(t) && !/non.?hybrid/.test(t)) next.hybrid = true;
  if (/non.?hybrid|non hybrid|octane only|petrol only/.test(t)) next.hybrid = false;
  for (const k of ['sedan', 'suv', 'hatchback', 'mpv', 'wagon', '7-seater', '7 seater']) {
    if (t.includes(k)) next.bodyType = k.includes('7') ? 'MPV' : k[0].toUpperCase() + k.slice(1);
  }
  for (const m of ['toyota', 'honda', 'nissan', 'mazda', 'suzuki', 'lexus']) {
    if (t.includes(m)) next.manufacturer = m[0].toUpperCase() + m.slice(1);
  }
  const model = detectModel(t);
  if (model) next.model = model;
  if (hasBn(input)) next.language = 'bn';
  return next;
}

function detectIntent(t: string): ConversationIntent {
  if (/pre.?order|japan|auction|import/.test(t)) return 'preorder';
  if (/service|battery|diagnos|maintenance|repair|সার্ভিস|ব্যাটারি/.test(t)) return 'service';
  if (/financ|loan|installment|down ?payment|emi|কিস্তি|লোন|budget|বাজেট/.test(t)) return 'budget';
  if (/compare|vs |difference|পার্থক্য|তুলনা/.test(t)) return 'compare';
  if (/expert|human|call|phone|whatsapp|যোগাযোগ|কথা বলতে/.test(t)) return 'expert';
  if (/family|7.?seat|noah|mpv|বাচ্চা|পরিবার|car|gari|গাড়ি|suv|sedan|toyota|honda/.test(t)) return 'find-car';
  return 'general';
}

/** Groq free-tier TPM can throttle mid-conversation, wait and retry (up to 2). */
const RATE_LIMIT_WAIT_MS = 18000;
const RATE_LIMIT_RETRIES = 2;

/** True when the error is a user-initiated abort (Stop button), not a failure. */
export function isAbortError(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { name?: string }).name === 'AbortError';
}

/** Live Groq call via server proxy. Returns null on any failure (caller falls back). */
async function liveRespond(history: ChatMessage[], input: string, prefs: CustomerPreferences, external?: AbortSignal): Promise<AIResponse | null> {
  if (external?.aborted) throw new DOMException('Aborted', 'AbortError');
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  external?.addEventListener('abort', onAbort);
  const timer = setTimeout(() => ctrl.abort(), 70000);
  try {
    const msgs = [...history.slice(-10).map((m) => ({ role: m.role, content: m.text })), { role: 'user', content: input }];
    // Cards cover the FULL KB catalog (diverse models, up to CARD_LIMIT) —
    // the KB (not this list) is what SparkPilot recommends from, so no
    // conflicting context is sent to the server.
    const candidates = pickVehicles(
      { maxBudgetLakh: prefs.budgetLakh, hybrid: prefs.hybrid, bodyType: prefs.bodyType, make: prefs.manufacturer, model: prefs.model },
      CARD_LIMIT,
    );
    // Dual knowledge base: send only a topic ENUM — the server rebuilds the
    // KB text itself (client KB text is never trusted / never injected).
    const kbTopic = resolveKbTopic(input, history);
    // Prefs slimmed to known scalar keys (matches the server's slimPrefs contract).
    const prefsOut: Record<string, string | number | boolean> = {};
    if (typeof prefs.budgetLakh === 'number' && Number.isFinite(prefs.budgetLakh)) prefsOut.budgetLakh = prefs.budgetLakh;
    if (typeof prefs.hybrid === 'boolean') prefsOut.hybrid = prefs.hybrid;
    for (const k of ['bodyType', 'manufacturer', 'model', 'language', 'timeline'] as const) {
      const v = prefs[k];
      if (typeof v === 'string' && v.trim()) prefsOut[k] = v.trim().slice(0, 60);
    }
    const doFetch = () =>
      fetch(SPARKPILOT_GROQ.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, prefs: prefsOut, kbTopic }),
        signal: ctrl.signal,
      });
    let r = await doFetch();
    for (let attempt = 0; r.status === 429 && attempt < RATE_LIMIT_RETRIES; attempt++) {
      // Rate limited (tokens-per-minute): honor Retry-After when present, else cool down.
      const ra = Number(r.headers.get('retry-after'));
      const waitMs = Number.isFinite(ra) && ra > 0 ? Math.min(ra, 60) * 1000 : RATE_LIMIT_WAIT_MS;
      await new Promise((res) => setTimeout(res, waitMs));
      if (external?.aborted) throw new DOMException('Aborted', 'AbortError');
      if (ctrl.signal.aborted) return null; // internal timeout, fall back to mock
      r = await doFetch();
    }
    if (!r.ok) return null;
    const data = await r.json();
    const text = String(data?.text || '').trim();
    if (!text) return null;
    const t = input.toLowerCase();
    return { text, vehicles: candidates, prefs, intent: detectIntent(t) };
  } catch (e) {
    // User pressed Stop → propagate so callers skip the failure message;
    // any other error (incl. internal timeout) falls back to the mock responder.
    if (external?.aborted) {
      throw isAbortError(e) ? e : new DOMException('Aborted', 'AbortError');
    }
    return null;
  } finally {
    clearTimeout(timer);
    external?.removeEventListener('abort', onAbort);
  }
}

/**
 * Unified entry: tries real Groq (Polished Sales AI Expert) first,
 * falls back to the deterministic local responder when the live model is unreachable.
 * All callers should use this instead of mockRespond directly.
 */
export async function respond(history: ChatMessage[], input: string, prefs: CustomerPreferences, opts?: { signal?: AbortSignal }): Promise<AIResponse> {
  const next = parsePrefs(input, prefs);
  const live = await liveRespond(history, input, next, opts?.signal);
  if (live) return { ...live, prefs: next, isLive: true };
  if (opts?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  return { ...(await mockRespond(history, input, next, { signal: opts?.signal })), isLive: false };
}

export function estimateFinance(priceLakh: number, downPct: number, annualRatePct: number | null, months: number) {
  // Clamp math inputs; echo the clamped months (a 0/240-month plan is meaningless).
  const safePrice = Math.min(Math.max(priceLakh, 0), 500) * 100000;
  const pct = Math.min(Math.max(downPct, 0), 100);
  const m = Math.min(Math.max(Math.round(months || 0), 12), 84);
  const down = Math.round((safePrice * pct) / 100);
  const loan = safePrice - down;
  if (annualRatePct == null) {
    // Rate unknown → no EMI shown (deterministic "null rate" UI state).
    return { priceLakh, downPct, annualRatePct, months: m, downPaymentBDT: down, loanBDT: loan, monthlyBDT: null };
  }
  if (annualRatePct <= 0) {
    // Explicit 0% financing: even split of the loan (previously rendered as blank EMI).
    return { priceLakh, downPct, annualRatePct, months: m, downPaymentBDT: down, loanBDT: loan, monthlyBDT: Math.round(loan / m) };
  }
  const r = annualRatePct / 100 / 12;
  const monthly = Math.round((loan * r * Math.pow(1 + r, m)) / (Math.pow(1 + r, m) - 1));
  return { priceLakh, downPct, annualRatePct, months: m, downPaymentBDT: down, loanBDT: loan, monthlyBDT: monthly };
}
