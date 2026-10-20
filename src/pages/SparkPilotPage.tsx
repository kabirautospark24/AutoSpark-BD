import { useEffect } from 'react';
import { SparkPilotApp } from '../sparkai/components/SparkPilotApp';

/**
 * App-like route: the assistant owns the viewport. The site header/footer are
 * hidden by Layout; here we drop the body safe-area paddings (the app handles
 * insets itself) and lock page scrolling so the chat is the only scroller.
 */
export function SparkPilotPage() {
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const prev = {
      bodyPadTop: body.style.paddingTop,
      bodyPadBottom: body.style.paddingBottom,
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
    };
    body.style.paddingTop = '0';
    body.style.paddingBottom = '0';
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      body.style.paddingTop = prev.bodyPadTop;
      body.style.paddingBottom = prev.bodyPadBottom;
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
    };
  }, []);

  return (
    <main aria-label="SparkPilot by AutoSpark">
      <h1 className="sr-only">SparkPilot Assistant</h1>
      <SparkPilotApp />
    </main>
  );
}
