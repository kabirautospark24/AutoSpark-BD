import { useState } from 'react';

const BRANDS: { name: string; logo: string }[] = [
  { name: 'DESCO', logo: 'https://sslcommerz.com/wp-content/uploads/2024/03/desco.svg' },
  { name: 'Grameenphone', logo: 'https://sslcommerz.com/wp-content/uploads/2024/03/Grameenphone.svg' },
  { name: 'Novoair', logo: 'https://sslcommerz.com/wp-content/uploads/2024/03/Novoair-1.svg' },
  { name: 'US-Bangla Airlines', logo: 'https://sslcommerz.com/wp-content/uploads/2026/06/us-bangla-airlines-1.jpg' },
  { name: 'BD Tickets', logo: 'https://sslcommerz.com/wp-content/uploads/2026/06/bd-tickets.jpg' },
  { name: 'Shohoz', logo: 'https://sslcommerz.com/wp-content/uploads/2024/03/shohoz-vector-logo.svg' },
  { name: 'Honda', logo: 'https://sslcommerz.com/wp-content/uploads/2024/05/honda-300x150.png' },
  { name: 'Dhaka University', logo: 'https://sslcommerz.com/wp-content/uploads/2024/05/du-300x150.png' },
  { name: 'UNICEF', logo: 'https://sslcommerz.com/wp-content/uploads/2026/06/unicef.jpg' },
  { name: 'Biddanondo', logo: 'https://sslcommerz.com/wp-content/uploads/2024/05/biddanondo-300x150.png' },
  { name: 'Domino’s', logo: 'https://sslcommerz.com/wp-content/uploads/2024/05/dominos-300x150.png' },
  { name: 'LankaBangla Finance', logo: 'https://sslcommerz.com/wp-content/uploads/2024/05/lankabangla-finance-300x150.jpg' },
  { name: 'Toffee', logo: 'https://sslcommerz.com/wp-content/uploads/2024/05/toffee-1-300x150.png' },
  { name: 'bKash', logo: 'https://sslcommerz.com/wp-content/uploads/2024/04/bkash.svg' },
  { name: 'Nagad', logo: 'https://sslcommerz.com/wp-content/uploads/2024/04/nagad.svg' },
  { name: 'Rocket', logo: 'https://sslcommerz.com/wp-content/uploads/2024/04/rocket.svg' },
  { name: 'Visa', logo: 'https://sslcommerz.com/wp-content/uploads/2024/04/visa.svg' },
  { name: 'Mastercard', logo: 'https://sslcommerz.com/wp-content/uploads/2024/04/mastercard.svg' },
];

export default function BrandShowcase3D() {
  const [failed, setFailed] = useState<Set<string>>(new Set());

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 md:py-24 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Trusted Network
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
            Trusted by Leading Brands
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
            AutoSpark partners with Bangladesh’s largest payment gateway and the brands already powering the nation.
          </p>
        </div>

        {/* Infinite marquee row 1 */}
        <div className="relative mb-6 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10" />
          <div className="flex gap-4 sm:gap-6 animate-marquee">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <BrandCard key={`${b.name}-${i}`} brand={b} failed={failed} setFailed={setFailed} />
            ))}
          </div>
        </div>

        {/* Infinite marquee row 2 (reverse) */}
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10" />
          <div className="flex gap-4 sm:gap-6 animate-marquee-reverse">
            {[...BRANDS.slice().reverse(), ...BRANDS.slice().reverse()].map((b, i) => (
              <BrandCard key={`r-${b.name}-${i}`} brand={b} failed={failed} setFailed={setFailed} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee { animation: marquee 40s linear infinite; }
        .animate-marquee-reverse { animation: marquee-reverse 45s linear infinite; }
        .animate-marquee:hover, .animate-marquee-reverse:hover { animation-play-state: paused; }
      `}</style>
    </section>
  );
}

function BrandCard({
  brand,
  failed,
  setFailed,
}: {
  brand: { name: string; logo: string };
  failed: Set<string>;
  setFailed: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const isFailed = failed.has(brand.name);
  return (
    <div className="group shrink-0">
      <div className="w-36 sm:w-44 md:w-52 h-20 sm:h-24 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/70 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-red-500/40 transition-all duration-300 flex items-center justify-center p-4 sm:p-5">
        {isFailed ? (
          <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">
            {brand.name}
          </span>
        ) : (
          <img
            src={brand.logo}
            alt={brand.name}
            loading="lazy"
            className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
            onError={() => setFailed((s) => new Set(s).add(brand.name))}
          />
        )}
      </div>
      <p className="mt-2 text-center text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
        {brand.name}
      </p>
    </div>
  );
}
