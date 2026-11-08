import { useEffect, useState, useRef, lazy, Suspense, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { ArrowRight, Car, Wrench, Shield, Award, ChevronDown, Zap, Fuel, Clock, Phone, MapPin as MapPinIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDeviceCapability } from '../hooks/useDeviceCapability';
import { Button } from '../components/ui/Button';
import PageHead from '../components/PageHead';
import type { Vehicle, Testimonial } from '../types';
import { formatPrice } from '../utils/format';
import type { VehicleColor } from '../components/InteractiveColorCustomizer';
import { FilterAnimations } from '../components/FilterAnimations';
import { ScrollReveal, StaggerContainer, staggerItemVariants } from '../components/motion';

// CarFocusCarousel, flip-card showcase and duplicate grids removed (Phase A):
// single unified <FeaturedVehicles /> is the only featured showcase.
const MorphingShapeTransition = lazy(() => import('../components/MorphingShapeTransition').then(m => ({ default: m.MorphingShapeTransition })));
const AnimatedComparisonSlider = lazy(() => import('../components/AnimatedComparisonSlider').then(m => ({ default: m.AnimatedComparisonSlider })));
// Floating/background animations intentionally disabled on the homepage to keep it static and distraction-free.
const InteractiveColorCustomizer = lazy(() => import('../components/InteractiveColorCustomizer').then(m => ({ default: m.InteractiveColorCustomizer })));
const ComparisonSidebar = lazy(() => import('../components/ComparisonSidebar').then(m => ({ default: m.ComparisonSidebar })));
import { LazySection } from '../components/LazySection';
import FeaturedVehicles from '../components/home/FeaturedVehicles';
import { PerformanceGauge } from '../components/PerformanceGauge';
import BrandShowcase3D from '../components/BrandShowcase3D';

// ─── Only CarShowcase3D stays lazy (pulls in three.js ≈ 1 MB) ─────
// const CarShowcase3D = lazy(() => import('../components/3d/CarShowcase3D'));

// ─── Video Hero (primary) ─────────────────────────────────────────
const VideoHero = ({ children }: { children: React.ReactNode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Ensure video is always playing: covers tab switch, back/forward,
  // mobile background/foreground, orientation change, and SPA navigation.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Respect reduced motion preference
    if (prefersReducedMotion) {
      v.pause();
      return;
    }

    const resume = () => {
      if (v.paused && !document.hidden) {
        v.play().catch(() => {});
      }
    };

    // Immediately try to play on mount
    resume();

    const onVisibility = () => { if (!document.hidden) resume(); };
    const onFocus = () => resume();
    const onPageShow = () => resume();          // bfcache restore
    const onPopState = () => setTimeout(resume, 50); // SPA back/forward

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('popstate', onPopState);

    // P-04 fix: remove aggressive 3s keepAlive interval (battery drain), rely on events only
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('popstate', onPopState);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Subtle Ken Burns drift: very slow zoom + pan for a living feel */}
      <div
        className="absolute inset-[-2%] animate-hero-drift will-change-transform"
        style={{
          animationPlayState: prefersReducedMotion ? 'paused' : 'running',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          disablePictureInPicture
          disableRemotePlayback
          controls={showControls}
          onPlaying={() => setVideoReady(true)}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: videoReady ? 1 : 0, transition: 'opacity 0.3s ease-in' }}
        >
          <source src={`${import.meta.env.BASE_URL}hero/toyota-promo-1080p.webm`} type="video/webm" />
          <source src={`${import.meta.env.BASE_URL}hero/toyota-promo-1080p.mp4`} type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/60" aria-hidden="true" />
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {children}
      </div>
    </div>
  );
};

// Hook for prefers-reduced-motion
function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

// ─── Lightweight Hero Fallback for very low-end devices ───────────
const LightweightHero = ({
  language,
  t,
}: {
  language: string;
  t: (key: string) => string;
}) => (
  <div className="relative h-dvh flex items-center justify-center overflow-hidden hero-lite-bg">
    <div className="absolute inset-0 hero-lite-overlay" aria-hidden="true" />
    <img
                src={`${import.meta.env.BASE_URL}hero/hero-poster.webp`}
      alt="Premium car showcase"
      className="absolute inset-0 w-full h-full object-cover opacity-30"
      loading="eager"
      decoding="async"
      width={800}
      height={600}
    />
    <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 hero-text-shadow">
        {language === 'en' ? 'Premium Cars in Rajshahi' : 'রাজশাহীতে প্রিমিয়াম গাড়ি'}
      </h1>
      <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
        {language === 'en'
          ? "North Bengal's most trusted premium car dealership since 2014."
          : 'উত্তরবঙ্গের সবচেয়ে বিশ্বস্ত প্রিমিয়াম গাড়ির শোরুম, ২০১৪ থেকে।'}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/inventory">
          <Button size="lg">{t('hero.browse')}<ArrowRight className="ml-2 h-5 w-5" /></Button>
        </Link>
        <Link to="/services">
          <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-gray-900">
            {t('hero.book_service')}
          </Button>
        </Link>
        <Link to="/sell">
          <Button size="lg" variant="secondary">{t('hero.sell')}</Button>
        </Link>
      </div>
    </div>
  </div>
);


// (Removed unused SmallPlaceholder and StatCard helpers to avoid including
// extra code in the initial bundle; they were not referenced anywhere.)
// Phase A: duplicate flip-card showcase, SHOWCASE_VEHICLES + CAROUSEL_IMAGES removed,
// single unified <FeaturedVehicles /> is the only featured showcase.

// ─── ScrollReveal replaces old FadeIn: uses Framer Motion whileInView ──

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export const HomePage = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const device = useDeviceCapability();

  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  // Drives the Performance Overview gauges below; showcase sections removed (Phase A).
  const [showcaseVehicle] = useState<string>('harrier');
  const [comparisonVehicles, setComparisonVehicles] = useState<Vehicle[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedVehicleColor, setSelectedVehicleColor] = useState<VehicleColor | null>(null);
  const [filteredResultCount, setFilteredResultCount] = useState(450);

  const featuredSectionRef = useRef<HTMLDivElement>(null);

  // ── Scroll-linked hero effects ──
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.1]);
  const heroBlur = useTransform(scrollY, [0, 400], [0, 8]);
  const heroBlurFilter = useMotionTemplate`blur(${heroBlur}px)`;


  useEffect(() => {
    fetchFeaturedVehicles();
    fetchTestimonials();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToContent = () => {
    featuredSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchFeaturedVehicles = useCallback(async () => {
    try {
      const { supabase, isSupabaseConfigured } = await import('../lib/supabase');
      // No backend configured: keep the curated carSlides fallback without
      // throwing, so the browser console stays clean.
      if (!isSupabaseConfigured() || !supabase) {
        setFeaturedVehicles([]);
        return;
      }
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, images:vehicle_images(*)')
        .eq('is_featured', true)
        .eq('is_available', true)
        .limit(6);
      if (error) {
        if (import.meta.env.DEV) console.warn('fetchFeaturedVehicles supabase error:', error);
        setFeaturedVehicles([]);
        return;
      }
      if (data) setFeaturedVehicles(data);
    } catch (err) {
      // Network or import errors: fail gracefully and use the local fallback.
      if (import.meta.env.DEV) console.warn('fetchFeaturedVehicles failed:', err);
      setFeaturedVehicles([]);
    }
  }, []);

  const fetchTestimonials = useCallback(async () => {
    try {
      const { supabase, isSupabaseConfigured } = await import('../lib/supabase');
      // No backend configured: render without testimonials, no console error.
      if (!isSupabaseConfigured() || !supabase) {
        setTestimonials([]);
        return;
      }
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_approved', true)
        .eq('is_featured', true)
        .limit(3);
      if (error) {
        if (import.meta.env.DEV) console.warn('fetchTestimonials supabase error:', error);
        setTestimonials([]);
        return;
      }
      if (data) setTestimonials(data);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('fetchTestimonials failed:', err);
      setTestimonials([]);
    }
  }, []);

  const handleAddToComparison = (vehicle: Vehicle) => {
    if (!comparisonVehicles.find(v => v.id === vehicle.id)) {
      setComparisonVehicles(prev => [...prev, vehicle]);
      setShowComparison(true);
      import('../utils/AudioManager').then(m => m.AudioManager.playClick());
    }
  };

  const handleRemoveFromComparison = (vehicleId: string) => {
    setComparisonVehicles(prev => prev.filter(v => v.id !== vehicleId));
  };

  const handleExportComparison = () => {
    const text = comparisonVehicles.map(v => `${v.model}\n${v.price.toLocaleString()}\n`).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })),
      download: 'vehicle_comparison.txt',
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleFilterChange = (filters: Record<string, string[]>) => {
    let count = 450;
    if (filters.bodyType?.length) count = Math.max(100, 450 - filters.bodyType.length * 50);
    if (filters.fuelType?.length) count = Math.max(50, count - filters.fuelType.length * 30);
    if (filters.priceRange?.length) count = Math.max(20, count - filters.priceRange.length * 60);
    setFilteredResultCount(count);
  };

  // Color customizer colors (extracted to avoid repetition)
  const vehicleColors: Record<string, VehicleColor[]> = {
    prado: [
      { name: 'Pearl White', hex: '#F5F5F5', rgb: '245,245,245', filterClass: 'brightness(1.1) saturate(0.8)', image: `${import.meta.env.BASE_URL}customize-cars/prado/white.webp` },
      { name: 'Black Metallic', hex: '#1A1A1A', rgb: '26,26,26', filterClass: 'brightness(0.7) contrast(1.2)', image: `${import.meta.env.BASE_URL}customize-cars/prado/black.webp` },
      { name: 'Steel Blue', hex: '#4A6FA5', rgb: '74,111,165', filterClass: 'hue-rotate(200deg) saturate(1.2)', image: `${import.meta.env.BASE_URL}customize-cars/prado/blue.webp` },
      { name: 'Crimson Red', hex: '#DC143C', rgb: '220,20,60', filterClass: 'hue-rotate(-30deg) saturate(1.3)', image: `${import.meta.env.BASE_URL}customize-cars/prado/red.webp` },
      { name: 'Forest Green', hex: '#228B22', rgb: '34,139,34', filterClass: 'hue-rotate(120deg) saturate(1.1)', image: `${import.meta.env.BASE_URL}customize-cars/prado/green.webp` },
      { name: 'Gold', hex: '#FFD700', rgb: '255,215,0', filterClass: 'hue-rotate(40deg) saturate(1.4)', image: `${import.meta.env.BASE_URL}customize-cars/prado/gold.webp` },
    ],
    harrier: [
      { name: 'Pearl White', hex: '#F5F5F5', rgb: '245,245,245', filterClass: 'brightness(1.1) saturate(0.8)', image: `${import.meta.env.BASE_URL}customize-cars/harrier/pearl.webp` },
      { name: 'Black Metallic', hex: '#1A1A1A', rgb: '26,26,26', filterClass: 'brightness(0.7) contrast(1.2)', image: `${import.meta.env.BASE_URL}customize-cars/harrier/black.webp` },
      { name: 'Silver', hex: '#C0C0C0', rgb: '192,192,192', filterClass: 'brightness(1) saturate(0.5)', image: `${import.meta.env.BASE_URL}customize-cars/harrier/silver.webp` },
      { name: 'Midnight Purple', hex: '#2D1B4E', rgb: '45,27,78', filterClass: 'hue-rotate(280deg) saturate(1.2)', image: `${import.meta.env.BASE_URL}customize-cars/harrier/purple.webp` },
      { name: 'Steel Blue', hex: '#0066CC', rgb: '0,102,204', filterClass: 'hue-rotate(200deg) saturate(1.1)', image: `${import.meta.env.BASE_URL}customize-cars/harrier/blue.webp` },
      { name: 'Charcoal Grey', hex: '#36454F', rgb: '54,69,79', filterClass: 'brightness(0.85) saturate(0.6)', image: `${import.meta.env.BASE_URL}customize-cars/harrier/grey.webp` },
    ],
    crown: [
      { name: 'Pearl White', hex: '#F5F5F5', rgb: '245,245,245', filterClass: 'brightness(1.1) saturate(0.8)', image: `${import.meta.env.BASE_URL}customize-cars/crown/pearl.webp` },
      { name: 'Midnight Black', hex: '#0D0D0D', rgb: '13,13,13', filterClass: 'brightness(0.5) contrast(1.3)', image: `${import.meta.env.BASE_URL}customize-cars/crown/black.webp` },
      { name: 'Burgundy Red', hex: '#800020', rgb: '128,0,32', filterClass: 'hue-rotate(-40deg) saturate(1.2)', image: `${import.meta.env.BASE_URL}customize-cars/crown/red.webp` },
      { name: 'Deep Blue', hex: '#00008B', rgb: '0,0,139', filterClass: 'hue-rotate(220deg) saturate(1.3)', image: `${import.meta.env.BASE_URL}customize-cars/crown/blue.webp` },
      { name: 'Titanium Grey', hex: '#A9ACB5', rgb: '169,172,181', filterClass: 'brightness(0.95) saturate(0.4)', image: `${import.meta.env.BASE_URL}customize-cars/crown/grey.webp` },
      { name: 'Champagne Gold', hex: '#F7E7CE', rgb: '247,231,206', filterClass: 'hue-rotate(30deg) saturate(1.2)', image: `${import.meta.env.BASE_URL}customize-cars/crown/silver.webp` },
    ],
  };

  // Models to show in the Personalize section
  const personalizeModels = ['prado','harrier','crown'] as const;

  // Choose a distinct color name for each model on load and rotate periodically
  const [initialColors, setInitialColors] = useState<Record<string, string>>({});

  const pickUniqueColors = useCallback(() => {
    const result: Record<string, string> = {};
    const used = new Set<string>();
    personalizeModels.forEach((model) => {
      const colors = vehicleColors[model];
      if (!colors || colors.length === 0) return;
      const names = colors.map(c => c.name);
      let available = names.filter(n => !used.has(n));
      if (available.length === 0) available = names;
      const pick = available[Math.floor(Math.random() * available.length)];
      result[model] = pick;
      used.add(pick);
    });
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Pick once per visit — no background rotation, no involuntary re-render.
    setInitialColors(pickUniqueColors());
  }, [pickUniqueColors]);

  return (
    <div className="min-h-dvh bg-background">
      <PageHead path="/" />

        {/* ══ HERO ══════════════════════════════════════════════════ */}
        <section className="relative h-dvh overflow-hidden">
          {/* Scroll-linked parallax background */}
          <motion.div
            className="absolute inset-0"
            style={{ opacity: heroOpacity, scale: heroScale, filter: heroBlurFilter }}
          >
            {device.supports3D ? (
              <VideoHero>
                <div className="flex flex-col items-center gap-6 text-center px-4">
                  <h1 className="text-[clamp(1.75rem,1.2rem+2.5vw,3.25rem)] font-bold leading-tight text-white text-balance max-w-3xl hero-text-shadow">
                    {language === 'en' ? 'Premium Cars in Rajshahi' : 'রাজশাহীতে প্রিমিয়াম গাড়ি'}
                  </h1>
                  <div className="flex flex-row flex-wrap gap-2 sm:gap-3 justify-center">
                    <Link to="/inventory" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow-red transition-colors hover:bg-primary/90 sm:text-sm md:text-base">
                      {t('hero.browse')}<ArrowRight className="ml-1.5 h-3.5 w-3.5 md:h-5 md:w-5" aria-hidden />
                    </Link>
                    <Link to="/services" className="inline-flex items-center px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 font-semibold rounded-xl text-xs sm:text-sm md:text-base transition-all">
                      {t('hero.book_service')}
                    </Link>
                    <Link to="/sell" className="inline-flex items-center px-5 py-2.5 bg-white/5 border border-white/10 text-white hover:bg-white/10 font-semibold rounded-xl text-xs sm:text-sm md:text-base transition-all">
                      {t('hero.sell')}
                    </Link>
                  </div>
                </div>
              </VideoHero>
            ) : (
              <LightweightHero language={language} t={t} />
            )}
          </motion.div>

          {/* Noise overlay */}
          <div className="absolute inset-0 noise-overlay pointer-events-none z-[5]" />

          {/* Vignette */}
          <div className="absolute inset-0 vignette pointer-events-none z-[6]" />

          {/* Scroll indicator */}
          <motion.button
            onClick={scrollToContent}
            aria-label="Scroll to content"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 z-10 hidden md:flex flex-col items-center gap-1"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
            <ChevronDown className="h-5 w-5" />
          </motion.button>
        </section>

        {/* ══ FEATURED VEHICLES: single unified showcase (DB with carSlides fallback) ═ */}
        <div ref={featuredSectionRef}>
          <LazySection minHeight="500px" rootMargin="300px">
            <FeaturedVehicles
              vehicles={featuredVehicles}
              theme={theme}
              language={language}
              supportsRichAnimations={device.supportsRichAnimations}
              onAddToCompare={handleAddToComparison}
            />
          </LazySection>
        </div>

        {/* ══ BRAND SHOWCASE (3D) ═══════════════════════════════════ */}
        <BrandShowcase3D />

        {/* ══ FILTER / SORT ════════════════════════════════════════ */}
        <section className={`section-padding relative overflow-hidden ${
          theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-white to-gray-50'
        }`}>
          <div className="container-fluid">
            <ScrollReveal className="mb-6">
              <h2 className={`text-2xl sm:text-3xl font-bold mb-3 text-foreground`}>
                {language === 'en' ? 'Find Your Perfect Vehicle' : 'আপনার নিখুঁত গাড়ি খুঁজুন'}
              </h2>
            </ScrollReveal>
            <FilterAnimations
              filters={[
                {
                  name: language === 'en' ? 'Price Range' : 'মূল্য পরিসীমা',
                  key: 'priceRange',
                  options: [
                    { id: 'budget', label: language === 'en' ? 'Under ৳20L' : '৳20L এর নিচে' },
                    { id: 'mid', label: '৳20L - ৳40L' },
                    { id: 'premium', label: '৳40L - ৳60L' },
                    { id: 'luxury', label: '৳60L+' },
                  ],
                },
                {
                  name: language === 'en' ? 'Body Type' : 'বডি টাইপ',
                  key: 'bodyType',
                  options: [
                    { id: 'sedan', label: language === 'en' ? 'Sedan' : 'সেডান' },
                    { id: 'suv', label: 'SUV' },
                    { id: 'crossover', label: language === 'en' ? 'Crossover' : 'ক্রসওভার' },
                    { id: 'mpv', label: language === 'en' ? 'MPV/Van' : 'এমপিভি/ভ্যান' },
                  ],
                },
                {
                  name: language === 'en' ? 'Fuel Type' : 'জ্বালানির ধরন',
                  key: 'fuelType',
                  options: [
                    { id: 'petrol', label: language === 'en' ? 'Petrol' : 'পেট্রোল' },
                    { id: 'diesel', label: language === 'en' ? 'Diesel' : 'ডিজেল' },
                    { id: 'hybrid', label: language === 'en' ? 'Hybrid' : 'হাইব্রিড' },
                  ],
                },
              ]}
              onFilterChange={handleFilterChange}
              resultCount={filteredResultCount}
              theme={theme}
              language={language}
            />
          </div>
        </section>

        {/* ══ COLOR CUSTOMIZER ══════════════════════════════════════ */}
        <LazySection minHeight="400px" rootMargin="200px">
          <section className={`section-padding bg-background`}>
            <div className="container-fluid">
              <ScrollReveal className="mb-8">
                <h2 className={`heading-responsive font-bold mb-4 text-foreground`}>
                  {language === 'en' ? 'Personalize Your Vehicle' : 'আপনার গাড়ি ব্যক্তিগতকৃত করুন'}
                </h2>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(['prado','harrier','crown'] as const).map((model, i) => {
                  const imgs: Record<string, string> = {
                    prado: `${import.meta.env.BASE_URL}customize-cars/prado/white.webp`,
                    harrier: `${import.meta.env.BASE_URL}customize-cars/harrier/pearl.webp`,
                    crown: `${import.meta.env.BASE_URL}customize-cars/crown/pearl.webp`,
                  };
                  return (
                    <ScrollReveal key={model} delay={i * 0.1}>
                      <InteractiveColorCustomizer
                        vehicleImage={imgs[model]}
                        vehicleModel={model}
                        availableColors={vehicleColors[model]}
                        theme={theme}
                        language={language}
                        initialColorName={initialColors[model]}
                        onColorSelect={(color: VehicleColor) => {
                          setSelectedVehicleColor(color);
                          import('../utils/AudioManager').then(m => m.AudioManager.playClick());
                        }}
                      />
                    </ScrollReveal>
                  );
                })}
              </div>

              {selectedVehicleColor && (
                <div className={`mt-8 p-4 rounded-xl border bg-muted border-border`}>
                  <p className={`text-sm text-muted-foreground`}>
                    {language === 'en'
                      ? `Selected: ${selectedVehicleColor.name}. Your preference has been saved.`
                      : `নির্বাচিত: ${selectedVehicleColor.name}। আপনার পছন্দ সংরক্ষিত হয়েছে।`}
                  </p>
                </div>
              )}
            </div>
          </section>
        </LazySection>

        {/* ══ MORPHING (only on capable devices) ═══════════════════ */}
        {device.supportsRichAnimations && (
          <LazySection minHeight="400px" rootMargin="200px">
            <section className={`section-padding bg-muted/30`}>
              <div className="container-fluid">
                <ScrollReveal className="mb-8">
                  <h2 className={`heading-responsive font-bold mb-4 text-foreground`}>
                    {language === 'en' ? 'Morphing Showcase' : 'আকৃতি-পরিবর্তনকারী শোকেস'}
                  </h2>
                </ScrollReveal>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <MorphingShapeTransition
                    images={[
                      { src: `${import.meta.env.BASE_URL}customize-cars/prado/white.webp`, name: 'Toyota Prado' },
                      { src: `${import.meta.env.BASE_URL}customize-cars/harrier/pearl.webp`, name: 'Toyota Harrier' },
                      { src: `${import.meta.env.BASE_URL}customize-cars/crown/pearl.webp`, name: 'Toyota Crown' },
                      { src: `${import.meta.env.BASE_URL}customize-cars/prado/black.webp`, name: 'Toyota Prado Black' },
                    ]}
                    shapes="blob"
                    theme={theme}
                    language={language}
                  />
                  <MorphingShapeTransition
                    images={[
                      { src: `${import.meta.env.BASE_URL}customize-cars/harrier/black.webp`, name: 'Toyota Harrier Black' },
                      { src: `${import.meta.env.BASE_URL}customize-cars/crown/black.webp`, name: 'Toyota Crown Black' },
                      { src: `${import.meta.env.BASE_URL}customize-cars/prado/silver.webp`, name: 'Toyota Prado Silver' },
                      { src: `${import.meta.env.BASE_URL}customize-cars/harrier/white.webp`, name: 'Toyota Harrier White' },
                    ]}
                    shapes="diamond"
                    theme={theme}
                    language={language}
                  />
                </div>
              </div>
            </section>
          </LazySection>
        )}

        {/* ══ WHY CHOOSE US ═════════════════════════════════════════ */}

        {/* ══ COMPARISON SLIDER (only on capable devices) ══════════ */}
        {device.supportsRichAnimations && (
          <section className={`section-padding bg-muted/30`}>
            <div className="container-fluid">
              <ScrollReveal className="mb-8">
                <h2 className={`heading-responsive font-bold mb-4 text-foreground`}>
                  {language === 'en' ? 'Standard vs Premium' : 'স্ট্যান্ডার্ড বনাম প্রিমিয়াম'}
                </h2>
              </ScrollReveal>
              <AnimatedComparisonSlider
                standardImage={`${import.meta.env.BASE_URL}customize-cars/harrier/pearl.webp`}
                premiumImage={`${import.meta.env.BASE_URL}customize-cars/harrier/pearl.webp`}
                standardModel={language === 'en' ? 'Harrier Standard' : 'হ্যারিয়ার স্ট্যান্ডার্ড'}
                premiumModel={language === 'en' ? 'Harrier Premium' : 'হ্যারিয়ার প্রিমিয়াম'}
                specs={[
                  { label: language === 'en' ? 'Engine' : 'ইঞ্জিন', standard: '2.5L Petrol', premium: '2.5L Hybrid', isNew: true, highlight: true },
                  { label: language === 'en' ? 'Fuel Efficiency' : 'জ্বালানি দক্ষতা', standard: '12.5 km/l', premium: '17.5 km/l', isNew: true, highlight: true },
                  { label: language === 'en' ? 'Horsepower' : 'হর্সপাওয়ার', standard: '206 HP', premium: '246 HP', isNew: true },
                  { label: language === 'en' ? 'Safety' : 'নিরাপত্তা', standard: '6 Airbags', premium: '8 Airbags + ABS', isNew: true },
                  { label: language === 'en' ? 'Warranty' : 'ওয়ারেন্টি', standard: '2 Years', premium: '3 Years Extended', isNew: true },
                ]}
                theme={theme}
                language={language}
              />
            </div>
          </section>
        )}

        {/* ══ PERFORMANCE METRICS ═══════════════════════════════════ */}
        <section className={`section-padding bg-background`}>
          <div className="container-fluid">
            <ScrollReveal className="mb-8">
              <h2 className={`heading-responsive font-bold mb-4 text-foreground`}>
                {language === 'en' ? 'Performance Overview' : 'পারফরম্যান্স ওভারভিউ'}
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: language === 'en' ? 'Horsepower' : 'হর্সপাওয়ার', values: { prado:282,harrier:246,crown:248,yaris:120,chr:144,premio:110,noah:144 }, icon: <Zap className="w-6 h-6" />, color: 'text-primary' },
                { label: language === 'en' ? 'Fuel Efficiency' : 'জ্বালানি দক্ষতা', values: { prado:10,harrier:17,crown:16,yaris:20,chr:18,premio:21,noah:18 }, icon: <Fuel className="w-6 h-6" />, color: 'text-primary', unit: 'km/l' },
                { label: language === 'en' ? 'Safety Rating' : 'সেফটি রেটিং', values: { prado:5,harrier:5,crown:5,yaris:4,chr:4,premio:4,noah:4 }, icon: <Shield className="w-6 h-6" />, color: 'text-primary', unit: '/5' },
                { label: language === 'en' ? 'Value Rating' : 'মূল্য রেটিং', values: { prado:95,harrier:92,crown:90,yaris:88,chr:85,premio:90,noah:87 }, icon: <Award className="w-6 h-6" />, color: 'text-primary' },
              ].map((metric, index) => (
                <ScrollReveal key={index} delay={index * 0.1}>
                  <PerformanceGauge
                    label={metric.label}
                    value={(metric.values as Record<string, number>)[showcaseVehicle] ?? 100}
                    icon={metric.icon}
                    color={metric.color}
                    unit={metric.unit ?? ''}
                  />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ WHY CHOOSE US ═════════════════════════════════════════ */}
        <section className={`section-padding ${theme === 'dark' ? 'bg-gray-900/90' : 'bg-white'}`}>
          <div className="container-fluid">
            <ScrollReveal className="mb-8">
              <h2 className={`heading-responsive font-bold mb-4 text-foreground`}>
                {language === 'en' ? 'Why Choose Auto Spark BD?' : 'কেন অটো স্পার্ক বিডি?'}
              </h2>
            </ScrollReveal>
            <StaggerContainer className="grid grid-cols-1 gap-6 md:grid-cols-3" stagger={0.12}>
              {[
                { icon: Car, title: language === 'en' ? 'Premium Selection' : 'প্রিমিয়াম নির্বাচন', desc: language === 'en' ? 'Carefully curated luxury and premium vehicles' : 'সাবধানে নির্বাচিত বিলাসবহুল গাড়ির সংগ্রহ' },
                { icon: Shield, title: language === 'en' ? 'Quality Assurance' : 'মান নিশ্চিতকরণ', desc: language === 'en' ? 'Thorough inspection and certification for every vehicle' : 'প্রতিটি গাড়ির জন্য পুঙ্খানুপুঙ্খ পরিদর্শন' },
                { icon: Wrench, title: language === 'en' ? 'Expert Service' : 'বিশেষজ্ঞ সেবা', desc: language === 'en' ? 'State-of-the-art service center with experienced technicians' : 'অভিজ্ঞ প্রযুক্তিবিদদের সাথে অত্যাধুনিক সার্ভিস সেন্টার' },
              ].map((f, i) => (
                <motion.div key={i} variants={staggerItemVariants} className="h-full">
                  <div className="flex h-full flex-col items-center rounded-2xl border border-border bg-card p-8 text-center transition-colors duration-300 hover:border-primary/40">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <f.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mb-3 text-lg font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ══ TESTIMONIALS ══════════════════════════════════════════ */}
        {testimonials.length > 0 && (
          <section className={`section-padding ${theme === 'dark' ? 'bg-gray-900/80' : 'bg-gray-50'}`}>
            <div className="container-fluid">
              <ScrollReveal className="mb-6">
                <h2 className={`heading-responsive font-bold mb-4 text-foreground`}>
                  {language === 'en' ? 'What Our Customers Say' : 'আমাদের গ্রাহকরা কি বলেন'}
                </h2>
              </ScrollReveal>
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8" stagger={0.12}>
                {testimonials.map((testimonial) => (
                  <motion.div key={testimonial.id} variants={staggerItemVariants}>
                    <div className="group relative rounded-2xl border border-border bg-card p-6 transition-colors duration-300 hover:border-foreground/20">
                      <div className="flex items-center mb-4">
                        {[...Array(testimonial.rating)].map((_: unknown, i: number) => (
                          <svg key={i} className="h-5 w-5 text-yellow-400 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                      </div>
                      <p className={`mb-4 leading-relaxed text-muted-foreground`}>
                        {language === 'en' ? testimonial.review_en : testimonial.review_bn || testimonial.review_en}
                      </p>
                      <div className="flex items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                          {testimonial.customer_name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className={`font-semibold text-foreground`}>
                            {language === 'en' ? testimonial.customer_name : testimonial.customer_name_bn || testimonial.customer_name}
                          </div>
                          {testimonial.vehicle_purchased && (
                            <div className={`text-sm text-muted-foreground`}>{testimonial.vehicle_purchased}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </StaggerContainer>
            </div>
          </section>
        )}

        {/* ══ MAPS ══════════════════════════════════════════════════ */}
        <section className="section-padding bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="container-fluid">
            <ScrollReveal className="mb-8">
              <h2 className="mb-6 font-display text-2xl font-bold text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
                {language === 'en' ? 'Visit Our Showroom' : 'আমাদের শোরুম পরিদর্শন করুন'}
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
              {/* Address + hours */}
              <div className="flex flex-col gap-5">
                {[
                  {
                    icon: <MapPinIcon className="h-8 w-8 text-primary" />,
                    title: language === 'en' ? 'Address' : 'ঠিকানা',
                    content: 'AutoSpark, Station Road, Near Shuvo Petroleum, Sheroil, Ghoramara, Boalia, Rajshahi 6207',
                  },
                  {
                    icon: <Clock className="h-8 w-8 text-primary" />,
                    title: language === 'en' ? 'Business Hours' : 'ব্যবসায়িক সময়',
                    content: t('contact.hours_value'),
                  },
                  {
                    icon: <Phone className="h-8 w-8 text-primary" />,
                    title: language === 'en' ? 'Contact' : 'যোগাযোগ',
                    content: '+880 1760-401605 | autosparkbd@gmail.com',
                  },
                ].map(card => (
                  <div key={card.title} className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0">{card.icon}</span>
                      <div>
                        <h3 className="mb-1 font-semibold text-foreground">{card.title}</h3>
                        <p className="text-sm text-muted-foreground">{card.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <a
                  href="https://www.google.com/maps/place/Auto+Spark/@24.3744264,88.6135805,17z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-center font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <MapPinIcon className="w-5 h-5" />
                  {language === 'en' ? 'Get Directions on Google Maps' : 'গুগল ম্যাপে দিকনির্দেশনা পান'}
                </a>
              </div>

              {/* Map embed: loaded lazily */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl min-h-[350px] sm:min-h-[400px]">
                <iframe
                  title="Auto Spark Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3644.7574123456!2d88.6135805!3d24.3744264!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fbeffd47dfded9%3A0x46c8c45692f9a6c1!2sAuto%20Spark!5e0!3m2!1sen!2sbd!4v1234567890123"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '350px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Dual maps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl overflow-hidden shadow-md">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3634.3846758707845!2d88.60447931496736!3d24.374532984292816!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fbefa96a38d031%3A0x10f93a950ed6b5f9!2sStation%20Road%2C%20Rajshahi!5e0!3m2!1sen!2sbd!4v1234567890"
                  width="100%" height="280" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  title="Showroom map"
                />
                <p className="bg-card py-2 text-center text-sm font-semibold text-foreground">
                  {language === 'en' ? 'Showroom: Station Road, Rajshahi' : 'শোরুম: স্টেশন রোড, রাজশাহী'}
                </p>
              </div>
              <div className="rounded-xl overflow-hidden shadow-md">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3634.3846758707845!2d88.6346711!3d24.3817492!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fbf17f21c0ee57:0x373f79532c58e48a!2sAuto+Spark+Service+Center!5e0!3m2!1sen!2sbd!4v1709999999999"
                  width="100%" height="280" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  title="Service center map"
                />
                <p className="bg-card py-2 text-center text-sm font-semibold text-foreground">
                  {language === 'en' ? 'Service Center: Meherchandi, Rajshahi' : 'সার্ভিস সেন্টার: মেহেরচণ্ডী, রাজশাহী'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CTA ═══════════════════════════════════════════════════ */}
        <section className="section-padding bg-primary">
          <div className="container-fluid">
            <ScrollReveal>
              <h2 className="max-w-2xl text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                {language === 'en' ? 'Ready to find your next car?' : 'আপনার পরবর্তী গাড়ি খুঁজে পেতে প্রস্তুত?'}
              </h2>
              <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
                {language === 'en' ? 'Browse current stock or visit the showroom in Rajshahi.' : 'বর্তমান স্টক দেখুন বা রাজশাহীতে শোরুম পরিদর্শন করুন।'}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/inventory" className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-7 py-3 font-semibold text-primary transition-colors hover:bg-white/90">
                  {language === 'en' ? 'Browse inventory' : 'ইনভেন্টরি দেখুন'}
                </Link>
                <Link to="/contact" className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/40 px-7 py-3 font-semibold text-white transition-colors hover:bg-white/10">
                  {language === 'en' ? 'Contact us' : 'যোগাযোগ করুন'}
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══ COMPARISON SIDEBAR ════════════════════════════════════ */}
        <Suspense fallback={null}>
          <ComparisonSidebar
          vehicles={comparisonVehicles.map(v => ({
            id: v.id,
            name: v.model,
            price: formatPrice(v.price),
            engine: v.engine_capacity || 'N/A',
            fuel: v.fuel_type || 'Petrol',
            transmission: v.transmission || 'Automatic',
          }))}
          isOpen={showComparison}
          onToggle={() => setShowComparison(p => !p)}
          onRemove={handleRemoveFromComparison}
          onExport={handleExportComparison}
          theme={theme}
          language={language}
        />
        </Suspense>
      </div>
  );
};
