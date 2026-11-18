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
  },
  {
    name: 'HONDA',
    headline: 'PRECISION IN EVERY DETAIL',
    description: 'Discover Honda\'s distinctive approach to automotive engineering, contemporary styling and everyday driving excellence.',
    ctaText: 'EXPLORE HONDA',
    ctaLink: '/honda',
    image: '/honda-showcase.jpg',
  },
  {
    name: 'NISSAN',
    headline: 'MOVE WITH CONFIDENCE',
    description: 'Explore Nissan\'s innovative automotive collection, combining distinctive design, intelligent technology and everyday versatility.',
    ctaText: 'EXPLORE NISSAN',
    ctaLink: '/nissan',
    image: '/nissan-showcase.jpg',
  },
];

export default function BrandShowcase3D() {
  return (
    <section
      className="relative overflow-hidden py-16 sm:py-20 md:py-24 bg-gradient-to-b from-[#0a0a0a] via-[#0d0d0d] to-[#111111]"
    >
      <div className="pointer-events-none absolute inset-0" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Brand spotlights grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">

          {BRAND_SPOTLIGHTS.map((spotlight) => {
            // Determine accent classes based on brand
            return (
              <article
                key={spotlight.name}
                className={`group rounded-2xl overflow-hidden bg-gradient-to-br from-[#15171B] via-[#1C1F24] to-[#292D34] border border-[#353A42] hover:border-${spotlight.name.toLowerCase()} transition-colors duration-500 shadow-xl hover:shadow-[0_25px_50px_rgba(214,0,28,0.3)]`}
              >
                {/* Image header */}
                <div className="h-48 sm:h-56 relative overflow-hidden">
                  <img
                    src={spotlight.image}
                    alt={spotlight.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Accent overlay */}
                  <div className={`absolute inset-0 from-${spotlight.name.toLowerCase()}-600 to-${spotlight.name.toLowerCase()}-700 opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full bg-${spotlight.name.toLowerCase()}-600`} />
                    <span className={`text-sm font-semibold uppercase tracking-wider text-${spotlight.name.toLowerCase()}-600 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      {spotlight.name}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold leading-tight mb-3 text-white">
                    {spotlight.headline}
                  </h3>
                  <p className="text-white/60 sm:text-white/70 leading-relaxed mb-5">
                    {spotlight.description}
                  </p>

                  {/* CTA */}
                  <div className="flex gap-2">
<Link
                      to={spotlight.ctaLink}
                      className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 font-semibold text-white transition-all duration-200 bg-white/5 border border-white/10 hover:border-${spotlight.name.toLowerCase()}-600/10 hover:bg-${spotlight.name.toLowerCase()}-600/10`}
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

        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-red-500/5 blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-red-500/5 blur-3xl opacity-20" />

      </div>
    </section>
  );
}