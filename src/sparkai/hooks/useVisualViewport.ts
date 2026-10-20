import { useEffect, useState } from 'react';

/**
 * Tracks the on-screen (visual) viewport while the soft keyboard is open.
 * Returns { h, top } only when the keyboard is actually shrunk the viewport
 * (avoids jitter from mobile URL-bar show/hide); null otherwise.
 *
 * - iOS Safari: fixed UI must move with the visual viewport (nothing resizes).
 * - Chrome Android: `interactive-widget=resizes-content` already resizes the
 *   layout viewport, so this hook's values stay null there (scale stays 1,
 *   height ≈ innerHeight): no double compensation.
 */
export function useVisualViewport(enabled: boolean): { h: number; top: number } | null {
  const [vv, setVv] = useState<{ h: number; top: number } | null>(null);

  useEffect(() => {
    if (!enabled) {
      setVv(null);
      return;
    }
    const v = window.visualViewport;
    if (!v) return;
    const update = () => {
      const keyboardOpen = v.height < window.innerHeight * 0.85;
      setVv(keyboardOpen ? { h: Math.round(v.height), top: Math.round(v.offsetTop) } : null);
    };
    update();
    v.addEventListener('resize', update);
    v.addEventListener('scroll', update);
    return () => {
      v.removeEventListener('resize', update);
      v.removeEventListener('scroll', update);
      setVv(null);
    };
  }, [enabled]);

  return vv;
}
