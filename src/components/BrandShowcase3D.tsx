import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface BrandSpotlight {
  name: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  vehicleCount?: number;
}

const BRAND_SPOTLIGHTS: BrandSpotlight[] = [
  {
    name: 'TOYOTA',
    headline: 'ENGINEERED FOR EVERY JOURNEY',
    description: 'Explore the world of Toyota. From sophisticated SUVs to intelligent hybrid vehicles, discover a collection designed around performance, comfort and reliability.',
    ctaText: 'EXPLORE TOYOTA',
    ctaLink: '/toyota',
    image: '/toyota-showcase.jpg',
    vehicleCount: 47,
  },
  {
    name: 'HONDA',
    headline: 'PRECISION IN EVERY DETAIL',
    description: 'Discover Honda\'s distinctive approach to automotive engineering, contemporary styling and everyday driving excellence.',
    ctaText: 'EXPLORE HONDA',
    ctaLink: '/honda',
    image: '/honda-showcase.jpg',
    vehicleCount: 38,
  },
  {
    name: 'NISSAN',
    headline: 'MOVE WITH CONFIDENCE',
    description: 'Explore Nissan\'s innovative automotive collection, combining distinctive design, intelligent technology and everyday versatility.',
    ctaText: 'EXPLORE NISSAN',
    ctaLink: '/nissan',
    image: '/nissan-showcase.jpg',
    vehicleCount: 31,
  },
];

export default function BrandShowcase3D() {
  return (
    <section
      className="relative overflow-hidden py-24 sm:py-32 lg:py-40 bg-black/90"
    >
      <div className="pointer-events-none absolute inset-0" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 text-[var(--champagne,#C6A779)] bg-[var(--champagne,#C6A779)/10]">
              Premium Showcase
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white leading-tourjani mb-4">
              Premium Japanese Automobiles
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
              Leading exclusive car showroom in North Bengal, offering premium vehicles and expert service.
            </p>
          </div>

          {/* Brand spotlights grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">

            {BRAND_SPOTLIGHTS.map((spotlight) => {
              const isToyota = spotlight.name === 'TOYOTA';
              const isHonda = spotlight.name === 'HONDA';

              return (
                <article
                  key={spotlight.name}
                  className="group rounded-3xl overflow-hidden bg-[var(--card,#15171B)] border border-[var(--border,#353A42)] hover:border-[var(--champagne,#C6A779)] hover:shadow-[0_25px_50px_rgba(214,0,28,0.2)] transition-all duration-700 transform hover:translate-y-[-4px] hover:scale-[1.02]"
                >
                  {/* Image header with 3D parallax effect */}
                  <div
                    className="aspect-[4/3] relative overflow-hidden rounded-3xl group-hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={spotlight.image}
                      alt={spotlight.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:ease-out"
                    />
                    {/* Brand accent overlay */}
                    <div
                      className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${
                        isToyota
                          ? 'from-red-600 to-red-500'
                        : isHonda
                          ? 'from-green-600 to-green-500'
                          : 'from-blue-600 to-blue-500'
                      }`}
                    />
                    {/* Status badge */}
                    <div
                      className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card,#15171B)/80] backdrop-blur-sm border border-[var(--border,#353A42)]"
                    >
                      <span className={`w-2 h-2 rounded-full bg-${spotlight.name.toLowerCase()}-600`} />
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--champagne,#C6A779)]">
                        {spotlight.vehicleCount || 0}+ Vehicles
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 sm:p-7">
                    {/* Brand badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`w-2 h-2 rounded-full bg-${spotlight.name.toLowerCase()}-600 opacity-80`} />
                      <span className="text-sm font-semibold uppercase tracking-wider text-[var(--champagne,#C6A779)]">
                        {spotlight.name}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold leading-tight mb-3 text-white">
                      {spotlight.headline}
                    </h3>
                    <p className="text-white/60 sm:text-white/70 lg:text-white/75 leading-relaxed mb-6">
                      {spotlight.description}
                    </p>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        to={spotlight.ctaLink}
                        className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 font-semibold text-white transition-all duration-300 bg-[var(--champagne,#C6A779)] border border-white/10 hover:border-[var(--champagne,#C6A779)] hover:bg-white/10`}
                      >
                        {spotlight.ctaText}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

        </div>
      </div>

      {/* Decorative glass orbs */}
      <div className="absolute -top-4 -right-4 w-64 h-64 rounded-full bg-[var(--champagne,#C6A779)/5] backdrop-blur-xl opacity-30 blur-xl" />
      <div className="absolute -bottom-8 -left-4 w-48 h-48 rounded-full bg-[var(--champagne,#C6A779)/5] backdrop-blur-xl opacity-20 blur-xl" />
    </section>
  );
}