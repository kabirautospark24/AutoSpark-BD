import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Send, Copy, RotateCcw, Square, Menu, X, Sun, Moon,
  Car, GitCompareArrows, Ship, Wallet, Wrench, Headset, Sparkles, Trash2, Check,
  ArrowLeft, SlidersHorizontal, ChevronDown,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ChatMessage, Conversation, ConversationIntent, DemoVehicle } from '../types';
import { pickVehicles } from '../data/demo';
import { CATALOG_MAKES } from '../data/catalog';
import { respond, isAbortError } from '../services/ai';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { SPARKPILOT_CONFIG } from '../config';
import { SparkPilotLogo, SparkMark } from './Logo';
import { SButton, Card, DemoBadge, useDark, RevealText } from './ui';
import { WelcomeCard } from './WelcomeCard';
import { VehicleCard, VehicleComparison, ExpertHandoff } from './Vehicles';
import { BudgetPlanner } from './Finance';
import { LeadForm } from './LeadForm';

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => Date.now();

const GREETING: ChatMessage = {
  id: 'greet', role: 'assistant', createdAt: now(), kind: 'welcome',
  text: "Hi, I'm SparkPilot. I know everything about AutoSpark car sales and car services. What would you like to know?",
};

function newConversation(): Conversation {
  return { id: uid(), title: 'New conversation', createdAt: now(), messages: [{ ...GREETING, id: uid() }], preferences: {} };
}

const NAV = [
  { icon: Plus, label: 'New conversation', act: 'new' },
  { icon: Car, label: 'Explore vehicles', act: 'explore' },
  { icon: GitCompareArrows, label: 'Compare cars', act: 'compare' },
  { icon: Ship, label: 'Japan pre-order', act: 'preorder' },
  { icon: Wallet, label: 'Financing assistance', act: 'budget' },
  { icon: Wrench, label: 'Service center', act: 'service' },
  { icon: Headset, label: 'Contact an expert', act: 'expert' },
] as const;

function intentMessage(intent: ConversationIntent): string {
  switch (intent) {
    case 'explore': return 'Show me Japanese cars under 30 lakh.';
    case 'compare': return 'Compare the Axio Hybrid vs Honda Vezel for me.';
    case 'budget': return 'Help me estimate my budget around 25 lakh.';
    case 'preorder': return 'I want to pre-order a car from Japan.';
    case 'service': return 'I need a hybrid battery health check / service.';
    case 'expert': return 'I would like to talk to an AutoSpark expert.';
    default: return 'I need a family car within my budget.';
  }
}

export function SparkPilotApp() {
  const { theme, toggleTheme } = useTheme();
  const dark = useDark();
  const [convs, setConvs] = useState<Conversation[]>(() => {
    try {
      const raw = sessionStorage.getItem('sparkai-convs');
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p) && p.length && p.every((c) => c && typeof c.id === 'string' && Array.isArray(c.messages))) return p;
      }
    } catch { /* session-only */ }
    return [newConversation()];
  });
  const [activeId, setActiveId] = useState(() => convs[0]?.id);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [compare, setCompare] = useState<DemoVehicle[]>([]);
  const [panel, setPanel] = useState<'discover' | 'compare' | 'budget' | 'expert'>('discover');
  const [sidebar, setSidebar] = useState(false);
  const [tools, setTools] = useState(false); // mobile discovery/tools bottom sheet
  const [copied, setCopied] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ maxBudgetLakh?: number; hybrid?: boolean; make?: string }>({});
  const [preorderStep, setPreorderStep] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [aiLive, setAiLive] = useState<boolean | null>(null);
  const [showJump, setShowJump] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toolsRef = useRef<HTMLButtonElement>(null);
  // Pin the app to the visual viewport while the soft keyboard is open (iOS).
  const vv = useVisualViewport(true);

  const conv = convs.find((c) => c.id === activeId) ?? convs[0];
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    try { sessionStorage.setItem('sparkai-convs', JSON.stringify(convs.slice(0, 8))); } catch { /* non-sensitive only; never lead PII */ }
  }, [convs]);

  useEffect(() => {
    if (stickRef.current && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [conv?.messages.length, busy]);

  // Escape closes mobile overlays; locks background scroll while open
  useEffect(() => {
    if (!sidebar && !tools) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSidebar(false); setTools(false); }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [sidebar, tools]);

  // Return focus to the tools trigger when its sheet closes (not on first mount)
  const toolsWasOpen = useRef(false);
  useEffect(() => {
    if (tools) { toolsWasOpen.current = true; return; }
    if (toolsWasOpen.current && toolsRef.current) {
      toolsWasOpen.current = false;
      toolsRef.current.focus({ preventScroll: true });
    }
  }, [tools]);

  const patch = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setConvs((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  /**
   * send() optionally takes a UI base + AI history so Retry can re-run a
   * failed turn without duplicating messages (stale-closure free).
   */
  const send = useCallback(async (text: string, opts?: { uiBase?: ChatMessage[]; aiHistory?: ChatMessage[] }) => {
    const clean = text.trim();
    if (!clean || busy || !conv) return;
    setBusy(true);
    const userMsg: ChatMessage = { id: uid(), role: 'user', text: clean, createdAt: now(), status: 'sent' };
    const base = opts?.uiBase ?? conv.messages;
    patch(conv.id, (c) => ({
      ...c,
      title: c.messages.length <= 1 ? clean.slice(0, 42) : c.title,
      messages: [...base, userMsg],
    }));
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const r = await respond(opts?.aiHistory ?? conv.messages, clean, conv.preferences, { signal: controller.signal });
      setAiLive(r.isLive !== false);
      const asst: ChatMessage = { id: uid(), role: 'assistant', text: r.text, createdAt: now(), status: 'sent', vehicles: r.vehicles };
      patch(conv.id, (c) => ({ ...c, preferences: { ...c.preferences, ...r.prefs }, messages: [...c.messages, asst] }));
      if (r.followUp === 'compare' && r.vehicles?.length) setCompare(r.vehicles.slice(0, 2));
      if (r.followUp === 'lead' || r.intent === 'expert' || r.followUp === 'preorder' || r.followUp === 'service') setPanel('expert');
      if (r.intent === 'budget') setPanel('budget');
    } catch (e) {
      // User pressed Stop: don't surface a failure; the turn just ends.
      if (!isAbortError(e)) {
        patch(conv.id, (c) => ({ ...c, messages: [...c.messages, { id: uid(), role: 'assistant', text: 'Something went wrong reaching SparkPilot. Please retry. Nothing was submitted.', createdAt: now(), status: 'failed' }] }));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [busy, conv, patch]);

  /** Real Stop: aborts the in-flight request, no phantom reply afterwards. */
  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }, []);

  const retry = (m: ChatMessage) => {
    if (!conv || busy) return;
    const idx = conv.messages.findIndex((x) => x.id === m.id);
    if (idx < 0) return;
    const prior = conv.messages.slice(0, idx);
    let lastUserIdx = -1;
    for (let i = prior.length - 1; i >= 0; i--) { if (prior[i].role === 'user') { lastUserIdx = i; break; } }
    if (lastUserIdx < 0) { patch(conv.id, (c) => ({ ...c, messages: c.messages.filter((x) => x.id !== m.id) })); return; }
    const lastUser = prior[lastUserIdx];
    // Drop the failed reply + its triggering prompt, then re-run the turn fresh.
    const uiBase = prior.filter((_, i) => i !== lastUserIdx);
    const aiHistory = uiBase;
    void send(lastUser.text, { uiBase, aiHistory });
  };

  const discovered = useMemo(() => {
    const fromChat = conv.messages.flatMap((m) => m.vehicles ?? []);
    // Fallback: one best offer per model across the full KB catalog.
    const base = fromChat.length ? fromChat : pickVehicles({}, 12);
const seen = new Set<string>();
    return base.filter((v) => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      if (filters.maxBudgetLakh != null && v.budgetLakh > filters.maxBudgetLakh) return false;
      if (filters.hybrid === true && !v.hybrid) return false;
      if (filters.make && v.make !== filters.make) return false;
      return true;
    });
  }, [conv.messages, filters]);

  const askVehicle = (v: DemoVehicle) => send(`Tell me more about the ${v.model} ${v.year} ${v.variant}.`);
  const expertVehicle = (v: DemoVehicle) => { setPanel('expert'); setToast(`Expert panel opened for ${v.model}.`); setTimeout(() => setToast(null), 2500); };

  const shell = dark ? 'bg-[#070C18] text-slate-100' : 'bg-slate-100 text-slate-900';
  const panelBg = dark ? 'bg-[#0B1322]/95 border-white/10' : 'bg-white border-slate-200';
  const hairline = { borderColor: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)' };

  const sidebarBody = (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <SparkPilotLogo dark={dark} />
      <SButton onClick={() => { const n = newConversation(); setConvs((p) => [n, ...p]); setActiveId(n.id); setSidebar(false); }}>
        <Plus className="w-4 h-4" /> New conversation
      </SButton>
      <nav aria-label="SparkPilot sections" className="space-y-1">
        {NAV.map((n) => (
          <button
            key={n.act}
            onClick={() => { if (n.act === 'new') { const c = newConversation(); setConvs((p) => [c, ...p]); setActiveId(c.id); } else { void send(intentMessage(n.act as ConversationIntent)); if (n.act === 'compare') setPanel('compare'); } setSidebar(false); }}
            className={`w-full flex items-center gap-3 px-3.5 rounded-xl min-h-[44px] text-sm font-medium transition ${dark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
          >
            <n.icon className="w-4 h-4 text-cyan-500" /> {n.label}
          </button>
        ))}
      </nav>
      {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="mt-auto space-y-3 min-h-0">
        <p className="text-xs font-bold uppercase tracking-wider opacity-50 px-1">History (session only)</p>
        {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="space-y-1 max-h-44 overflow-y-auto" role="list">
          {convs.map((c) => (
            {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} key={c.id} role="listitem" className={`group flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${c.id === activeId ? 'bg-cyan-500/15 font-semibold' : ''}`}>
              <button onClick={() => { setActiveId(c.id); setSidebar(false); }} className="flex-1 text-left truncate min-h-[40px]">{c.title}</button>
              {convs.length > 1 && (
                <button
                  aria-label={`Delete ${c.title}`}
                  onClick={() => { setConvs((p) => { const rest = p.filter((x) => x.id !== c.id); if (c.id === activeId) setActiveId(rest[0]?.id ?? ''); return rest.length ? rest : [newConversation()]; }); }}
                  className="p-2 min-w-[36px] min-h-[36px] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="flex items-center justify-between pt-2 border-t border-current/10" style={{ borderColor: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)' }}>
          <button onClick={toggleTheme} aria-label="Toggle theme" className="inline-flex items-center gap-2 text-xs font-semibold px-3 min-h-[44px] rounded-full border border-current/20">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <span className="text-[11px] opacity-50">{SPARKPILOT_CONFIG.hours}</span>
        </div>
      </div>
    </div>
  );

  const panelBody = (
    <div className="flex flex-col min-h-0 flex-1 gap-3">
      {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="flex gap-1 p-1 rounded-full bg-black/5 dark:bg-white/5" role="tablist" aria-label="Panel tabs">
        {(['discover', 'compare', 'budget', 'expert'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={panel === t} onClick={() => setPanel(t)} className={`flex-1 text-[11px] font-bold uppercase tracking-wide rounded-full py-2.5 min-h-[44px] capitalize ${panel === t ? 'bg-cyan-500 text-white' : 'opacity-60 hover:opacity-100'}`}>{t}</button>
        ))}
      </div>

      {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        {panel === 'discover' && (
          {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="space-y-3">
            {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="grid grid-cols-2 gap-2 text-xs">
              <label className="font-semibold">Max budget (lakh)<select value={filters.maxBudgetLakh ?? ''} onChange={(e) => setFilters((f) => ({ ...f, maxBudgetLakh: e.target.value ? Number(e.target.value) : undefined }))} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2.5 min-h-[44px] text-base"><option value="">Any</option><option value="25">≤ 25</option><option value="30">≤ 30</option><option value="35">≤ 35</option><option value="45">≤ 45</option><option value="55">≤ 55</option><option value="75">≤ 75</option><option value="150">≤ 150</option></select></label>
              <label className="font-semibold">Make<select value={filters.make ?? ''} onChange={(e) => setFilters((f) => ({ ...f, make: e.target.value || undefined }))} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2.5 min-h-[44px] text-base"><option value="">All</option>{CATALOG_MAKES.map((m) => <option key={m}>{m}</option>)}</select></label>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer min-h-[44px]"><input type="checkbox" checked={filters.hybrid === true} onChange={(e) => setFilters((f) => ({ ...f, hybrid: e.target.checked ? true : undefined }))} className="w-4 h-4 accent-cyan-500" /> Hybrid only</label>
            {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="space-y-2.5">
              {discovered.map((v) => <VehicleCard key={v.id} v={v} onAsk={askVehicle} onCompare={(x) => { setCompare((p) => [...p.filter((y) => y.id !== x.id), x].slice(-3)); setPanel('compare'); }} onExpert={expertVehicle} />)}
              {!discovered.length && <p className="text-xs opacity-60">No matches. Widen the budget or clear filters.</p>}
            </div>
            {(conv.preferences.budgetLakh || conv.preferences.bodyType) && (
              <Card className="p-3 text-xs"><p className="font-bold mb-1">Your preferences (this chat)</p>
                <p className="opacity-70">{[conv.preferences.budgetLakh && `≤ ${conv.preferences.budgetLakh} lakh`, conv.preferences.hybrid && 'Hybrid', conv.preferences.bodyType, conv.preferences.manufacturer].filter(Boolean).join(' · ') || '-'}</p>
              </Card>
            )}
          </div>
        )}
        {panel === 'compare' && <VehicleComparison items={compare} onRemove={(id) => setCompare((p) => p.filter((x) => x.id !== id))} />}
        {panel === 'budget' && <BudgetPlanner onExpert={(s) => { setPanel('expert'); void send(`Please have an expert review this plan: ${s}.`); }} />}
        {panel === 'expert' && (
          {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="space-y-4">
            <ExpertHandoff interest={conv.preferences.bodyType ?? conv.title} />
            <PreorderMini step={preorderStep} setStep={setPreorderStep} onSend={send} />
            <LeadForm key={conv.id} interestDefault={conv.title === 'New conversation' ? '' : conv.title} onDone={(ref) => { setToast(`Lead ${ref} submitted.`); setTimeout(() => setToast(null), 3000); }} />
            <p className="text-[11px] opacity-50">{SPARKPILOT_CONFIG.productName} {SPARKPILOT_CONFIG.attribution} · {SPARKPILOT_CONFIG.showroom} · {SPARKPILOT_CONFIG.hours}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`h-[100dvh] overflow-hidden flex flex-col pt-[env(safe-area-inset-top,0px)] ${shell}`}
      style={vv ? { position: 'fixed', left: 0, right: 0, top: vv.top, height: vv.h, width: '100%' } : undefined}
    >
      {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>}


      {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="w-full max-w-[1440px] mx-auto flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)] gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 lg:grid-cols-[250px_minmax(0,1fr)_340px]">
        {/* Sidebar (desktop) */}
        <aside className={`hidden lg:flex flex-col rounded-2xl border p-4 min-h-0 ${panelBg}`} aria-label="SparkPilot navigation">{sidebarBody}</aside>

        {/* Mobile nav drawer */}
        <AnimatePresence>
          {sidebar && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-modal bg-black/60 lg:hidden" onClick={() => setSidebar(false)}>
              <motion.div
                initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ duration: reduceMotion ? 0 : 0.25 }}
                className={`h-full w-[86vw] max-w-[300px] p-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] overflow-y-auto ${dark ? 'bg-[#0B1322]' : 'bg-white'}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog" aria-modal="true" aria-label="SparkPilot menu"
              >
                {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="flex justify-end"><button aria-label="Close menu" onClick={() => setSidebar(false)} className="p-2.5 min-w-[44px] min-h-[44px]"><X className="w-5 h-5" /></button></div>
                {sidebarBody}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat workspace */}
        <section aria-label="Conversation" className={`rounded-2xl border flex flex-col overflow-hidden min-h-0 ${panelBg}`}>
          <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-current/10" style={hairline}>
            <Link
              to="/"
              aria-label="Back to AutoSpark"
              className="inline-flex items-center justify-center p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <button className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] -ml-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" aria-label="Open menu" onClick={() => setSidebar(true)}><Menu className="w-5 h-5" /></button>
            <SparkMark size={30} />
            {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate">{conv?.title || 'SparkPilot'}</p>
              <p className="text-[11px] opacity-60 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${aiLive === false ? 'bg-amber-500' : 'bg-emerald-500'}`} /> {aiLive === false ? 'Connecting to AI expert…' : 'Sales & service expert · replies instantly'}
              </p>
            </div>
            {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="ml-auto flex items-center gap-1.5">
              <span className="hidden sm:block"><DemoBadge isLive={aiLive !== false} /></span>
              <button
                ref={toolsRef}
                className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Open discovery tools"
                aria-expanded={tools}
                onClick={() => setTools(true)}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Messages (only scroller) + jump-to-bottom */}
          {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="relative flex-1 min-h-0">
            {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>}
              ref={listRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                const stuck = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
                stickRef.current = stuck;
                setShowJump(!stuck && el.scrollHeight - el.clientHeight > 240);
              }}
              className="absolute inset-0 overflow-y-auto overscroll-contain px-3 sm:px-5 py-4 space-y-4"
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
              aria-label="Conversation messages"
            >
              {conv?.messages.map((m) => (
                m.kind === 'welcome' ? (
                  <WelcomeCard key={m.id} onAsk={(t) => void send(t)} reduceMotion={reduceMotion} />
                ) : (
                <motion.div key={m.id} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && <SparkMark size={28} />}
                  {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-md' : dark ? 'bg-white/[0.05] border border-white/10 rounded-bl-md' : 'bg-slate-100 border border-slate-200 rounded-bl-md'}`}>
                    <p>
                      {m.role === 'assistant' && m.status !== 'failed'
                        ? <RevealText text={m.text} reduce={reduceMotion} />
                        : m.text}
                    </p>
                    {m.vehicles && m.vehicles.length > 0 && (
                      {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="flex gap-2.5 overflow-x-auto snap-x mt-3 -mx-1 px-1 pb-1" role="list" aria-label="Suggested vehicles">
                        {m.vehicles.map((v) => (
                          {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} key={v.id} role="listitem"><VehicleCard v={v} onAsk={askVehicle} onCompare={(x) => { setCompare((p) => [...p.filter((y) => y.id !== x.id), x].slice(-3)); setPanel('compare'); }} onExpert={expertVehicle} /></div>
                        ))}
                      </div>
                    )}
                    {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="flex items-center gap-1 mt-1.5 opacity-70">
                      <time dateTime={new Date(m.createdAt).toISOString()} className="text-[10px] px-1">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                      {m.role === 'assistant' && m.status !== 'failed' && (
                        <button
                          aria-label={copied === m.id ? 'Copied' : 'Copy response'}
                          className="p-2 -my-1 min-w-[40px] min-h-[40px] rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition"
                          onClick={() => { navigator.clipboard?.writeText(m.text).catch(() => {}); setCopied(m.id); setTimeout(() => setCopied(null), 1500); }}
                        >
                          {copied === m.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {m.status === 'failed' && (
                        <button onClick={() => retry(m)} className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 min-h-[44px] px-2"><RotateCcw className="w-3 h-3" /> Retry</button>
                      )}
                    </div>
                  </div>
                </motion.div>
                )
              ))}

              {busy && (
                {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="flex gap-2.5" aria-label="SparkPilot is typing">
                  <SparkMark size={28} />
                  {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className={`rounded-2xl px-4 py-3 flex gap-1.5 ${dark ? 'bg-white/[0.05] border border-white/10' : 'bg-slate-100 border border-slate-200'}`}>
                    {[0, 1, 2].map((i) => <motion.span key={i} className="w-2 h-2 rounded-full bg-cyan-500" animate={reduceMotion ? {} : { opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />)}
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {showJump && !busy && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  onClick={() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; stickRef.current = true; setShowJump(false); }}
                  aria-label="Jump to latest messages"
                  className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 rounded-full px-3.5 min-h-[44px] text-xs font-semibold shadow-lg border transition ${dark ? 'bg-[#0E1526] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                >
                  <ChevronDown className="w-4 h-4 text-cyan-500" /> Latest
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Quick replies */}
          {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="px-3 sm:px-5 pb-1 flex gap-2 overflow-x-auto scrollbar-hide" role="group" aria-label="Quick replies">
            {['Family car under 25 lakh', 'Hybrid SUV options', 'Car service pricing', 'Japan pre-order', 'Talk to expert'].map((q) => (
              <button key={q} onClick={() => void send(q)} disabled={busy} className={`shrink-0 text-xs font-semibold rounded-full border px-4 min-h-[44px] disabled:opacity-40 transition ${dark ? 'border-white/10 hover:bg-white/5' : 'border-slate-300 hover:bg-slate-100'}`}>{q}</button>
            ))}
          </div>

          {/* Composer */}
          <form
            className="px-3 sm:px-4 pt-2 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] sm:pb-[max(env(safe-area-inset-bottom,0px),1rem)] border-t border-current/10"
            style={hairline}
            onSubmit={(e) => { e.preventDefault(); void send(input); }}
          >
            {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className={`flex items-end gap-2 rounded-2xl border p-2 pl-4 ${dark ? 'bg-white/[0.04] border-white/10 focus-within:border-cyan-500/50' : 'bg-slate-50 border-slate-200 focus-within:border-cyan-500'}`}>
              <label htmlFor="sparkai-input" className="sr-only">Message SparkPilot (Enter to send, Shift+Enter for new line)</label>
              <textarea
                id="sparkai-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(input); } }}
                placeholder="Ask in English or Bangla, for example: Family hybrid under 25 lakh..."
                rows={1}
                disabled={busy}
                enterKeyHint="send"
                className="flex-1 bg-transparent resize-none outline-none text-base max-h-32 placeholder:opacity-50 py-2.5"
                onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 128) + 'px'; }}
              />
              {busy
                ? <button type="button" aria-label="Stop response" onClick={stop} className="p-3 rounded-xl bg-red-500/15 text-red-500 min-w-[48px] min-h-[48px] flex items-center justify-center"><Square className="w-4 h-4" /></button>
                : <button type="submit" aria-label="Send message" disabled={!input.trim()} className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-40 min-w-[48px] min-h-[48px] flex items-center justify-center"><Send className="w-4 h-4" /></button>}
            </div>
            <p className="text-[10px] opacity-50 mt-1.5 px-1 flex items-center gap-1"><Sparkles className="w-3 h-3 shrink-0" /> SparkPilot sales and service expert. Prices and availability are confirmed by an AutoSpark expert before booking.</p>
          </form>
        </section>

        {/* Contextual panel: desktop rail */}
        <aside className={`hidden lg:flex flex-col rounded-2xl border p-4 min-h-0 ${panelBg}`} aria-label="Discovery panel">
          {panelBody}
        </aside>
      </div>

      {/* Mobile tools bottom sheet */}
      <AnimatePresence>
        {tools && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-modal bg-black/60 lg:hidden" onClick={() => setTools(false)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 max-h-[88dvh] flex flex-col rounded-t-3xl border-t p-4 pb-[max(env(safe-area-inset-bottom,0px),1rem)]"
              style={{ background: dark ? '#0B1322' : '#ffffff', borderColor: hairline.borderColor }}
              onClick={(e) => e.stopPropagation()}
              role="dialog" aria-modal="true" aria-label="Discovery tools"
            >
              {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm">Discovery tools</p>
                <button aria-label="Close tools" onClick={() => setTools(false)} className="p-2.5 min-w-[44px] min-h-[44px]"><X className="w-5 h-5" /></button>
              </div>
              {panelBody}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PreorderMini({ step, setStep, onSend }: { step: number; setStep: (n: number) => void; onSend: (t: string) => void }) {
  const steps = ['Vehicle', 'Budget & year', 'Timeline', 'Review'];
  const [form, setForm] = useState({ vehicle: '', year: '', budget: '', timeline: 'Within 1 month' });
  return (
    <Card className="p-3.5">
      <p className="text-xs font-bold uppercase tracking-wider opacity-60">Japan pre-order · step {step + 1} of 4</p>
      {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="flex gap-1 mt-2" aria-hidden>{steps.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-cyan-500' : 'bg-current opacity-15'}`} />)}</div>
      <p className="text-sm font-bold mt-2">{steps[step]}</p>
      {step === 0 && <input aria-label="Desired vehicle" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} placeholder="e.g. Toyota Axio Hybrid" className="mt-2 w-full rounded-xl border bg-transparent px-3 py-2.5 text-base min-h-[44px]" />}
      {step === 1 && <div className="grid grid-cols-2 gap-2 mt-2"><input aria-label="Budget in lakh" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="Budget (lakh)" className="rounded-xl border bg-transparent px-3 py-2.5 text-base min-h-[44px] min-w-0" /><input aria-label="Model year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="Year" className="rounded-xl border bg-transparent px-3 py-2.5 text-base min-h-[44px] min-w-0" /></div>}
      {step === 2 && <select aria-label="Timeline" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} className="mt-2 w-full rounded-xl border bg-transparent px-3 py-2.5 text-base min-h-[44px]"><option>Immediately</option><option>Within 1 month</option><option>1–3 months</option><option>Flexible</option></select>}
      {step === 3 && <p className="text-xs mt-2 opacity-80">Request: <b>{form.vehicle || '-'}</b> · {form.year || '-'} · {form.budget || '-'} lakh · {form.timeline}. Submitting creates a <b>request</b>, not a confirmed booking or auction win.</p>}
      {toast && <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-toast bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"><Check className="w-3.5 h-3.5" />{toast}</div>} className="flex gap-2 mt-3">
        {step > 0 && <SButton variant="outline" onClick={() => setStep(step - 1)}>Back</SButton>}
        {step < 3
          ? <SButton onClick={() => setStep(step + 1)}>Continue</SButton>
          : <SButton onClick={() => { void onSend(`Japan pre-order request: ${form.vehicle}, year ${form.year}, budget ${form.budget} lakh, timeline ${form.timeline}.`); setStep(0); }}>Send request</SButton>}
      </div>
    </Card>
  );
}

// Re-export filter helper for tests
export { filterDemoVehicles } from '../data/demo';
