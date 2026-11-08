import { Link } from 'react-router-dom';
import { Facebook, Instagram, Phone, Mail, MapPin, Youtube, Music2, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const showroom = {
  address: 'Station Road, Near Shuvo Petroleum, Sheroil, Ghoramara, Boalia, Rajshahi 6207',
  phone: '+880 1760-401605',
  email: 'autosparkbd@gmail.com',
  website: 'autosparkbd.com',
};

const serviceCenter = {
  address: 'Meherchandi, West Side of School Mor, Rajshahi 6202',
  phone: '+880 1321-233670',
};

const socials = [
  { href: 'https://www.facebook.com/autosparkbd', label: 'Facebook', Icon: Facebook },
  { href: 'https://www.instagram.com/autosparkbd', label: 'Instagram', Icon: Instagram },
  { href: 'https://www.youtube.com/@autosparkbd1131', label: 'YouTube', Icon: Youtube },
  { href: 'https://www.tiktok.com/@auto_spark0', label: 'TikTok', Icon: Music2 },
];

export const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const exploreLinks = [
    { to: '/inventory', label: t('nav.inventory') },
    { to: '/experience', label: 'Experience' },
    { to: '/about', label: t('nav.about') },
    { to: '/testimonials', label: t('nav.testimonials') },
  ];

  const serviceLinks = [
    { to: '/services', label: t('nav.services') },
    { to: '/accessories', label: t('nav.accessories') },
    { to: '/sell', label: t('nav.sell') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <footer className="relative z-20 border-t border-border bg-background text-muted-foreground">
      <div className="container-fluid py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}logo/logoAS3.svg`}
                alt="Auto Spark BD"
                className="h-12 w-12"
                width={48}
                height={48}
              />
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                {t('site.title')}
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              {t('footer.description')}
            </p>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{showroom.address}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{serviceCenter.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a
                  href={`tel:${showroom.phone.replace(/\s/g, '')}`}
                  className="transition-colors hover:text-foreground"
                >
                  {showroom.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a
                  href={`mailto:${showroom.email}`}
                  className="transition-colors hover:text-foreground"
                >
                  {showroom.email}
                </a>
              </div>
            </div>
          </div>

          {/* Explore */}
          <nav className="lg:col-span-2" aria-label="Explore">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              Explore
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              {exploreLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex min-h-[32px] items-center transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services */}
          <nav className="lg:col-span-2" aria-label="Services">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              Services
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              {serviceLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex min-h-[32px] items-center transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Visit */}
          <div className="lg:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              {t('contact.hours')}
            </h2>
            <p className="mt-5 text-sm">{t('contact.hours_value')}</p>
            <p className="mt-2 text-xs">Service centre: {serviceCenter.phone}</p>

            <Link
              to="/contact"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('nav.contact')}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>

            <div className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                {t('footer.follow')}
              </h2>
              <div className="mt-4 flex flex-wrap gap-1">
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {currentYear} {t('site.title')}. {t('footer.rights')} · Built by Farhan Kabir
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
            <a
              href={`https://${showroom.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              {showroom.website}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
