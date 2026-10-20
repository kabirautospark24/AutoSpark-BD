import { useEffect, useLayoutEffect, useState } from 'react';

const CACHE_KEY = 'autospark-geo-allowed';
const CACHE_TTL = 24 * 3600 * 1000;

/** Non-blocking geo notice: never blocks render; bots/crawlers always pass. */
export function GeoBanner() {
  const [show, setShow] = useState(false);

  // Publish banner height so the fixed header can offset itself below it
  useLayoutEffect(() => {
    const setH = (el: HTMLElement | null) => {
      const h = el ? Math.round(el.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty('--geo-banner-h', `${h}px`);
    };
    setH(document.getElementById('geo-banner'));
    const ro = new ResizeObserver((entries) => setH(entries[0]?.target as HTMLElement | null));
    const el = document.getElementById('geo-banner');
    if (el) ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty('--geo-banner-h', '0px');
    };
  }, [show]);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/bot|crawl|spider|slurp|mediapartners|google/i.test(ua)) return;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { allowed, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL && allowed === false) setShow(true);
        return;
      }
    } catch { /* ignore */ }
    if (import.meta.env.DEV) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    // Same-origin endpoint: the geo lookup runs server side, so the browser
    // makes no cross-origin request and logs no CORS error.
    fetch('/api/geo', { signal: controller.signal })
      .then(r => (r.ok ? r.json() : { country: null }))
      .then((data: { country?: string | null }) => {
        const allowed = data?.country === 'BD';
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ allowed, ts: Date.now() })); } catch { /* ignore */ }
        if (!allowed && data?.country) setShow(true);
      })
      .catch(() => { /* fail-open: legitimate users never blocked */ })
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  if (!show) return null;
  return (
    <div id="geo-banner" role="note" aria-label="Regional notice" className="relative z-[60] bg-amber-100 text-amber-900 text-sm px-4 py-2 text-center">
      AutoSpark BD primarily serves customers within Bangladesh. Some features (payment, delivery) may be limited outside BD.
      <button onClick={() => setShow(false)} aria-label="Dismiss regional notice" className="ml-3 underline min-h-[44px] px-2 -my-2">Dismiss</button>
    </div>
  );
}
