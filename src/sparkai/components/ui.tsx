import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { segmentMessage, type WaSegment } from './waText';

export { segmentMessage } from './waText';

/** Mock handoff lines are wrapped in _emphasis_; bubbles render plain text. */
const stripEmphasis = (t: string) => t.replace(/(^|\n)_(.+?)_(?=\n|$)/g, '$1$2');

export const useDark = () => useTheme().theme === 'dark';

export function SButton({ children, variant = 'primary', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'outline'; children: ReactNode }) {
  const dark = useDark();
  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-2 min-h-[44px] px-5 text-sm active:scale-[0.98] disabled:opacity-50';
  const styles =
    variant === 'primary'
      ? 'text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-blue-900/30'
      : variant === 'outline'
        ? dark ? 'border border-white/15 text-white hover:bg-white/5' : 'border border-slate-300 text-slate-900 hover:bg-slate-100'
        : dark ? 'text-cyan-300 hover:bg-white/5' : 'text-blue-700 hover:bg-slate-100';
  return <button {...rest} className={`${base} ${styles} ${rest.className ?? ''}`}>{children}</button>;
}

export function SInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const dark = useDark();
  return (
    <input
      {...props}
      className={`w-full rounded-xl px-4 min-h-[44px] text-base md:text-sm border outline-none focus:ring-2 focus:ring-cyan-400 ${dark ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900'} ${props.className ?? ''}`}
    />
  );
}

/** One tap on the number opens WhatsApp with the AutoSpark expert. */
export function WaLink({ href, label }: WaSegment) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open WhatsApp to chat with an AutoSpark expert (${label})`}
      className="mx-0.5 my-0.5 inline-flex min-h-[28px] items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2 align-middle font-bold text-emerald-600 transition hover:bg-emerald-500/25 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
    >
      <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="whitespace-nowrap">{label}</span>
    </a>
  );
}

/**
 * Agentic stream-style reveal: assistant words cascade in like a live model
 * is typing them. Pure CSS (single mount animation), screen-reader safe,
 * the full text is in the DOM from the first frame. Skipped under reduced motion.
 * Expert WhatsApp numbers inside the reply render as tappable wa.me links.
 */
export function RevealText({ text, reduce }: { text: string; reduce?: boolean }) {
  if (!text) return <>{text}</>;
  const segments = segmentMessage(stripEmphasis(text));
  let word = -1;
  const delay = () => `${Math.min((word += 1) * 14, 700)}ms`;
  const nodes: ReactNode[] = [];
  segments.forEach((s, i) => {
    if ('href' in s) {
      nodes.push(
        reduce
          ? <WaLink key={`w${i}`} {...s} />
          : <span key={`w${i}`} className="reveal-word" style={{ animationDelay: delay() }}><WaLink {...s} /></span>,
      );
      return;
    }
    s.value.split(/(\s+)/).filter((seg) => seg !== '').forEach((seg, j) => {
      if (/^\s+$/.test(seg)) {
        nodes.push(seg);
      } else if (reduce) {
        nodes.push(seg);
      } else {
        nodes.push(
          <span key={`w${i}-${j}`} className="reveal-word" style={{ animationDelay: delay() }}>{seg}</span>,
        );
      }
    });
  });
  return <>{nodes}</>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  const dark = useDark();
  return (
    <div className={`rounded-2xl border shadow-sm ${dark ? 'bg-[#0E1526]/90 border-white/10' : 'bg-white border-slate-200'} ${className}`}>
      {children}
    </div>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[11px] font-bold px-2.5 py-1 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live · AI expert
    </span>
  );
}

/** @deprecated Use LiveBadge: kept for backwards compatibility. */
export const DemoBadge = LiveBadge;
