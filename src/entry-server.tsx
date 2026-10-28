/* eslint-disable react-refresh/only-export-components -- server entry, not a component module */
/**
 * Server entry used by scripts/prerender.mjs.
 *
 * Renders a route to static HTML at build time so every route has its own
 * crawlable URL with real content, then the client bundle takes over.
 */
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { TooltipProvider } from './components/ui/tooltip';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { ScrollToTop } from './components/ScrollToTop';
import { Layout } from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { AppRoutes } from './App';

export { buildHeadTags, headTagsToHtml } from './lib/headTags';
export { ROUTES, NOT_FOUND_SEO, SITE_URL, SITE, matchRoute } from './lib/seo';

const RENDER_TIMEOUT_MS = 25_000;

/**
 * Renders one route to HTML.
 * Resolves with the markup, or rejects when the route cannot be rendered.
 */
export function renderPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        abort();
      } catch {
        /* ignore */
      }
      reject(new Error(`Timed out rendering ${url}`));
    }, RENDER_TIMEOUT_MS);

    const { pipe, abort } = renderToPipeableStream(
      <HelmetProvider>
        <TooltipProvider>
          <ThemeProvider>
            <LanguageProvider>
              <CartProvider>
                <StaticRouter location={url}>
                  <ErrorBoundary>
                    <ScrollToTop />
                    <Layout>
                      <AppRoutes />
                    </Layout>
                  </ErrorBoundary>
                </StaticRouter>
              </CartProvider>
            </LanguageProvider>
          </ThemeProvider>
        </TooltipProvider>
      </HelmetProvider>,
      {
        onAllReady() {
          clearTimeout(timer);
          const chunks: Buffer[] = [];
          const sink = new PassThrough();
          sink.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          sink.on('end', () => {
            if (settled) return;
            settled = true;
            resolve(Buffer.concat(chunks).toString('utf8'));
          });
          pipe(sink);
        },
        onError(error: unknown) {
          // A failed client-side data fetch is not fatal for the static HTML.
          if (!settled) {
             
            console.warn('[prerender] render warning:', (error as Error)?.message ?? error);
          }
        },
      }
    );
  });
}
