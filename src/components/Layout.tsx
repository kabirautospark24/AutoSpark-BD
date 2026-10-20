import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MessageCircle, Phone } from 'lucide-react';
import CompositeFAB from './ui/CompositeFAB';
import { SparkPilotWidget } from '../sparkai/components/SparkPilotWidget';
import { GeoBanner } from './GeoBanner';
import { useTheme } from '../contexts/ThemeContext';
import { PageHead } from './PageHead';
import { Breadcrumbs } from './Breadcrumbs';
import { matchRoute } from '../lib/seo';

interface LayoutProps {
  children: ReactNode;
}

// Pages that ship their own breadcrumb trail inside the page body.
const ROUTES_WITH_OWN_BREADCRUMBS = [/^\/product\//, /^\/vehicle\//];

export const Layout = ({ children }: LayoutProps) => {
  const { theme } = useTheme();
  const { pathname } = useLocation();
  // The assistant route is app-like: its own chrome fills the viewport,
  // so the site header/footer/floating actions step aside.
  const isAppRoute = pathname === '/sparkpilot';
  const whatsappNumber = '8801760401605';
  const whatsappMessage = encodeURIComponent('Hello! I would like to inquire about your vehicles.');

  const route = matchRoute(pathname);
  const showBreadcrumbs =
    !isAppRoute &&
    route.breadcrumbs &&
    route.breadcrumbs.length > 1 &&
    !ROUTES_WITH_OWN_BREADCRUMBS.some((re) => re.test(pathname));

  return (
    <div className={`min-h-dvh flex flex-col transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded-md">Skip to content</a>
      {/* Regional notice: in flow above the fixed header; header offsets via --geo-banner-h */}
      {!isAppRoute && <GeoBanner />}
      {!isAppRoute && <Header />}
      {/* Route-driven head tags: title, description, canonical, share image, schema.
          Rendered before the page content so page-level overrides take precedence. */}
      <PageHead />
      <main id="main-content" className={`flex-grow relative z-10 ${isAppRoute ? 'min-h-0' : ''}`}>
        {showBreadcrumbs && (
          <div className={`border-b ${theme === 'dark' ? 'border-gray-800/70 bg-black/30' : 'border-gray-200 bg-white/80'}`}>
            <div className="container mx-auto px-4 py-3">
              <Breadcrumbs items={route.breadcrumbs!} />
            </div>
          </div>
        )}
        {children}
      </main>
      {!isAppRoute && <Footer />}

      {/* Floating actions + assistant are site chrome: hidden on the app route */}
      {!isAppRoute && (
        <CompositeFAB
          actions={[
            {
              href: `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`,
              ariaLabel: 'Contact on WhatsApp',
              icon: <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />,
              bgClass: 'bg-green-500 hover:bg-green-600',
            },
            {
              href: `tel:+8801760401605`,
              ariaLabel: 'Call showroom',
              icon: <Phone className="h-5 w-5 sm:h-6 sm:w-6" />,
              bgClass: 'bg-[#C00000] hover:bg-[#b00000]',
            },
          ]}
          position="left"
          posClass="left-4 sm:left-6"
          stackIndex={0}
          baseOffsetPx={16}
          gapPx={12}
          sizePx={56}
        />
      )}
      {!isAppRoute && <SparkPilotWidget />}
    </div>
  );
};
