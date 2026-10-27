// Central SparkPilot business configuration. No secrets here.
export const SPARKPILOT_CONFIG = {
  productName: 'SparkPilot',
  attribution: 'by AutoSpark',
  demoMode: false,
  whatsappNumber: '8801760401605',
  phoneDisplay: '+880 1760-401605',
  showroom: 'AutoSpark, Rajshahi, Bangladesh',
  hours: 'Sat–Thu, 9:00–18:00',
  currency: 'BDT' as const,
} as const;

export function buildWhatsAppUrl(message: string, number = SPARKPILOT_CONFIG.whatsappNumber): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Normalize + validate a WhatsApp number. Returns E.164 digits or null. */
export function normalizeWhatsApp(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '');
  const d = digits.replace(/^00/, '');
  if (/^8801[3-9]\d{8}$/.test(d)) return d;          // Bangladesh mobile
  if (/^01[3-9]\d{8}$/.test(d)) return `880${d.slice(1)}`; // local BD format
  if (/^\d{7,15}$/.test(d)) return d;                 // other countries
  return null;
}

// Assistant personality lives ONLY on the server (api/sparkai/chat.ts SALES_SYSTEM_PROMPT,
// mirrored by server/dev-server.js) — an earlier client copy drifted and was removed.

/** Groq runtime config (key stays server-side; frontend only calls /api/sparkai/chat). */
export const SPARKPILOT_GROQ = {
  endpoint: '/api/sparkai/chat',
  model: 'openai/gpt-oss-20b',
  fallbackModel: 'qwen/qwen3.8-27b',
} as const;
