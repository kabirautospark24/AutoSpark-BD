import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X, Maximize2, MessageCircle, RotateCcw, ChevronDown, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { respond, isAbortError } from '../services/ai';
import { vehiclePriceLabel } from '../data/demo';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { SPARKPILOT_CONFIG, buildWhatsAppUrl } from '../config';
import { SparkMark } from './Logo';
import { DemoBadge } from './ui';
import { RevealText } from './ui';
import { WelcomeCard } from './WelcomeCard';
import { SPARKPILOT_OPEN_EVENT } from './openSparkPilot';
import type { ChatMessage, CustomerPreferences } from '../types';

const uid = () => Math.random().toString(36).slice(2, 10);
const SEED: ChatMessage = {
  id: 'seed', role: 'assistant', createdAt: Date.now(), kind: 'welcome',
  text: "Hi, I'm SparkPilot. I know everything about AutoSpark car sales and car services. What would you like to know?",
};

/**
 * Floating SparkPilot assistant: fixed on the RIGHT side of every page.
 * Full-screen sheet on phones, docked card from sm up; full experience at /sparkpilot.
 */
export function SparkPilotWidget() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([SEED]);
  const [prefs, setPrefs] = useState<CustomerPreferences>({});
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(false);
  const [showJump, setShowJump] = useState(false);
const [aiLive, setAiLive] = useState<boolean | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const stickRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // Pin the sheet to the visual viewport while the soft keyboard is open (iOS).
  const vv = useVisualViewport(open);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message?: string } | undefined;
      setOpen(true);
      setUnread(false);
      if (detail?.message) void sendRef.current(detail.message);
    };
    window.addEventListener(SPARKPILOT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(SPARKPILOT_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, busy, open]);

  // Open/close side effects: body scroll lock, focus in/out, Esc to close
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab' || !sectionRef.current) return;
      const focusable = sectionRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Restore focus to the launcher after close (launcher remounts)
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open) { wasOpenRef.current = true; return; }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      const el = document.getElementById('sparkpilot-launcher');
      if (el instanceof HTMLElement) el.focus({ preventScroll: true });
    }
  }, [open]);

  const send = useCallback(async (raw: string, opts?: { history?: ChatMessage[] }) => {
    const text = raw.trim();
    if (!text || busy) return;
    setBusy(true);
    const history = opts?.history ?? messages;
    setMessages((p) => [...p, { id: uid(), role: 'user', text, createdAt: Date.now(), status: 'sent' }]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const r = await respond(history, text, prefs, { signal: controller.signal });
      setAiLive(r.isLive !== false);
      setPrefs((p) => ({ ...p, ...r.prefs }));
      setMessages((p) => [...p, { id: uid(), role: 'assistant', text: r.text, createdAt: Date.now(), status: 'sent', vehicles: r.vehicles }]);
      if (!open) setUnread(true);
    } catch (e) {
      // User pressed Stop → end the turn silently; real failures get a retry UI.
      if (!isAbortError(e)) {
        setMessages((p) => [...p, { id: uid(), role: 'assistant', text: 'Sorry, SparkPilot failed to respond. Please retry; nothing was submitted.', createdAt: Date.now(), status: 'failed' }]);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [busy, messages, prefs, open]);

  const sendRef = useRef(send);
  sendRef.current = send;

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }, []);

  /** Retry a failed turn: drop the failed reply + its prompt, re-run fresh. */
  const retry = (m: ChatMessage) => {
    if (busy) return;
    const idx = messages.findIndex((x) => x.id === m.id);
    if (idx < 0) return;
    const prior = messages.slice(0, idx);
    let lastUserIdx = -1;
    for (let i = prior.length - 1; i >= 0; i--) { if (prior[i].role === 'user') { lastUserIdx = i; break; } }
    if (lastUserIdx < 0) { setMessages(prior); return; }
    const lastUser = prior[lastUserIdx];
    const base = prior.filter((_, i) => i !== lastUserIdx);
    setMessages(base);
    void send(lastUser.text, { history: base });
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const stuck = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    stickRef.current = stuck;
    setShowJump(!stuck && el.scrollHeight - el.clientHeight > 240);
  };

  const jump = () => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    stickRef.current = true;
    setShowJump(false);
  };

  return (
    <>
      {/* Floating entry point: RIGHT side, above safe area */}
      {!open && (
        <motion.button
          id="sparkpilot-launcher"
          initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => { setOpen(true); setUnread(false); }}
          aria-label="Open SparkPilot assistant"
          className="fixed z-toast right-4 sm:right-6 rounded-full p-[3px] shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          style={{ bottom: 'calc(env(safe-area-inset-bottom,0px) + 16px)', background: 'linear-gradient(135deg,#22D3EE,#2563EB,#A16207)' }}
        >
          <span className={`relative flex items-center gap-2 rounded-full pl-1.5 pr-4 py-1.5 ${dark ? 'bg-[#0B1322]' : 'bg-white'}`}>
            <SparkMark size={36} />
            <span className="text-left leading-tight">
              <span className={`block text-[13px] font-extrabold ${dark ? 'text-white' : 'text-slate-900'}`}>Ask SparkPilot</span>
              <span className="block text-[10px] font-medium opacity-60">Sales &amp; service expert</span>
            </span>
            {unread && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" aria-label="New message" />}
          </span>
        </motion.button>
      )}

      {/* Full-screen sheet on phones · docked card from sm up */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-modal bg-black/50 hidden sm:block sm:bg-black/30"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.section
              ref={sectionRef}
              role="dialog"
              aria-modal="true"
              aria-label="SparkPilot assistant"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0.6, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
              transition={{ type: 'tween', duration: 0.22 }}
              className={`fixed inset-0 z-modal flex flex-col overflow-hidden ${
                dark ? 'bg-[#0B1322] text-slate-100' : 'bg-white text-slate-900'
              } sm:inset-auto sm:right-5 sm:bottom-5 sm:w-[420px] sm:h-[min(640px,calc(100dvh-3rem))] sm:rounded-2xl sm:border shadow-2xl ${dark ? 'sm:border-white/10' : 'sm:border-slate-200'}`}
              style={vv ? { top: vv.top, height: vv.h } : undefined}
            >
              <header className={`flex items-center gap-2.5 px-3 sm:px-4 py-2.5 border-b pt-[max(env(safe-area-inset-top,0px),0.625rem)] sm:pt-2.5 ${dark ? 'border-white/10' : 'border-slate-200'}`}>
                <SparkMark size={30} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm leading-tight">SparkPilot <span className="font-medium opacity-50 text-xs">by AutoSpark</span></p>
                  <p className="text-[11px] opacity-60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online · AI expert
                  </p>
                </div>
                <span className="hidden xs:inline-flex"><DemoBadge isLive={aiLive !== false} /></span>
                <Link to="/sparkpilot" aria-label="Open full SparkPilot page" className="hidden sm:inline-flex p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 min-w-[44px] min-h-[44px] items-center justify-center" onClick={() => setOpen(false)}>
                  <Maximize2 className="w-4 h-4" />
                </Link>
                <button aria-label="Close SparkPilot" onClick={() => setOpen(false)} className="p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 min-w-[44px] min-h-[44px] inline-flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="relative flex-1 min-h-0">
                <div
                  ref={listRef}
                  onScroll={onScroll}
                  className="absolute inset-0 overflow-y-auto overscroll-contain px-3.5 py-3 space-y-3"
                  role="log"
                  aria-live="polite"
                  aria-relevant="additions text"
                  aria-label="Conversation messages"
                >
                  {messages.map((m) => (
                    m.kind === 'welcome' ? (
                      <WelcomeCard key={m.id} compact onAsk={(t) => void send(t)} reduceMotion={reduceMotion} />
                    ) : (
                    <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'assistant' && <SparkMark size={26} />}
                      <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-[14px] leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-md'
                          : dark ? 'bg-white/[0.06] border border-white/10 rounded-bl-md' : 'bg-slate-100 border border-slate-200 rounded-bl-md'
                      }`}>
                        <p>{m.role === 'assistant' && m.status !== 'failed' ? <RevealText text={m.text} reduce={reduceMotion} /> : m.text}</p>
                        {m.vehicles && m.vehicles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {m.vehicles.map((v) => (
                              <button
                                key={v.id}
                                onClick={() => void send(`Tell me more about the ${v.model} ${v.variant}.`)}
                                className={`block w-full text-left text-xs font-semibold rounded-lg px-2.5 min-h-[44px] border ${dark ? 'border-cyan-500/30 bg-cyan-500/10' : 'border-cyan-600/30 bg-cyan-50'}`}
                              >
                                {v.model} · {vehiclePriceLabel(v)} · {v.stock === 'ready' ? 'Ready' : 'Pre-order'} <span className="opacity-60 font-normal">· verify with expert</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {m.status === 'failed' && (
                          <button onClick={() => retry(m)} className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold text-red-500 min-h-[44px] px-2 -mx-2"><RotateCcw className="w-3 h-3" /> Retry</button>
                        )}
                      </div>
                    </div>
                    )
                  ))}
                  {busy && (
                    <div className="flex gap-2" aria-label="SparkPilot is typing">
                      <SparkMark size={26} />
                      <div className={`rounded-2xl px-4 py-3 flex gap-1.5 ${dark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                        {[0, 1, 2].map((i) => (
                          <motion.span key={i} className="w-2 h-2 rounded-full bg-cyan-500" animate={reduceMotion ? {} : { opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showJump && !busy && (
                    <motion.button
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      onClick={jump}
                      aria-label="Jump to latest messages"
                      className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 rounded-full px-3.5 min-h-[44px] text-xs font-semibold shadow-lg border transition ${dark ? 'bg-[#0E1526] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                    >
                      <ChevronDown className="w-4 h-4 text-cyan-500" /> Latest
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <div className="px-3 pb-1 flex gap-1.5 overflow-x-auto scrollbar-hide" role="group" aria-label="Quick replies">
                {['Find my ideal car', 'Car services & pricing', 'Talk to expert'].map((q) => (
                  <button key={q} onClick={() => void send(q)} disabled={busy} className={`shrink-0 text-xs font-semibold rounded-full border px-4 min-h-[44px] disabled:opacity-40 ${dark ? 'border-white/10 hover:bg-white/5' : 'border-slate-300 hover:bg-slate-100'}`}>{q}</button>
                ))}
              </div>

              <form
                className={`px-3 pt-2 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] sm:pb-3 border-t ${dark ? 'border-white/10' : 'border-slate-200'}`}
                onSubmit={(e) => { e.preventDefault(); void send(input); }}
              >
                <div className={`flex items-end gap-2 rounded-xl border px-2 py-1.5 ${dark ? 'bg-white/[0.04] border-white/10 focus-within:border-cyan-500/50' : 'bg-slate-50 border-slate-200 focus-within:border-cyan-500'}`}>
                  <label htmlFor="sparkai-widget-input" className="sr-only">Message SparkPilot (Enter to send, Shift+Enter for new line)</label>
                  <textarea
                    id="sparkai-widget-input"
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(input); } }}
                    placeholder="Ask about this product…"
                    rows={1}
                    disabled={busy}
                    autoComplete="off"
                    enterKeyHint="send"
                    className="flex-1 bg-transparent resize-none outline-none text-base px-2 py-2 placeholder:opacity-50 min-w-0 max-h-28"
                    onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 112) + 'px'; }}
                  />
                  {busy
                    ? <button type="button" aria-label="Stop response" onClick={stop} className="p-2.5 rounded-lg bg-red-500/15 text-red-500 min-w-[44px] min-h-[44px] flex items-center justify-center"><Square className="w-4 h-4" /></button>
                    : <button type="submit" aria-label="Send message" disabled={!input.trim() || busy} className="p-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-40 min-w-[44px] min-h-[44px] flex items-center justify-center"><Send className="w-4 h-4" /></button>}
                </div>
                <div className="flex items-center justify-between mt-1.5 px-0.5 gap-2">
                  <Link to="/sparkpilot" onClick={() => setOpen(false)} className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 hover:underline min-h-[32px] inline-flex items-center">Open full SparkPilot →</Link>
                  <a href={buildWhatsAppUrl('Hello AutoSpark! I need help with a product.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold opacity-70 hover:opacity-100 min-h-[32px]">
                    <MessageCircle className="w-3 h-3" /> {SPARKPILOT_CONFIG.phoneDisplay}
                  </a>
                </div>
              </form>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
