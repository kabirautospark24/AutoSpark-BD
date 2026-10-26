import { describe, it, expect } from 'vitest';
import { segmentMessage, RevealText, WaLink } from '../components/ui';

const links = (text: string) =>
  segmentMessage(text).filter((s): s is { href: string; label: string } => 'href' in s);

const textRuns = (text: string) =>
  segmentMessage(text).filter((s): s is { value: string } => 'value' in s).map((s) => s.value).join('');

describe('SparkPilot WhatsApp handoff links', () => {
  it('makes the expert number a one-tap wa.me link (wa.me stays plain, no double button)', () => {
    const segs = segmentMessage('I do not have that yet — an expert can confirm. WhatsApp: +880 1760-401605 (wa.me/8801760401605).');
    const wa = segs.filter((s): s is { href: string; label: string } => 'href' in s);
    expect(wa).toHaveLength(1);
    expect(wa[0].href).toBe('https://wa.me/8801760401605');
    expect(wa[0].label).toBe('+880 1760-401605');
    expect(textRuns('I do not have that yet — an expert can confirm. WhatsApp: +880 1760-401605 (wa.me/8801760401605).')).toContain('wa.me/8801760401605');
  });

  it('normalizes every written form of the expert number', () => {
    for (const n of ['+880 1760-401605', '8801760401605', '01760401605', '880 1760 401605', '00880 1760 401605']) {
      expect(links(`Call ${n} today`)[0]?.href).toBe('https://wa.me/8801760401605');
    }
  });

  it('links Bangla-digit spellings (the assistant mirrors Bangla replies)', () => {
    for (const n of ['৮৮০ ১৭৬০-৪০১৬০৫', '০১৭৬০৪০১৬০৫', '০১৭৬০-৪০১৬০৫']) {
      expect(links(`WhatsApp করুন ${n}`)[0]?.href).toBe('https://wa.me/8801760401605');
    }
  });

  it('links spaced, dotted, parenthesised and bare-tail forms to the expert chat', () => {
    for (const n of ['(01760) 401605', '01760.401605', '1760-401605', '1760 401605']) {
      expect(links(`Call ${n}`)[0]?.href).toBe('https://wa.me/8801760401605');
    }
  });

  it('never links a partial or foreign run of digits', () => {
    expect(links('Ordered 202601760401605 items')).toEqual([]);
    expect(links('Reference 1234567 today')).toEqual([]);
    expect(segmentMessage('The Aqua hybrid is ৳25 lakh in ready stock.')).toEqual([
      { value: 'The Aqua hybrid is ৳25 lakh in ready stock.' },
    ]);
  });

  it('links a bare wa.me URL when no number is spelled out', () => {
    const wa = links('Chat with us on wa.me/8801760401605 anytime.');
    expect(wa).toHaveLength(1);
    expect(wa[0].href).toBe('https://wa.me/8801760401605');
    expect(wa[0].label).toBe('wa.me/8801760401605');
  });

  it('repairs a wa.me URL written without the country code', () => {
    expect(links('Chat wa.me/1760401605')[0]?.href).toBe('https://wa.me/8801760401605');
  });

  it('leaves replies without a handoff untouched', () => {
    expect(segmentMessage('The Aqua hybrid is ৳25 lakh in ready stock.')).toEqual([
      { value: 'The Aqua hybrid is ৳25 lakh in ready stock.' },
    ]);
  });

  it('renders the link as an anchor in both animated and reduced-motion modes', () => {
    const animated = RevealText({ text: 'WhatsApp +880 1760-401605', reduce: false });
    const reduced = RevealText({ text: 'WhatsApp +880 1760-401605', reduce: true });
    expect(JSON.stringify(animated)).toContain('https://wa.me/8801760401605');
    expect(JSON.stringify(reduced)).toContain('https://wa.me/8801760401605');
    expect(typeof WaLink).toBe('function');
  });

  it('opens the number in WhatsApp (anchor target + href), not inside the chat', () => {
    const el = WaLink({ href: 'https://wa.me/8801760401605', label: '+880 1760-401605' });
    expect(el.props.href).toBe('https://wa.me/8801760401605');
    expect(el.props.target).toBe('_blank');
    expect(el.props.rel).toContain('noopener');
  });

  it('renders the handoff line without the mock _emphasis_ markers', () => {
    const reply = '\n\n_Needs an expert? WhatsApp +880 1760-401605 (wa.me/8801760401605)._';
    const html = JSON.stringify(RevealText({ text: reply, reduce: true }));
    expect(html).not.toContain('_Needs');
    expect(html).toContain('https://wa.me/8801760401605');
  });
});
