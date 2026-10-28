// Lightweight analytics wrapper: no-op by default but easy to wire to Plausible/Fathom/GA or custom server
type EventProps = Record<string, unknown>;

type PlausibleFn = (name: string, opts: { props: EventProps }) => void;

const debug = false;

export function trackEvent(name: string, props: EventProps = {}) {
  try {
    // If a global analytics is present (e.g., window.plausible), call it
    const plausible = (window as Window & { plausible?: PlausibleFn }).plausible;
    if (typeof plausible === 'function') {
      plausible(name, { props });
      return;
    }

    // Fallback: console log in debug mode
    if (debug) console.log('[analytics] event', name, props);

    // TODO: wire to your server endpoint or third-party analytics here
  } catch (e) {
    // swallow analytics errors: they must not affect UX
    if (debug) console.warn('analytics error', e);
  }
}

export default { trackEvent };
