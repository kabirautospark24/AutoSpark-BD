import { useEffect, useState } from 'react';

// Brand partners showcased on sslcommerz.com — extracted logos (public URLs).
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
  { name: 'Domino\u2019s', logo: 'https://sslcommerz.com/wp-content/uploads/2024/05/dominos-300x150.png' },
  { name: 'LankaBangla Finance', logo: 'https://sslcommerz.com/wp-content/uploads/2024/05/lankabangla-finance-300x150.jpg' },
  { name: 'Toffee', logo: 'https://sslcommerz.com/wp-content/uploads/2024/05/toffee-1-300x150.png' },
  { name: 'bKash', logo: 'https://sslcommerz.com/wp-content/uploads/2024/04/bkash.svg' },
  { name: 'Nagad', logo: 'https://sslcommerz.com/wp-content/uploads/2024/04/nagad.svg' },
  { name: 'Rocket', logo: 'https://sslcommerz.com/wp-content/uploads/2024/04/rocket.svg' },
  { name: 'Visa', logo: 'https://sslcommerz.com/wp-content/uploads/2024/04/visa.svg' },
  { name: 'Mastercard', logo: 'https://sslcommerz.com/wp-content/uploads/2024/04/mastercard.svg' },
];

export default function BrandShowcase3D() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % BRANDS.length), 2200);
    return () => clearInterval(t);
  }, [paused]);

  const n = BRANDS.length;
  const radius = 260;

  return (
    <section className="section-padding relative overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container-fluid">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
            Trusted Brands &amp; Partners
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            AutoSpark partners with Bangladesh\u2019s leading payment gateway and the brands already powering the nation.
          </p>
        </div>

        <div
          className="relative mx-auto"
          style={{ perspective: '1200px', height: '320px' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${-(index * 360) / n}deg)`,
              transition: 'transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {BRANDS.map((b, i) => {
              const angle = (i * 360) / n;
              return (
                <div
                  key={b.name}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    width: '150px',
                    height: '90px',
                    marginLeft: '-75px',
                    marginTop: '-45px',
                    transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center p-3 hover:scale-105 transition-transform">
                    <img
                      src={b.logo}
                      alt={b.name}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = 'none';
                        const span = document.createElement('span');
                        span.className = 'text-xs font-bold text-gray-700 dark:text-gray-200 text-center';
                        span.textContent = b.name;
                        el.parentElement?.appendChild(span);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center gap-1.5 mt-6">
          {BRANDS.map((b, i) => (
            <button
              key={b.name}
              aria-label={b.name}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-red-600' : 'w-2 bg-gray-300 dark:bg-gray-600'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
