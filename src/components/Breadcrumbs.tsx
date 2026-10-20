import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { Breadcrumb } from '../lib/seo';

type Props = {
  items: Breadcrumb[];
  className?: string;
};

/**
 * Visible breadcrumb trail. Provides crawlable internal links back up the
 * hierarchy; the matching BreadcrumbList JSON-LD is emitted by PageHead.
 */
export const Breadcrumbs: React.FC<Props> = ({ items, className = '' }) => {
  const { theme } = useTheme();
  if (!items || items.length === 0) return null;

  const base = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  return (
    <nav aria-label="Breadcrumb" className={`w-full ${className}`}>
      <ol className={`flex flex-wrap items-center gap-1 text-xs sm:text-sm ${base}`}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />}
              {isLast ? (
                <span className="font-medium text-[#C00000] dark:text-[#FF1A1A]" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="rounded transition-colors hover:text-[#C00000] hover:underline dark:hover:text-[#FF1A1A]"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
