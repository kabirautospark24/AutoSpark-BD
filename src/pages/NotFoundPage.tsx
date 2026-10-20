import { Link } from 'react-router-dom';
import { Home, Car, Wrench, Phone } from 'lucide-react';
import { PageHead } from '../components/PageHead';
import { useTheme } from '../contexts/ThemeContext';
import { NOT_FOUND_SEO } from '../lib/seo';

const suggestions = [
  { to: '/inventory', label: 'Browse inventory', icon: Car, description: 'Quality Japanese import cars ready to drive' },
  { to: '/services', label: 'Book a service', icon: Wrench, description: 'Servicing, repairs and genuine parts' },
  { to: '/contact', label: 'Contact the showroom', icon: Phone, description: 'Station Road, Rajshahi' },
];

export const NotFoundPage = () => {
  const { theme } = useTheme();

  return (
    <>
      <PageHead seo={NOT_FOUND_SEO} noindex />
      <div className={`min-h-[70vh] flex flex-col items-center justify-center px-6 py-16 text-center ${theme === 'dark' ? '' : 'bg-gray-50'}`}>
        <p className="text-[clamp(4rem,15vw,8rem)] font-black leading-none tracking-tighter text-[var(--brand-red,#C00000)] tabular-nums">404</p>
        <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-balance">This page drove off</h1>
        <p className="mt-2 max-w-md text-sm sm:text-base text-gray-500 dark:text-gray-400">
          The address may be wrong, or the page has moved. Let us get you back on the road.
        </p>

        <ul className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          {suggestions.map((s) => (
            <li key={s.to}>
              <Link
                to={s.to}
                className="flex h-full flex-col items-start gap-2 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-[#C00000] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C00000] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-[#FF1A1A]"
              >
                <s.icon className="h-5 w-5 text-[#C00000]" aria-hidden="true" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{s.description}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--brand-red,#C00000)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Go home
          </Link>
          <Link
            to="/inventory"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 active:scale-[0.98]"
          >
            Browse inventory
          </Link>
          <Link
            to="/contact"
            className="inline-flex min-h-[44px] items-center rounded-lg px-6 py-3 text-sm font-semibold text-[var(--brand-red,#C00000)] transition hover:bg-[var(--brand-red,#C00000)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
          >
            Contact us
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
