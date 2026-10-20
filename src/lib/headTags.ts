import {
  SITE,
  absoluteUrl,
  breadcrumbSchema,
  businessSchema,
  buildShareImage,
  buildTitle,
  websiteSchema,
  type RouteSeo,
} from './seo';

export type HeadTag =
  | { tag: 'title'; text: string }
  | { tag: 'meta'; attrs: Record<string, string> }
  | { tag: 'link'; attrs: Record<string, string> }
  | { tag: 'script'; attrs: Record<string, string>; text: string };

/**
 * Builds the complete head tag set for a route.
 *
 * This is the single source of truth used by:
 *  - src/components/PageHead.tsx (client side, via react-helmet-async)
 *  - scripts/prerender.mjs (static HTML written at build time)
 *
 * Keeping one builder guarantees the prerendered HTML and the hydrated
 * document never disagree.
 */
export const buildHeadTags = (route: RouteSeo): HeadTag[] => {
  const title = buildTitle(route);
  const description = route.description;
  const canonical = absoluteUrl(route.path);
  const image = buildShareImage(route);
  const robots = route.noindex ? 'noindex, nofollow' : 'index, follow';
  const imageAlt = `${route.h1} | ${SITE.name}`;

  const graph: Record<string, unknown>[] = [businessSchema(), websiteSchema()];
  if (route.breadcrumbs && route.breadcrumbs.length > 1) {
    graph.push(breadcrumbSchema(route.breadcrumbs));
  }
  if (route.extraSchema) graph.push(...route.extraSchema);

  return [
    { tag: 'title', text: title },
    { tag: 'meta', attrs: { name: 'description', content: description } },
    { tag: 'meta', attrs: { name: 'robots', content: robots } },
    { tag: 'link', attrs: { rel: 'canonical', href: canonical } },

    { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
    { tag: 'meta', attrs: { property: 'og:site_name', content: SITE.name } },
    { tag: 'meta', attrs: { property: 'og:locale', content: SITE.locale } },
    { tag: 'meta', attrs: { property: 'og:title', content: title } },
    { tag: 'meta', attrs: { property: 'og:description', content: description } },
    { tag: 'meta', attrs: { property: 'og:url', content: canonical } },
    { tag: 'meta', attrs: { property: 'og:image', content: image } },
    { tag: 'meta', attrs: { property: 'og:image:type', content: 'image/png' } },
    { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
    { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
    { tag: 'meta', attrs: { property: 'og:image:alt', content: imageAlt } },

    { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
    { tag: 'meta', attrs: { name: 'twitter:title', content: title } },
    { tag: 'meta', attrs: { name: 'twitter:description', content: description } },
    { tag: 'meta', attrs: { name: 'twitter:image', content: image } },
    { tag: 'meta', attrs: { name: 'twitter:image:alt', content: imageAlt } },

    {
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      text: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
    },
  ];
};

const escapeAttr = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Serialises head tags to HTML. Used by the build-time prerenderer. */
export const headTagsToHtml = (tags: HeadTag[]): string =>
  tags
    .map((t) => {
      if (t.tag === 'title') return `<title>${escapeAttr(t.text)}</title>`;
      const attrs = Object.entries(t.attrs)
        .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
        .join(' ');
      if (t.tag === 'script') return `<script ${attrs}>${t.text}</script>`;
      if (t.tag === 'link') return `<link ${attrs}>`;
      return `<meta ${attrs}>`;
    })
    .join('\n    ');
