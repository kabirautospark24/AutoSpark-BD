/**
 * Central SEO configuration and route manifest.
 *
 * Single source of truth for:
 *  - canonical site origin (custom domain)
 *  - business details used by the LocalBusiness / AutoDealer schema
 *  - per-route title, meta description, H1, share image and breadcrumb trail
 *
 * The route manifest is consumed by:
 *  - src/components/PageHead.tsx  (runtime head tags)
 *  - scripts/prerender.mjs         (per-URL prerender, sitemap.xml, robots.txt)
 */

/**
 * Canonical site origin.
 *
 * `www.autosparkbd.com` is the host that serves a 200 response. The apex
 * `autosparkbd.com` is attached to the same Vercel project but Vercel redirects
 * it to www, so pointing canonicals, the sitemap and share images at www keeps
 * every URL a single hop from the content it describes.
 *
 * To make the apex the primary host instead: set the apex domain as primary in
 * the Vercel project settings, then change this constant back to
 * 'https://autosparkbd.com' and rebuild.
 */
export const SITE_URL = 'https://www.autosparkbd.com';

export const SITE = {
  name: 'Auto Spark BD',
  legalName: 'Auto Spark BD',
  tagline: 'Exclusive Cars in Rajshahi',
  locale: 'en_US',
  lang: 'en',
  email: 'autosparkbd@gmail.com',
  phone: '+8801760401605',
  phoneService: '+8801321233670',
  foundingYear: '2014',
  priceRange: '৳৳৳',
  sameAs: [
    'https://www.facebook.com/autosparkbd',
    'https://www.instagram.com/autosparkbd',
    'https://www.youtube.com/@autosparkbd1131',
    'https://www.tiktok.com/@auto_spark0',
  ],
  address: {
    street: 'Station Road, Near Shuvo Petroleum, Sheroil, Ghoramara, Boalia',
    locality: 'Rajshahi',
    region: 'Rajshahi Division',
    postalCode: '6207',
    country: 'BD',
  },
  geo: { lat: 24.3745, lng: 88.6042 },
  openingHours: [
    { days: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '09:00', closes: '18:00' },
  ],
  hoursDisplay: 'Sa-Th 09:00-18:00',
  logo: `${SITE_URL}/logo/logoAS3.svg`,
  defaultShareImage: `${SITE_URL}/og/og-default.png`,
} as const;

export type Breadcrumb = { name: string; path: string };

export type RouteSeo = {
  /** Route path, must match a react-router route. */
  path: string;
  /** Document title, already suffixed at render time. */
  title: string;
  /** Meta description, 140-160 characters. */
  description: string;
  /** The single visible H1 of the page. */
  h1: string;
  /** Share image path relative to the site root, e.g. /og/inventory.png */
  image?: string;
  /** Breadcrumb trail, first item is always Home. */
  breadcrumbs?: Breadcrumb[];
  /** Excluded from sitemap and marked noindex. */
  noindex?: boolean;
  /** Sitemap priority, 0-1. */
  priority?: number;
  /** Sitemap change frequency. */
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  /** Extra JSON-LD entities to merge with the business schema. */
  extraSchema?: Record<string, unknown>[];
};

const home: Breadcrumb = { name: 'Home', path: '/' };

/**
 * Every indexable route on the site. Order matters: it drives the sitemap.
 * `path` values are matched exactly against the router location pathname.
 */
export const ROUTES: RouteSeo[] = [
  {
    path: '/',
    title: 'Exclusive Cars in Rajshahi',
    description:
      'Auto Spark BD is Rajshahi premier premium car showroom. Browse quality Japanese import vehicles, certified service and genuine accessories with delivery across Bangladesh.',
    h1: 'Premium Cars in Rajshahi',
    image: '/og/home.png',
    breadcrumbs: [home],
    priority: 1.0,
    changefreq: 'weekly',
  },
  {
    path: '/inventory',
    title: 'Car Inventory',
    description:
      'Browse every car available at Auto Spark BD. Filter Japanese import vehicles by body type, price and year, then arrange a test drive at our Rajshahi showroom.',
    h1: 'Inventory',
    image: '/og/inventory.png',
    breadcrumbs: [home, { name: 'Inventory', path: '/inventory' }],
    priority: 0.9,
    changefreq: 'daily',
  },
  {
    path: '/vehicle/:id',
    title: 'Vehicle Details',
    description:
      'Full specifications, condition report, photos and pricing for this vehicle at Auto Spark BD, Rajshahi. Book a test drive or talk to our sales team today.',
    h1: 'Vehicle details',
    image: '/og/vehicle.png',
    breadcrumbs: [home, { name: 'Inventory', path: '/inventory' }, { name: 'Vehicle', path: '/vehicle' }],
    priority: 0.6,
    changefreq: 'weekly',
  },
  {
    path: '/experience',
    title: 'Virtual Showroom Experience',
    description:
      'Walk through Auto Spark BD without leaving home. Explore our Rajshahi showroom in 3D, inspect paint colours and configure your ideal vehicle in the browser.',
    h1: 'Vehicle Experience',
    image: '/og/experience.png',
    breadcrumbs: [home, { name: 'Experience', path: '/experience' }],
    priority: 0.7,
    changefreq: 'monthly',
  },
  {
    path: '/services',
    title: 'Car Servicing and Maintenance',
    description:
      'Certified car service in Rajshahi: periodic maintenance, engine and transmission repair, body paint, AC service and genuine parts handled by trained technicians.',
    h1: 'Professional Care For Your Car',
    image: '/og/services.png',
    breadcrumbs: [home, { name: 'Services', path: '/services' }],
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: '/accessories',
    title: 'Genuine Car Accessories',
    description:
      'Shop original accessories for your car at Auto Spark BD: seat covers, floor mats, LED lighting, audio systems, engine care products and car care essentials with delivery.',
    h1: 'Service Your Car Right',
    image: '/og/accessories.png',
    breadcrumbs: [home, { name: 'Accessories', path: '/accessories' }],
    priority: 0.8,
    changefreq: 'weekly',
  },
  {
    path: '/product/:id',
    title: 'Product Details',
    description:
      'Product specifications, compatibility and pricing for genuine Auto Spark BD accessories, with ordering and delivery across Bangladesh.',
    h1: 'Product details',
    image: '/og/accessories.png',
    breadcrumbs: [home, { name: 'Accessories', path: '/accessories' }, { name: 'Product', path: '/product' }],
    priority: 0.5,
    changefreq: 'weekly',
  },
  {
    path: '/about',
    title: 'About Auto Spark BD',
    description:
      'Since 2014 Auto Spark BD has supplied quality Japanese import cars and honest car care from Rajshahi. Meet the team, the showroom and the values behind the business.',
    h1: 'About AutoSpark',
    image: '/og/about.png',
    breadcrumbs: [home, { name: 'About', path: '/about' }],
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/testimonials',
    title: 'Customer Reviews',
    description:
      'Read what buyers across Bangladesh say about buying and servicing their cars at Auto Spark BD in Rajshahi. Real reviews from real customers.',
    h1: 'Our Customers Love Us',
    image: '/og/testimonials.png',
    breadcrumbs: [home, { name: 'Testimonials', path: '/testimonials' }],
    priority: 0.7,
    changefreq: 'weekly',
  },
  {
    path: '/sell',
    title: 'Sell Your Car',
    description:
      'Sell your car fast through Auto Spark BD. Get a free, no-obligation valuation of your vehicle in Rajshahi, transparent pricing and same-day payment.',
    h1: 'Sell Your Car',
    image: '/og/sell.png',
    breadcrumbs: [home, { name: 'Sell your car', path: '/sell' }],
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/contact',
    title: 'Contact and Showroom Locations',
    description:
      'Visit our Rajshahi showroom or call us. Find addresses, opening hours, phone numbers and directions for Auto Spark BD showroom and service centre in Rajshahi.',
    h1: 'Get in Touch',
    image: '/og/contact.png',
    breadcrumbs: [home, { name: 'Contact', path: '/contact' }],
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: '/sparkpilot',
    title: 'SparkPilot Assistant',
    description:
      'SparkPilot is the Auto Spark BD assistant for vehicle recommendations, financing estimates, service questions and booking. Ask anything about our cars and services.',
    h1: 'SparkPilot Assistant',
    image: '/og/sparkpilot.png',
    breadcrumbs: [home, { name: 'SparkPilot', path: '/sparkpilot' }],
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description:
      'How Auto Spark BD collects, uses and protects your personal information, including enquiry data, cookies and our obligations under Bangladeshi data protection law.',
    h1: 'Privacy Policy',
    breadcrumbs: [home, { name: 'Privacy policy', path: '/privacy' }],
    priority: 0.3,
    changefreq: 'yearly',
  },
  {
    path: '/terms',
    title: 'Terms and Conditions',
    description:
      'The terms that govern vehicle purchases, service bookings, accessory orders and website use at Auto Spark BD in Rajshahi, Bangladesh.',
    h1: 'Terms and Conditions',
    breadcrumbs: [home, { name: 'Terms and conditions', path: '/terms' }],
    priority: 0.3,
    changefreq: 'yearly',
  },
  {
    path: '/cart',
    title: 'Your Cart',
    description: 'Review the items in your Auto Spark BD order before checkout.',
    h1: 'Your Cart',
    breadcrumbs: [home, { name: 'Cart', path: '/cart' }],
    noindex: true,
    priority: 0.2,
    changefreq: 'weekly',
  },
  {
    path: '/checkout',
    title: 'Checkout',
    description: 'Complete your order with Auto Spark BD and choose your payment method.',
    h1: 'Checkout',
    breadcrumbs: [home, { name: 'Checkout', path: '/checkout' }],
    noindex: true,
    priority: 0.2,
    changefreq: 'weekly',
  },
  {
    path: '/payment-success',
    title: 'Payment Received',
    description: 'Your payment to Auto Spark BD was successful. We will contact you shortly to confirm.',
    h1: 'Payment Successful',
    breadcrumbs: [home, { name: 'Payment successful', path: '/payment-success' }],
    noindex: true,
    priority: 0.1,
    changefreq: 'yearly',
  },
  {
    path: '/payment-fail',
    title: 'Payment Failed',
    description: 'Your payment to Auto Spark BD could not be completed. Here is what to do next.',
    h1: 'Payment Failed',
    breadcrumbs: [home, { name: 'Payment failed', path: '/payment-fail' }],
    noindex: true,
    priority: 0.1,
    changefreq: 'yearly',
  },
  {
    path: '/payment-cancel',
    title: 'Payment Cancelled',
    description: 'Your payment to Auto Spark BD was cancelled. Your items are still saved in your cart.',
    h1: 'Payment Cancelled',
    breadcrumbs: [home, { name: 'Payment cancelled', path: '/payment-cancel' }],
    noindex: true,
    priority: 0.1,
    changefreq: 'yearly',
  },
  {
    path: '/thank-you',
    title: 'Thank You',
    description: 'Thanks for your order at Auto Spark BD. A confirmation is on its way.',
    h1: 'Thank You for Your Order!',
    breadcrumbs: [home, { name: 'Thank you', path: '/thank-you' }],
    noindex: true,
    priority: 0.1,
    changefreq: 'yearly',
  },
  {
    path: '/inventory-management',
    title: 'Inventory Management',
    description: 'Internal inventory management for the Auto Spark BD team.',
    h1: 'Inventory Management',
    breadcrumbs: [home, { name: 'Inventory management', path: '/inventory-management' }],
    noindex: true,
    priority: 0.1,
    changefreq: 'yearly',
  },
  {
    path: '/color-preview',
    title: 'Colour Preview',
    description: 'Preview vehicle paint colours before you visit the Auto Spark BD showroom in Rajshahi.',
    h1: 'Vehicle Colour Preview',
    breadcrumbs: [home, { name: 'Colour preview', path: '/color-preview' }],
    noindex: true,
    priority: 0.2,
    changefreq: 'monthly',
  },
];

/** The 404 route is not a real page in the router but still needs metadata. */
export const NOT_FOUND_SEO: RouteSeo = {
  path: '/404',
  title: 'Page Not Found',
  description:
    'The page you were looking for is not here. Browse our car inventory, services and accessories from Auto Spark BD in Rajshahi instead.',
  h1: 'This page drove off',
  image: '/og/default.png',
  breadcrumbs: [home, { name: 'Page not found', path: '/404' }],
  noindex: true,
  priority: 0.1,
  changefreq: 'yearly',
};

/** Build an absolute URL from a site-relative path. */
export const absoluteUrl = (path: string): string => {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

/** Match the current pathname against the route manifest. */
export const matchRoute = (pathname: string): RouteSeo => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const exact = ROUTES.find((r) => r.path === clean);
  if (exact) return exact;
  for (const r of ROUTES) {
    if (!r.path.includes(':')) continue;
    const pattern = new RegExp(`^${r.path.replace(/:[^/]+/g, '[^/]+')}$`);
    if (pattern.test(clean)) return { ...r, path: clean };
  }
  // Unknown URL: serve the not-found metadata so nothing unknown is indexed.
  return { ...NOT_FOUND_SEO, path: clean };
};

/** Full document title, e.g. "Car Inventory | Auto Spark BD". */
export const buildTitle = (route: RouteSeo): string => {
  if (route.path === '/') return `${SITE.name} | ${route.title}`;
  // Avoid "About Auto Spark BD | Auto Spark BD" when the title already names the brand.
  if (route.title.toLowerCase().includes(SITE.name.toLowerCase())) return route.title;
  return `${route.title} | ${SITE.name}`;
};

/** Share image URL for a route. */
export const buildShareImage = (route: RouteSeo): string =>
  absoluteUrl(route.image || '/og/default.png');

/** The business entity schema, injected on every page. */
export const businessSchema = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'AutoDealer',
  '@id': `${SITE_URL}/#business`,
  name: SITE.name,
  legalName: SITE.legalName,
  description: SITE.tagline,
  url: SITE_URL,
  telephone: SITE.phone,
  email: SITE.email,
  image: SITE.defaultShareImage,
  logo: SITE.logo,
  priceRange: SITE.priceRange,
  foundingDate: SITE.foundingYear,
  currenciesAccepted: 'BDT',
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.locality,
    addressRegion: SITE.address.region,
    postalCode: SITE.address.postalCode,
    addressCountry: SITE.address.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: SITE.geo.lat,
    longitude: SITE.geo.lng,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SITE.openingHours[0].days,
      opens: SITE.openingHours[0].opens,
      closes: SITE.openingHours[0].closes,
    },
  ],
  areaServed: [
    { '@type': 'City', name: 'Rajshahi' },
    { '@type': 'State', name: 'Rajshahi Division' },
    { '@type': 'Country', name: 'Bangladesh' },
  ],
  sameAs: SITE.sameAs,
  makesOffer: {
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: 'Car sales, servicing and accessories' },
  },
});

/** BreadcrumbList schema for a route. */
export const breadcrumbSchema = (crumbs: Breadcrumb[]): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: absoluteUrl(c.path),
  })),
});

/** WebSite schema with the search action, used on the home page. */
export const websiteSchema = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE.name,
  url: SITE_URL,
  publisher: { '@id': `${SITE_URL}/#business` },
});
