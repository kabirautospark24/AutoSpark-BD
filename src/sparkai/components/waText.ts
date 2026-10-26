import { SPARKPILOT_CONFIG, normalizeWhatsApp } from '../config';

/**
 * The expert number as SparkPilot (and the live model) may spell it: Latin or
 * Bangla digits with any spacing — "+880 1760-401605", "01760401605",
 * "01760) 401605", "৮৮০ ১৭৬০-৪০১৬০৫" — plus wa.me / whatsapp.com links.
 * Built from SPARKPILOT_CONFIG so a changed number is picked up automatically.
 */
const DIGIT = '[0-9\u0966-\u096F\u09E6-\u09EF]'; // Latin + South-Asian (Bangla) digits
const SEP = '[\\s.\\-\\u2013\\u2014()\\u0964\\u0965]*'; // spacing/punctuation allowed between digits
/** One position of the number: its Latin digit or the Bangla equivalent (8 or ৮). */
const bn = (d: string) => String.fromCharCode(d.charCodeAt(0) + 0x09e6 - 0x30);
const join = (s: string) => s.split('').map((d) => `[${d}${bn(d)}]`).join(SEP);

const EXPERT = SPARKPILOT_CONFIG.whatsappNumber; // 8801760401605 (E.164)
const COUNTRY = EXPERT.startsWith('880') ? EXPERT.slice(0, 3) : ''; // 880
const NATIONAL = COUNTRY ? EXPERT.slice(COUNTRY.length) : EXPERT; // 1760401605
const LOCAL = NATIONAL.startsWith('0') ? NATIONAL : `0${NATIONAL}`; // 01760401605 (as dialled)
const ZERO = join('0'); // trunk 0, Latin or Bangla

// 880 1760-401605 (with +/00 prefix) | 01760401605 (local) | 1760-401605 (bare tail)
const PHONE_BRANCHES = [
  COUNTRY ? `(?:\\+|${ZERO}${ZERO})?${join(COUNTRY)}${SEP}${ZERO}?${join(NATIONAL)}` : '',
  join(LOCAL),
  join(NATIONAL),
].filter(Boolean);

/** Expert number in any written form; never a partial run of digits. */
const WA_PHONE_SRC = `(?<!${DIGIT})(?:${PHONE_BRANCHES.join('|')})(?!${DIGIT})`;
const WA_URL_SRC = String.raw`(https?:\/\/)?(?:wa\.me\/|(?:api\.|web\.)?whatsapp\.com\/send\?phone=)(\d+)\S*`;

/** wa.me deep link for a matched number/URL: opens WhatsApp directly (app on mobile, web on desktop). */
function waHref(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (d === EXPERT || d === NATIONAL || d === LOCAL) return `https://wa.me/${EXPERT}`;
  return `https://wa.me/${normalizeWhatsApp(d) ?? EXPERT}`;
}

export interface WaSegment { href: string; label: string }
export interface TextSegment { value: string }

/**
 * Split an assistant reply into plain-text runs and clickable WhatsApp handoffs.
 * When the message spells out the expert number, the number itself becomes the
 * link (the redundant wa.me URL stays plain text) so each handoff is one button.
 */
export function segmentMessage(text: string): (WaSegment | TextSegment)[] {
  const find = (src: string, href: (m: RegExpExecArray) => string) => {
    const re = new RegExp(src, 'gi');
    const hits: { start: number; end: number; href: string; label: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) hits.push({ start: m.index, end: m.index + m[0].length, href: href(m), label: m[0] });
    return hits;
  };
  const urls = find(WA_URL_SRC, (m) => waHref(m[2] ?? ''));
  // A number inside a wa.me link is already covered by that link.
  const phones = find(WA_PHONE_SRC, () => `https://wa.me/${EXPERT}`).filter(
    (p) => !urls.some((u) => p.start >= u.start && p.end <= u.end),
  );
  // Spell-out number wins: one button per handoff, the wa.me text stays plain.
  const picks = (phones.length ? phones : urls).sort((a, b) => a.start - b.start);

  const out: (WaSegment | TextSegment)[] = [];
  let last = 0;
  for (const p of picks) {
    if (p.start > last) out.push({ value: text.slice(last, p.start) });
    out.push({ href: p.href, label: p.label });
    last = p.end;
  }
  if (last < text.length) out.push({ value: text.slice(last) });
  return out;
}
