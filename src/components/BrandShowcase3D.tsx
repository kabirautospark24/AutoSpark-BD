import { useEffect, useState } from 'react';

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
  const [radius, setRadius] = useState(260);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setRadius(w < 480 ? 150 : w < 768 ? 200 : w < 1024 ? 230 : 270);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % BRANDS.length), 2400);
    return () => clearInterval(t);
  }, [paused]);

  const n = BRANDS.length;
  const cardW = radius < 200 ? 120 : 160;
  const cardH = radius < 200 ? 72 : 96;

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* decorative glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-500/10 blur-3xl" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 mb-4">
            Trusted Network
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
            Trusted Brands &amp; Partners
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
            AutoSpark partners with Bangladesh\u2019s leading payment gateway and the brands already powering the nation.
          </p>
        </div>

        <div
          className="relative mx-auto"
          style={{ perspective: '1400px', height: `${Math.max(cardH + 80, 260)}px` }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${-(index * 360) / n}deg)`,
              transition: 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {BRANDS.map((b, i) => {
              const angle = (i * 360) / n;
              return (
                <div
                  key={b.name}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    width: `${cardW}px`,
                    height: `${cardH}px`,
                    marginLeft: `-${cardW / 2}px`,
                    marginTop: `-${cardH / 2}px`,
                    transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <div className="w-full h-full rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-2xl border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-center p-3 sm:p-4 hover:scale-105 transition-transform duration-300">
                    <img
                      src={b.logo}
                      alt={b.name}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain drop-shadow-sm"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = 'none';
                        const span = document.createElement('span');
                        span.className = 'text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 text-center px-2';
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

        <div className="flex justify-center gap-1.5 sm:gap-2 mt-8 flex-wrap px-4">
          {BRANDS.map((b, i) => (
            <button
              key={b.name}
              aria-label={b.name}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-6 sm:w-8 bg-red-600' : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-red-400'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
