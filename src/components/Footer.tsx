import { Link } from 'react-router-dom';
import { Facebook, Instagram, Phone, Mail, MapPin, Youtube, Music2 } from 'lucide-react';
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

export const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const companyLinks = [
    { to: '/about', label: t('nav.about') },
    { to: '/services', label: t('nav.services') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const vehicleLinks = [
    { to: '/inventory', label: t('nav.inventory') },
    { to: '/brands', label: 'Brands' },
    { to: '/japan-import', label: 'Japan Import' },
  ];

  const serviceLinks = [
    { to: '/services', label: t('nav.services') },
    { to: '/accessories', label: t('nav.accessories') },
    { to: '/sell', label: t('nav.sell') },
  ];

  return (
    <footer className="border-t border-border bg-background/80 footer-min-h">
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Company */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-3 mb-8">
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
            <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
              {t('footer.description')}
            </p>
            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
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
                  className="transition-colors hover:text-primary"
                >
                  {showroom.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a
                  href={`mailto:${showroom.email}`}
                  className="transition-colors hover:text-primary"
                >
                  {showroom.email}
                </a>
              </div>
            </div>
          </div>

          {/* Vehicles */}
          <nav className="lg:col-span-2" aria-label="Vehicles">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground mb-4">
              {t('nav.vehicles')}
            </h2>
            <ul className="space-y-2 text-sm">
              {vehicleLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services */}
          <nav className="lg:col-span-3" aria-label="Services">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground mb-4">
              {t('nav.services')}
            </h2>
            <ul className="space-y-2 text-sm">
              {serviceLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support */}
          <nav className="lg:col-span-3" aria-label="Support">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground mb-4">
              {t('nav.support')}
            </h2>
            <ul className="space-y-2 text-sm">
              {companyLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {t('site_title')}. {t('footer_rights')} · Built by{' '}
            <a
              href="https://farhankabir.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              Farhan Kabir
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/privacy" className="transition-colors hover:text-primary">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-primary">
              Terms of Service
            </Link>
            <a
              href={`https://${showroom.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-primary"
            >
              {showroom.website}
            </a>
          </div>
        </div>

        {/* WhatsApp persistent contact */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              <a
                href="https://www.facebook.com/autosparkbd"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-background/50 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Facebook className="h-5 w-5" aria-hidden />
              </a>
              <a
                href="https://www.instagram.com/autosparkbd"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-background/50 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Instagram className="h-5 w-5" aria-hidden />
              </a>
              <a
                href="https://www.youtube.com/@autosparkbd1131"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-background/50 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Youtube className="h-5 w-5" aria-hidden />
              </a>
              <a
                href="https://www.tiktok.com/@auto_spark0"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-background/50 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Music2 className="h-5 w-5" aria-hidden />
              </a>
            </div>
          </div>

          {/* WhatsApp persistent contact */}
          <div className="mt-8 fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto">
          <a
            href={`https://wa.me/+8801760401605?text=${encodeURIComponent(t('footer.whatsapp_message'))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90"
            aria-label="WhatsApp contact"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.2 2H5.7c-.3 0-.5.2-.5.5v17.8c0 .3.2.5.5.5h14.5c.3 0 .5-.2.5-.5v-2.1l-3.3-3.2c-.1-.1-.1-.2-.2-.2h-1.8c-.4 0-.5.3-.5.5v18.4c0 .4.3.5.5.5h2.1l3.2 3.1c.1.1.1.2.2.2h1.8c.5 0 .5-.3.5-.5v-18.4c0-.3-.2-.5-.5-.5h-4.7l-.2-.1c-.3 0-.5-.2-.5-.5v-2.4c0-.3.1-.5.4-.5l3.3-3.1 3.2 3.1c.3.3.3.5.5.5h4.7c.4 0 .5-.2.5-.5v-2.1l3.2-3.2c.1-.1.2-.2.2-.2h1.8c.4 0 .5.3.5.5v2.4c0 .3-.1.5-.4.5l-3.4 3.3L12 5.7l-1.8 1.9c-.1.1-.2.1-.2.2v3.6c0 .3.1.5.2.5h1.9c.4 0 .5-.3.5-.5l3.3-3.2-3.3-3.2c-.1-.1-.2-.2-.3-.2zM12 15.6l4.1 4.1-1.1 1.1-4.2-4.2L12 15.6zM4.8 5.7L12 12.9l7.2-7.2c.5-.5.5-1.3 0-1.8l-1.4-1.4c-.5-.5-1.3-.5-1.8 0L12 9.6l-7.2 7.1c-.5.5-.5 1.3 0 1.8l1.4 1.4c.5.5.5 1.3 0 1.8L4.8 13.7c-.5.5-.5 1.3 0 1.8l1.4 1.4c.5.5.5 1.3 0 1.8L4.8 5.7z" />
            </svg>
            {t('footer.whatsapp')}
          </a>
        </div>
      </div>
    </footer>
  );
};