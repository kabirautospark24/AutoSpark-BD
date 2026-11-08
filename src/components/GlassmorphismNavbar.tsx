import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, Globe, Volume2, VolumeX } from 'lucide-react';
import { m, LazyMotion, domAnimation, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

// Loaded on demand so the audio engine stays out of the critical path.
const playClick = () => import('../utils/AudioManager').then(mod => mod.AudioManager.playClick());
const playButtonClick = () => import('../utils/AudioManager').then(mod => mod.AudioManager.playButtonClick());

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
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
};

const navLinkVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.24 },
  }),
};

export const GlassmorphismNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  useEffect(() => {
    setActiveLink(location.pathname);
    setIsMobileMenuOpen(false); // close menu on any navigation (incl. back/forward)
  }, [location.pathname]);

  // Lock background scroll while the mobile menu is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isMobileMenuOpen]);

  // Escape closes the menu from anywhere on the page
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  // Switching to desktop width must not leave the menu open (CSS would hide it while scroll stays locked)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const onChange = (e: MediaQueryListEvent) => { if (e.matches) setIsMobileMenuOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Load persisted audio preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem('audio_enabled');
      const enabled = stored === null ? true : stored === 'true';
      setAudioEnabled(enabled);
      import('../utils/AudioManager').then(mod => mod.AudioManager.setEnabled(enabled)).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  // One mark in the chrome, everywhere, so the brand reads consistently.
  const currentLogo = `${import.meta.env.BASE_URL}logo/logoAS3.svg`;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/inventory', label: t('nav.inventory') },
    { to: '/experience', label: language === 'en' ? 'Experience' : 'অভিজ্ঞতা' },
    { to: '/services', label: t('nav.services') },
    { to: '/accessories', label: t('nav.accessories') },
    { to: '/about', label: t('nav.about') },
    { to: '/testimonials', label: t('nav.testimonials') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const toggleLanguage = () => {
    playClick();
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  const handleToggleTheme = () => {
    playClick();
    toggleTheme();
  };

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    try {
      localStorage.setItem('audio_enabled', String(next));
      import('../utils/AudioManager').then(mod => mod.AudioManager.setEnabled(next)).catch(() => {});
    } catch {
      // ignore
    }
  };

  const handleNavClick = (to: string) => {
    playButtonClick();
    setActiveLink(to);
    setIsMobileMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    playClick();
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Focus trap for mobile menu
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isMobileMenuOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the first link in the mobile menu after a tick
      requestAnimationFrame(() => {
        const firstLink = mobileMenuRef.current?.querySelector('a, button');
        if (firstLink && 'focus' in firstLink) (firstLink as HTMLElement).focus();
      });
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isMobileMenuOpen]);

  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsMobileMenuOpen(false);
      return;
    }
    if (e.key !== 'Tab' || !mobileMenuRef.current) return;
    const focusable = mobileMenuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const glassBackground = isScrolled
    ? 'bg-background/85 backdrop-blur-2xl border-b border-border shadow-lg shadow-black/10'
    : 'bg-background/40 backdrop-blur-xl border-b border-transparent';

  return (
    <LazyMotion features={domAnimation}>
    <m.header
      initial="hidden"
      animate="visible"
      variants={navbarContainerVariants}
      className="fixed left-0 right-0 z-50 top-[var(--geo-banner-h,0px)] pt-[env(safe-area-inset-top,0px)] transition-all duration-300"
    >
      {/* Glassmorphic background */}
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
                src={currentLogo}
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

            {/* Desktop navigation: full link set from xl; below that the drawer takes over */}
            <div className="hidden xl:flex items-center space-x-0.5">
              {navLinks.map((link, index) => {
                const isExternal = link.to.startsWith('tel:');
                const commonClasses = `px-2.5 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 relative outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  activeLink === link.to
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`;

                return (
                  <m.div
                    key={link.to}
                    custom={index}
                    variants={navLinkVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative"
                  >
                    {isExternal ? (
                      <a
                        href={link.to}
                        onClick={() => handleNavClick(link.to)}
                        className={commonClasses}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        onClick={() => handleNavClick(link.to)}
                        className={commonClasses}
                        aria-current={activeLink === link.to ? 'page' : undefined}
                      >
                        {link.label}
                        {/* Active indicator with glassmorphism */}
                        {activeLink === link.to && (
                          <m.div
                            layoutId="activeIndicator"
                            className="absolute inset-0 -z-10 rounded-lg border border-primary/25 bg-primary/10"
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </Link>
                    )}
                  </m.div>
                );
              })}
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Audio Toggle — hidden on the narrowest screens to keep the row calm */}
              <m.button
                whileTap={{ scale: 0.96 }}
                onClick={handleToggleAudio}
                className="hidden h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={audioEnabled ? 'Mute site audio' : 'Unmute site audio'}
                aria-pressed={!audioEnabled}
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </m.button>

              {/* Theme Toggle */}
              <m.button
                whileTap={{ scale: 0.96 }}
                onClick={handleToggleTheme}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </m.button>

              {/* Language Toggle */}
              <m.button
                whileTap={{ scale: 0.96 }}
                onClick={toggleLanguage}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Toggle language"
              >
                <Globe className="h-4 w-4" />
              </m.button>

              {/* CTA Button - Desktop */}
              <Link
                to="/contact"
                onClick={() => { playButtonClick(); handleNavClick('/contact'); }}
                className="hidden min-h-[40px] items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {t('nav.contact')}
              </Link>

              {/* Mobile Menu Button */}
              <m.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMobileMenuToggle}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted xl:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <m.div
                      key="close"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-6 w-6" />
                    </m.div>
                  ) : (
                    <m.div
                      key="open"
                      initial={{ opacity: 0, rotate: 90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-6 w-6" />
                    </m.div>
                  )}
                </AnimatePresence>
              </m.button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <m.div
                ref={mobileMenuRef}
                id="mobile-menu"
                variants={mobileMenuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="xl:hidden mt-4 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pb-safe-6"
                role="menu"
                aria-label="Mobile navigation"
                onKeyDown={handleMenuKeyDown}
              >
                <div className="space-y-1 rounded-xl border border-border bg-card p-3 shadow-lg">
                  {/* Mobile Navigation Links */}
                  {navLinks.map((link, index) => {
                    const isExternal = link.to.startsWith('tel:');
                    const commonClasses = `block px-4 py-3 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      activeLink === link.to
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`;

                    return (
                      <m.div
                        key={link.to}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {isExternal ? (
                          <a
                            href={link.to}
                            onClick={() => handleNavClick(link.to)}
                            className={commonClasses}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            to={link.to}
                            onClick={() => handleNavClick(link.to)}
                            className={commonClasses}
                            aria-current={activeLink === link.to ? 'page' : undefined}
                          >
                            {link.label}
                          </Link>
                        )}
                      </m.div>
                    );
                  })}

                  {/* Mobile CTA Button */}
                  <Link
                    to="/contact"
                    onClick={() => {
                      playButtonClick();
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
        </nav>
      </div>

      {/* Hairline accent under the chrome */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </m.header>
    </LazyMotion>
  );
};
