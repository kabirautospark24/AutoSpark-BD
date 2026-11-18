import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CONTENT_SELECTOR = [
  ':scope > .container-fluid',
  ':scope > .container',
  ':scope > div > .container-fluid',
  ':scope > div > .container',
].join(', ');

const SKIP_INSIDE = '.fixed, [role="dialog"], [data-no-motion]';

const TOP_LEVEL_SELECTOR = [
  ':scope > header',
  ':scope > main',
  ':scope > .container',
  ':scope > .container-fluid',
  ':scope > div',
].join(', ');

function pageSections(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('section')).filter(
    (section) => !section.parentElement?.closest('section')
  );
}

function addMotion(el: HTMLElement, className: string, observer: IntersectionObserver) {
  if (el.classList.contains(className)) return;
  el.classList.add(className);

  // Very tall page wrappers (inventory, legal, etc.) are expensive to blur as
  // one layer. Use the same reveal with just a short lift instead.
  if (className === 'motion-content' && el.getBoundingClientRect().height > window.innerHeight * 1.4) {
    el.classList.add('motion-content-soft');
  }

  observer.observe(el);
}

function canAnimate(wrapper: HTMLElement): boolean {
  if (wrapper.closest(SKIP_INSIDE) !== null) return false;
  if (wrapper.querySelector(SKIP_INSIDE)) return false;

  const { position } = window.getComputedStyle(wrapper);
  if (position === 'absolute' || position === 'fixed') return false;

  const hasText = (wrapper.textContent?.trim().length ?? 0) > 0;
  const hasMedia = wrapper.querySelector('img, video, canvas, svg, form, input, button, a') !== null;
  return hasText || hasMedia;
}

/**
 * Adds viewport-triggered reveal classes to the existing page sections.
 *
 * It intentionally animates the section content wrappers (not the <section>)
 * so fixed dialogs inside a page keep working exactly as before.
 */
export const ScrollMotionController = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (pathname === '/sparkpilot') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.getElementById('main-content');
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    let scanFrame = 0;
    let safetyTimer = 0;
    let scrollFrame = 0;

    const updateScroll = () => {
      scrollFrame = 0;
      document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`);
    };
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll);
    };
    updateScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const scan = () => {
      pageSections(root).forEach((section) => {
        let animated = false;

        section.querySelectorAll<HTMLElement>(CONTENT_SELECTOR).forEach((wrapper) => {
          if (!canAnimate(wrapper)) return;
          addMotion(wrapper, 'motion-content', observer);
          animated = true;
        });

        if (!animated) {
          const heading = section.querySelector<HTMLElement>('h1, h2');
          if (heading && !heading.closest(SKIP_INSIDE)) {
            addMotion(heading, 'motion-heading', observer);
          }
        }
      });

      // Pages that do not use <section> wrappers (inventory, contact, legal,
      // checkout, etc.) still get the same viewport reveal on their own
      // top-level content blocks. This never touches fixed dialogs.
      const pageRoot = root.querySelector<HTMLElement>(':scope > .page-motion > *');
      if (!pageRoot) return;

      if (pageRoot.matches('.container, .container-fluid')) {
        if (canAnimate(pageRoot)) addMotion(pageRoot, 'motion-content', observer);
        return;
      }

      pageRoot.querySelectorAll<HTMLElement>(TOP_LEVEL_SELECTOR).forEach((wrapper) => {
        if (wrapper.closest('section')) return;
        if (!canAnimate(wrapper)) return;
        addMotion(wrapper, 'motion-content', observer);
      });
    };

    const scheduleScan = () => {
      if (scanFrame) return;
      scanFrame = window.requestAnimationFrame(() => {
        scanFrame = 0;
        scan();
      });
    };

    scan();

    const mutationObserver = new MutationObserver(scheduleScan);
    mutationObserver.observe(root, { childList: true, subtree: true });

    safetyTimer = window.setTimeout(() => {
      root
        .querySelectorAll<HTMLElement>('.motion-content:not(.is-revealed), .motion-heading:not(.is-revealed)')
        .forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight * 1.25) {
            el.classList.add('is-revealed');
          }
        });
    }, 2000);

    return () => {
      window.clearTimeout(safetyTimer);
      if (scanFrame) window.cancelAnimationFrame(scanFrame);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      window.removeEventListener('scroll', onScroll);
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
};
