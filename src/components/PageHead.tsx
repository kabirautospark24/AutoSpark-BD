import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { buildHeadTags } from '../lib/headTags';
import { matchRoute, type RouteSeo } from '../lib/seo';

type Props = {
  /** Route path override. Defaults to the current location pathname. */
  path?: string;
  /** Per-page overrides, useful for dynamic routes (vehicle id, product id). */
  seo?: Partial<RouteSeo>;
  /** Force noindex regardless of the route manifest. */
  noindex?: boolean;
  /** Extra JSON-LD entity merged into the structured data graph. */
  jsonLd?: Record<string, unknown> | null;
};

/**
 * Renders the full head block for a page: title, description, robots, canonical,
 * Open Graph, Twitter card and the JSON-LD graph (business, website, breadcrumbs).
 *
 * The tag set is built by src/lib/headTags.ts, the same builder the build-time
 * prerenderer uses, so the static HTML and the hydrated document always agree.
 */
export const PageHead: React.FC<Props> = ({ path, seo, noindex, jsonLd }) => {
  const location = useLocation();
  const routePath = path ?? location.pathname;

  const route = useMemo<RouteSeo>(() => {
    const base = matchRoute(routePath);
    const merged: RouteSeo = seo ? { ...base, ...seo, path: routePath } : { ...base, path: routePath };
    if (noindex) merged.noindex = true;
    const extra = [...(merged.extraSchema ?? [])];
    if (jsonLd) extra.push(jsonLd);
    if (extra.length) merged.extraSchema = extra;
    return merged;
  }, [routePath, seo, noindex, jsonLd]);

  const tags = useMemo(() => buildHeadTags(route), [route]);

  return (
    <Helmet>
      {tags.map((tag, index) => {
        if (tag.tag === 'title') return <title key={index}>{tag.text}</title>;
        if (tag.tag === 'script') {
          return (
            <script key={index} {...tag.attrs}>
              {tag.text}
            </script>
          );
        }
        if (tag.tag === 'link') return <link key={index} {...tag.attrs} />;
        return <meta key={index} {...tag.attrs} />;
      })}
    </Helmet>
  );
};

export default PageHead;
