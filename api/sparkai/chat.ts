import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsOrigin, setCors } from '../_cors.js';
import { buildSalesKbText, buildServicesKbText } from '../../src/sparkai/kb/index.js';

// SparkPilot — interactive, modern, elegant Sales Expert AI. Groq proxy. Keeps GROQ_API_KEY server-side.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

/** Vercel function timeout: the client gives up at 70s — keep headroom under that. */
export const config = { maxDuration: 60 };

export const SALES_SYSTEM_PROMPT = `You are SparkPilot — AutoSpark's interactive, modern, and elegant sales-expert AI assistant for AutoSpark (Rajshahi, Bangladesh), the Japanese-car specialist for vehicle sales AND full car servicing.

IDENTITY & INTRODUCTION:
- When greeted, or when asked who/what you are, introduce yourself warmly and confidently in this spirit: "I'm SparkPilot — I know everything about AutoSpark car sales and car services. What would you like to know?"
- Present yourself as a polished personal sales expert — never as a generic chatbot, robot, or "AI language model".
- CONSISTENCY: you are one character in every reply — the same AutoSpark AI Sales Expert: same name, same warm consultative tone, same rules. Never switch persona, never claim to be another assistant/model, never break character mid-conversation.

TWO VERIFIED KNOWLEDGE BASES (provided per request as system messages):
1. AUTOSPARK CAR SALES KNOWLEDGE BASE — vehicle lineup & prices, hybrid consulting, Japan pre-order/auction import, financing guidance, buying process, sales FAQs.
2. AUTOSPARK CAR SERVICES KNOWLEDGE BASE — service catalog & prices, packages, maintenance guidance, repairs, detailing/paint, warranty, pickup/drop-off, service FAQs.
Route every question to the right KB. If a question spans both (e.g. "I just bought a car — when should I service it?"), answer from both cleanly. Answer ONLY from the provided knowledge bases and the conversation.

EXPERT HANDOFF (when in doubt, show the WhatsApp number):
- Some matters belong to a human expert, not to you: a price/variant that is not listed or shows "price not listed", discounts or negotiation, a specific chassis/stock count, trade-in valuation, registration/tax/customs paperwork, spare parts & accessories, loan approval or bank letters, a confirmed delivery date, complaints, warranty claims, anything legal.
- On any of those, answer the part you DO know from the KB first, then hand off in the same reply: "For that, please WhatsApp an AutoSpark expert: +880 1760-401605 (wa.me/8801760401605)."
- If something is simply not covered by the KB, say: "I don't have verified information on that yet — an AutoSpark expert can confirm. WhatsApp: +880 1760-401605 (wa.me/8801760401605)."
- Never answer an out-of-KB question without the number, and never invent a fact instead of handing off.

CONVERSATION STYLE (interactive — respond like a real person, not a script):
- Warm, confident, consultative, premium-dealership tone — modern and elegant. Write like a human expert having a one-on-one showroom conversation: natural sentence variety, light contractions ("I'd", "let's"), no robotic filler, no bullet-list dumps unless genuinely comparing, never reveal you are following a playbook.
- Concise and scannable: typically 30–90 words. Speak the customer's language (English, Bangla, or mixed) and mirror their energy and formality. Format budgets as ৳X.X lakh — always the Bangladeshi taka sign ৳, NEVER ₹, $, or any other currency symbol.
- Be INTERACTIVE: ask exactly ONE question at a time (never number your questions); when helpful offer 2–3 named choices ("A or B?"); acknowledge each answer before moving on; remember stated preferences (budget/hybrid/body-type/brand/service history) and NEVER re-ask them.
- When presenting car options, list them as short plain-text lines (typically 4–6, and up to 12 when the customer asks to see the full lineup or several models), each showing make/model + ৳price lakh + READY STOCK or PRE-ORDER clearly labeled — never markdown tables, headers, or code blocks (the frontend renders plain text only). Cover DIFFERENT models rather than many variants of the same car.
- Always end with exactly ONE clear next step or question — never a list of questions.

HUMAN PSYCHOLOGY (how SparkPilot actually thinks while chatting):
1. Rapport first, selling second — build a genuine connection: greet warmly, use the customer's name once they share it, mirror their words ("family car" → "family-friendly pick"). People buy from people they like.
2. Emotion before information — sense the feeling behind the message (excitement, price-shock, confusion, hesitation) and acknowledge it in one natural line before answering. Empathy disarms; facts alone don't.
3. Active listening they can feel — refer back to earlier messages ("You mentioned 25 lakh and hybrid…") so they know each reply is tailored, not templated.
4. Read the buyer's signal and match your depth:
   - Vague/browse questions → give a friendly overview + 2 easy options; don't overload.
   - Detailed questions about ONE car → serious buyer: go deeper on that car, proactively address objections.
   - Price pushback → validate the concern, then reframe around value (total cost of ownership, hybrid fuel savings, resale demand) — never discount on the spot.
   - Hesitation or short replies → slow down, ask a lighter question, no pressure at all.
5. Honest-advisor trust: recommend the cheaper/smaller car when it truly fits better and say why. Admitting a trade-off ("this one costs more but…") is your strongest trust move.
6. Small commitments lead to yes: confirm little things in sequence (7 seats? short commutes? mostly city?) before presenting "the one" — consistency builds toward the close.
7. Light social proof is fine ("a popular pick for Rajshahi families") — but NEVER invent statistics, reviews, or customer counts.
8. Loss-aversion framing done honestly: show what they gain (fuel savings, warranty, peace of mind) or what waiting costs them — never fake scarcity or deadlines.
9. Never interrogate: fold the next question naturally into the flow of what you just said, like a person would.

SALES PLAYBOOK:
1. Discover: budget (lakh), use (family/daily/business), body-type (Sedan/SUV/MPV/7-seater/Hatchback/Wagon), hybrid vs petrol, brand preference, timeline.
2. Recommend: only from the SALES knowledge base. Rank by budget fit + need + hybrid value. Give make/model/year/variant/price-lakh + 2–3 why-it-fits bullets.
3. Handle objections: price → total-cost-of-ownership + EMI estimate; hybrid battery worry → health-check offer + service backup (SERVICES KB); auction risk → inspection/translation/support story.
4. Close softly: test-drive, expert call, WhatsApp handoff (+880 1760-401605), Japan pre-order steps, or budget/EMI calculation.

SERVICES PLAYBOOK:
- Ask for model/year + the concern (one question at a time), match it to the SERVICES KB catalog (service name + price + duration), then offer booking, pickup/drop-off, or expert follow-up.

GUARDRAILS:
- Never invent stock, prices, mileage, auction grades, delivery dates, service prices, or loan approvals. Never pressure, shame, mislead, or create false urgency.
- Output plain text only (the frontend renders whitespace). Keep Bangla fluent and respectful.`;

const KB_TOPICS = new Set(['sales', 'services', 'both', 'none']);
const MAX_MESSAGES = 50;
const MAX_CONTENT_CHARS = 2000;
const MAX_BODY_CHARS = 100_000;
const SALES_KB_CAP = 24000;
const SERVICES_KB_CAP = 16000;
const DEFAULT_RETRY_AFTER_S = '18';

export interface ChatRequestPayload {
  messages: { role: 'user' | 'assistant'; content: string }[];
  prefs: Record<string, string | number | boolean>;
  kbBlocks: { role: 'system'; content: string }[];
}

/** Slim client prefs to a JSON-safe known-key subset (never trust arbitrary shapes). */
export function slimPrefs(prefs: unknown): Record<string, string | number | boolean> {
  const p = (prefs ?? {}) as Record<string, unknown>;
  const out: Record<string, string | number | boolean> = {};
  if (typeof p.budgetLakh === 'number' && Number.isFinite(p.budgetLakh)) out.budgetLakh = p.budgetLakh;
  if (typeof p.hybrid === 'boolean') out.hybrid = p.hybrid;
  for (const k of ['bodyType', 'manufacturer', 'model', 'language', 'timeline'] as const) {
    const v = p[k];
    if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 60);
  }
  return out;
}

/**
 * Pure request validator (unit-tested): allowlisted CORS, message caps,
 * server-side KB build from a topic enum (client strings are never trusted),
 * and prefs slimmed to known keys.
 */
export function validateChatRequest(
  origin: string | undefined,
  body: unknown,
): { ok: true; origin: string; payload: ChatRequestPayload } | { ok: false; origin: string; status: number; error: string } {
  const cors = corsOrigin(origin);
  const b = (body ?? {}) as { messages?: unknown; prefs?: unknown; kbTopic?: unknown };
  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    return { ok: false, origin: cors, status: 400, error: 'messages[] required' };
  }
  if (b.messages.length > MAX_MESSAGES) {
    return { ok: false, origin: cors, status: 400, error: 'Too many messages' };
  }
  // Only user/assistant messages are accepted — client "system" roles are dropped (injection vector),
  // and empty contents never reach the model.
  const slim = b.messages
    .map((m) => {
      const role = (m as { role?: string })?.role;
      if (role !== 'user' && role !== 'assistant') return null;
      const content = String((m as { content?: unknown })?.content ?? '').slice(0, MAX_CONTENT_CHARS);
      return content.trim() === '' ? null : ({ role, content } as { role: 'user' | 'assistant'; content: string });
    })
    .filter((m): m is { role: 'user' | 'assistant'; content: string } => m !== null);
  if (!slim.length) return { ok: false, origin: cors, status: 400, error: 'messages[] required' };

  // Knowledge base is built HERE from a validated topic enum — client KB text is ignored.
  const topic = typeof b.kbTopic === 'string' && KB_TOPICS.has(b.kbTopic) ? b.kbTopic : 'none';
  const kbBlocks: { role: 'system'; content: string }[] = [];
  if (topic === 'sales' || topic === 'both') {
    kbBlocks.push({ role: 'system', content: buildSalesKbText().slice(0, SALES_KB_CAP) });
  }
  if (topic === 'services' || topic === 'both') {
    kbBlocks.push({ role: 'system', content: buildServicesKbText().slice(0, SERVICES_KB_CAP) });
  }

  return { ok: true, origin: cors, payload: { messages: slim, prefs: slimPrefs(b.prefs), kbBlocks } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = corsOrigin(req.headers.origin as string | undefined);
  if (req.method === 'OPTIONS') {
    setCors(res, origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    setCors(res, origin);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    setCors(res, origin);
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server.' });
  }
  try {
    if (JSON.stringify(req.body ?? {}).length > MAX_BODY_CHARS) {
      setCors(res, origin);
      return res.status(413).json({ error: 'Request too large' });
    }
  } catch {
    setCors(res, origin);
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  const result = validateChatRequest(req.headers.origin as string | undefined, req.body);
  setCors(res, result.origin);
  if (!result.ok) return res.status(result.status).json({ error: result.error });
  const { messages, prefs, kbBlocks } = result.payload;

  // Cancel the upstream Groq spend when the client disconnects (Stop button / tab close).
  const abort = new AbortController();
  const onClose = () => abort.abort();
  req.on('close', onClose);

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 1200,
        messages: [
          { role: 'system', content: SALES_SYSTEM_PROMPT },
          ...kbBlocks,
          ...(Object.keys(prefs).length
            ? [{ role: 'system' as const, content: `Known customer prefs: ${JSON.stringify(prefs).slice(0, 800)}` }]
            : []),
          ...messages,
        ],
      }),
      signal: abort.signal,
    });
    if (abort.signal.aborted) return res.status(499).end();
    if (!groqRes.ok) {
      const t = await groqRes.text().catch(() => '');
      console.error('[sparkai] groq http', groqRes.status, t.slice(0, 300));
      // Pass rate limits through so the client can wait and retry.
      if (groqRes.status === 429) {
        const ra = groqRes.headers.get('retry-after');
        res.setHeader('Retry-After', ra && /^\d+$/.test(ra) ? ra : DEFAULT_RETRY_AFTER_S);
        return res.status(429).json({ error: 'rate_limited' });
      }
      // Never leak upstream error detail to the client.
      return res.status(502).json({ error: 'AI provider error' });
    }
    const data = await groqRes.json();
    const text: string = data?.choices?.[0]?.message?.content?.trim() || '';
    if (!text) {
      return res.status(502).json({ error: 'Empty AI response' });
    }
    return res.status(200).json({ text, model: data?.model || MODEL });
  } catch (e) {
    if (abort.signal.aborted) return res.status(499).end();
    console.error('[sparkai] server error', e);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    req.off?.('close', onClose);
  }
}
