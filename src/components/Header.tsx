import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Globe } from 'lucide-react';
import { m, LazyMotion, domAnimation, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const navbarContainerVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

const mobileMenuVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    setActiveLink(location.pathname);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const onChange = (e: MediaQueryListEvent) => { if (e.matches) setIsMobileMenuOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    try {
      import('../utils/AudioManager').then(mod => mod.AudioManager.setEnabled(true)).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/inventory', label: t('nav.inventory') },
    { to: '/experience', label: language === 'en' ? 'Experience' : 'অভিজ্ঞতা' },
    { to: '/services', label: t('nav.services') },
    { to: '/about', label: t('nav.about') },
    { to: '/testimonials', label: t('nav.testimonials') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const toggleLanguage = () => {
    import('../utils/AudioManager').then(mod => mod.AudioManager.playClick());
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  const handleToggleTheme = () => {
    import('../utils/AudioManager').then(mod => mod.AudioManager.playClick());
    toggleTheme();
  };

  const handleNavClick = (to: string) => {
    import('../utils/AudioManager').then(mod => mod.AudioManager.playClick());
    setActiveLink(to);
    setIsMobileMenuOpen(false);
  };

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobileMenuOpen) {
      const firstLink = mobileMenuRef.current?.querySelector('a, button');
      if (firstLink && 'focus' in firstLink) (firstLink as HTMLElement).focus();
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      const focusable = (mobileMenuRef.current?.querySelectorAll('a[href], button, [tabindex]') as NodeListOf<HTMLElement>) ?? [] as HTMLElement[];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsMobileMenuOpen(false);
          document.removeEventListener('keydown', handleKeyDown);
          return;
        }
        if (e.key === 'Tab') {
          if (!focusable.length) return;
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); });
    }
  }, [isMobileMenuOpen]);

  const navLinksDesktop = [
    { to: '/', label: t('nav.home') },
    { to: '/inventory', label: t('nav.inventory') },
    { to: '/brands', label: 'Brands' },
    { to: '/japan-import', label: 'Japan Import' },
    { to: '/services', label: t('nav.services') },
    { to: '/about', label: t('nav.about') },
  ];

  const glassBackground = isMobileMenuOpen
    ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-lg shadow-black/10'
    : 'bg-background/30 backdrop-blur-xl border-b border-transparent';

  return (
    <LazyMotion features={domAnimation}>
      <m.header
        initial="hidden"
        animate="visible"
        variants={navbarContainerVariants}
        className="fixed left-0 right-0 z-50 top-[var(--geo-banner-h,0px)] pt-[env(safe-area-inset-top,0px)] transition-all duration-300"
      >
        <div className={`${glassBackground} transition-colors duration-300`}>
          <nav aria-label="Main navigation" className="container px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Logo Section */}
              <Link
                to="/"
                className="flex items-center gap-2.5 group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <img
                  src={`${import.meta.env.BASE_URL}logo/logoAS3.svg`}
                  alt="Auto Spark BD"
                  width={44}
                  height={44}
                  className="h-10 w-10 lg:h-11 lg:w-11"
                />
                <div className="leading-none">
                  <span className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg lg:text-xl">
                    {t('site.title')}
                  </span>
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary sm:hidden">
                    Premium Cars
                  </div>
                </div>
              </Link>

              {/* Desktop navigation */}
              <div className="hidden xl:flex items-center space-x-0">
                {navLinksDesktop.map((link) => (
                  <Link
                    to={link.to}
                    onClick={() => handleNavClick(link.to)}
                    className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 relative outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      activeLink === link.to ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }"
                    aria-current={activeLink === link.to ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Right Controls */}
              <div className="flex items-center space-x-2">
                {/* Theme Toggle */}
                <Link
                  to="/"
                  onClick={handleToggleTheme}
                  className="rounded-lg bg-background/50 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Link>

                {/* Language Toggle */}
                <Link
                  to="/"
                  onClick={toggleLanguage}
                  className="rounded-lg bg-background/50 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label="Toggle language"
                >
                  <Globe className="h-4 w-4" />
                </Link>

                {/* CTA Button */}
                <Link
                  to="/contact"
                  onClick={() => { handleNavClick('/contact'); }}
                  className="rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t('nav.contact')}
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* Mobile Menu - conditional, inside header */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <m.div
              ref={mobileMenuRef}
              id="mobile-menu"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pb-safe-6"
              role="menu"
              aria-label="Mobile navigation"
            >
              <div className="space-y-1 rounded-xl border border-border bg-card p-4 shadow-lg">
                {/* Mobile Navigation Links */}
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => handleNavClick(link.to)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      activeLink === link.to ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                    }"
                    aria-current={activeLink === link.to ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Mobile CTA Button */}
                <Link
                  to="/contact"
                  onClick={() => {
                    import('../utils/AudioManager').then(mod => mod.AudioManager.playClick());
                    handleNavClick('/contact');
                  }}
                  className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t('nav.contact')}
                </Link>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </m.header>
    </LazyMotion>
  );
};