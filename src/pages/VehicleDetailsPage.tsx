import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from '../components/ui/Card';
import PageHead from '../components/PageHead';
import { ALL_VEHICLES } from '../data/allVehicles';
import { carSlides } from '../data/carSlides';
import type { Vehicle } from '../types';
import { formatPrice } from '../utils/format';

export interface SpecItem {
  label: string;
  value: string | number;
}

export const VehicleDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    setLoading(true);
    
    // First, try to find the vehicle in local mock data
    const localVehicle = ALL_VEHICLES.find(v => v.id === id);
    
    if (localVehicle) {
      setVehicle(localVehicle);
      setLoading(false);
      return;
    }

    // If not found in local dataset, try to match against the lightweight carousel slides
    // (some landing carousel items use different IDs than the inventory dataset)
    type SlideLike = {
      id: string;
      brand?: string;
      title?: string;
      model?: string;
      year?: number;
      price?: number | string;
      fuel?: string;
      transmission?: string;
      engine_capacity?: string;
      color?: string;
      bodyType?: string;
      tagline?: string;
      subtitle?: string;
      image: string;
    };
    const slideMatch = carSlides.find((s) => s.id === id) as SlideLike | undefined;
    if (slideMatch) {
      // Convert the slide representation into the Vehicle shape the details page expects
      const parsedPrice = typeof slideMatch.price === 'string' ? Number(String(slideMatch.price).replace(/[^0-9.-]+/g, '')) : (slideMatch.price || 0);
      const constructed: Vehicle = {
        id: slideMatch.id,
        stock_number: slideMatch.id,
        brand_name: slideMatch.brand || slideMatch.title || 'Unknown',
        model: slideMatch.model || slideMatch.title || '',
        year: slideMatch.year || new Date().getFullYear(),
        price: parsedPrice,
        mileage: 0,
        fuel_type: slideMatch.fuel || 'Unknown',
        transmission: slideMatch.transmission || 'Unknown',
        engine_capacity: slideMatch.engine_capacity || undefined,
        color_exterior: slideMatch.color || undefined,
        color_interior: undefined,
        body_type: slideMatch.bodyType || undefined,
        condition: 'New',
        description_en: slideMatch.tagline || slideMatch.subtitle || '',
        description_bn: '',
        is_available: true,
        is_featured: false,
        video_url: '',
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [
          { id: `${slideMatch.id}-1`, vehicle_id: slideMatch.id, image_url: slideMatch.image, display_order: 1, is_primary: true, created_at: new Date().toISOString() }
        ]
      };

      setVehicle(constructed);
      setLoading(false);
      return;
    }
    
    // Fallback to Supabase if not found locally: dynamically import to keep initial bundle small
    try {
      const { supabase } = await import('../lib/supabase');
      if (supabase && supabase.from) {
        const { data } = await supabase
          .from('vehicles')
          .select(`
            *,
            images:vehicle_images(*),
            features:vehicle_features(*)
          `)
          .eq('id', id)
          .single();

        if (data) setVehicle(data);
      }
    } catch (error) {
      console.warn('Vehicle could not be loaded:', error);
    }
    
    setLoading(false);
  };

  const nextImage = () => {
    if (vehicle?.images && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % vehicle.images!.length);
    }
  };

  const prevImage = () => {
    if (vehicle?.images && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + vehicle.images!.length) % vehicle.images!.length);
    }
  }

  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center pt-20 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className={`min-h-screen flex items-center justify-center pt-20 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center max-w-md px-6" role="alert">
          <h2 className={isDark ? 'text-white text-xl' : 'text-gray-900 text-xl'}>Vehicle not found</h2>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>We couldn't find that vehicle. It may have been removed or the link is incorrect.</p>
          <div className="mt-4 flex gap-3 justify-center">
            <Link to="/inventory" className="px-5 py-2 bg-[var(--brand-red,#D6001C)] text-white rounded-lg">Browse inventory</Link>
            <Link to="/" className="px-5 py-2 border rounded-lg">Go home</Link>
          </div>
        </div>
      </div>
    );
  }

  const images = vehicle.images || [];
  const currentImage = encodeURI(images[currentImageIndex]?.image_url || 'https://images.pexels.com/photos/3802508/pexels-photo-3802508.jpeg?auto=compress&cs=tinysrgb&w=1200');

  // Build structured data for Product (if we have vehicle)
  const jsonLd = vehicle ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${vehicle.brand_name} ${vehicle.model}`,
    description: language === 'en' ? vehicle.description_en : (vehicle.description_bn || vehicle.description_en),
    sku: vehicle.stock_number || vehicle.id,
    brand: { "@type": "Brand", name: vehicle.brand_name },
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: vehicle.price > 0 ? String(vehicle.price) : undefined,
      availability: vehicle.is_available ? "https://schema.org/InStock": "https://schema.org/OutOfStock",
      url: typeof window !== 'undefined' ? window.location.href : `https://www.autosparkbd.com/vehicle/${vehicle.id}`,
    },
    image: (vehicle.images || []).map(img => img.image_url)
  } : null;

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {vehicle && (
        <PageHead
          path={`/vehicle/${vehicle.id}`}
          seo={{
            title: `${vehicle.brand_name} ${vehicle.model}`,
            description:
              language === 'en'
                ? vehicle.description_en
                : vehicle.description_bn || vehicle.description_en,
            h1: `${vehicle.brand_name} ${vehicle.model}`,
            image: encodeURI(currentImage),
          }}
          jsonLd={jsonLd}
        />
      )}
      <div className="container mx-auto px-4 py-8 pb-32 lg:pb-8">
        <Link to="/inventory" className="inline-flex items-center text-primary hover:text-primary mb-6">
          <ChevronLeft className="h-5 w-5 mr-1" />
          {language === 'en' ? 'Back to Inventory' : 'ইনভেন্টরিতে ফিরে যান'}
        </Link>

        <div className="grid max-w-7xl mx-auto">
          {/* Vehicle Hero & Gallery */}
          <div className="rounded-2xl overflow-hidden shadow-xl mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}">
            <div className="relative">
              <div aria-live="polite" className="sr-only">Image {currentImageIndex + 1} of {Math.max(images.length, 1)}</div>
              
              <img
                src={currentImage}
                alt={`${vehicle.brand_name} ${vehicle.model}`}
                className="w-full h-[520] sm:h-[600] object-cover transition-opacity duration-300 focus:opacity-90"
                decoding="async"
                width={600}
                height={384}
              />
              
              {/* Navigation arrows */}
              {images.length > 1 && (
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={prevImage}
                    className="prev-arrow bg-black/50 text-white p-3 rounded-full transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="next-arrow bg-black/50 text-white p-3 rounded-full transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
              
              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      aria-label={`Image ${idx + 1}`}
                      className={`flex-1 rounded-lg overflow-hidden ${
                        currentImageIndex === idx ? 'opacity-100 shadow-lg' : 'opacity-60 transition-opacity'
                      }`}
                    >
                      <img
                        src={encodeURI(img.image_url)}
                        alt={`${vehicle.brand_name} ${vehicle.model} thumb ${idx + 1}`}
                        className="w-full h-24 object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Premium Vehicle Metadata */}
          <div className="rounded-2xl bg-gray-800/50 p-6 mb-8 ${isDark ? 'border border-gray-700' : 'border border-gray-200'}">
            <div className="flex items-start gap-4">
              {/* Brand Badge */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className={isDark ? 'text-red-400' : 'text-red-600'}>
                  {vehicle.brand_name?.charAt(0) || ''}
                </span>
              </div>
              
              {/* Vehicle Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {vehicle.brand_name} {vehicle.model}
                </p>
                <h1 className="text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}">
                  {vehicle.year}
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-300">
                  {language === 'en' ? 'Premium Japanese Vehicle' : 'প্রিমiumi japonি বাহন'}
                </p>
              </div>
            </div>
            
            {/* Key Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">Mileage</p>
                <p className="text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}">
                  {vehicle.mileage.toLocaleString()} km
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">Fuel</p>
                <p className="text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}">
                  {vehicle.fuel_type}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">Transmission</p>
                <p className="text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}">
                  {vehicle.transmission}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="text-5xl font-bold text-[var(--brand-red,#D6001C)] mb-6">
              {vehicle.price && vehicle.price > 0 ? formatPrice(vehicle.price, language) : (language === 'en' ? 'Price on request' : 'মূল্য_on_requestে')}
            </div>

            {/* Action CTA Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <Link
                to={`/reserve/${vehicle.id}`}
                className="col-span-2 sm:col-span-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
              >
                {t('vehicle.reserve')}
              </Link>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={`tel:+8801760401605`}
                  className="flex-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-4 transition-colors text-sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Call' : 'ফোন করুন'}
                </a>
                <a
                  href={`https://wa.me/8801760401605?text=${encodeURIComponent(`I'm interested in ${vehicle.brand_name} ${vehicle.model}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg bg-green-500 hover:bg-green-600 text-white py-2.5 px-4 transition-colors text-sm flex items-center justify-center"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'WhatsApp' : 'WhatsApp'}
                </a>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <Card className="p-6 mb-6 ${isDark ? 'bg-gray-800' : ''}">
            <h2 className="text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}">
              {language === 'en' ? 'Description' : 'বিবরণ'}
            </h2>
            <p className="leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}">
              {language === 'en' ? vehicle.description_en : vehicle.description_bn || vehicle.description_en}
            </p>
          </Card>

          {/* Features Section */}
          {vehicle.features && vehicle.features.length > 0 && (
            <Card className="p-6 ${isDark ? 'bg-gray-800' : ''}">
              <h2 className="text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}">
                {t('vehicle.features')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vehicle.features.map((feature: any) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-primary rounded-full"></div>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {language === 'en' ? feature.feature_en : feature.feature_bn}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Specifications Section */}
          <Card className="p-6 ${isDark ? 'bg-gray-800' : ''}">
            <h2 className="text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}">
              {t('vehicle.specifications')}
            </h2>
            <dl className="space-y-3">
              {[
                { label: t('vehicle.year'), value: vehicle.year },
                { label: t('filter.brand'), value: vehicle.brand_name },
                { label: t('filter.model'), value: vehicle.model },
                { label: t('vehicle.condition'), value: vehicle.condition },
                { label: t('vehicle.fuel'), value: vehicle.fuel_type },
                { label: t('vehicle.transmission'), value: vehicle.transmission },
                { label: language === 'en' ? 'Engine' : 'ইঞ্জিন', value: vehicle.engine_capacity },
                { label: language === 'en' ? 'Body Type' : 'বডি টাইপ', value: vehicle.body_type },
                { label: language === 'en' ? 'Exterior Color' : 'বাহ্যিক রঙ', value: vehicle.color_exterior },
                { label: language === 'en' ? 'Interior Color' : 'অভ্যন্তরীণ রঙ', value: vehicle.color_interior },
              ].map((spec) => spec.value && (
                <div key={spec.label} className="flex justify-between py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                  <dt className={isDark ? 'text-gray-400' : 'text-gray-600'}>{spec.label}</dt>
                  <dd className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {typeof spec.value === 'number' ? spec.value.toLocaleString() : String(spec.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        {/* Sticky mobile buy bar */}
        <div
          className={`fixed bottom-0 inset-x-0 z-40 lg:hidden border-t backdrop-blur-md ${isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white/95 border-gray-200'} pb-[max(env(safe-area-inset-bottom,0px),0.75rem)]`}
        >
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <div className="min-w-0">
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {language === 'en' ? 'Price' : 'মূল্য'}
              </p>
              <p className="text-lg font-bold text-[var(--brand-red,#D6001C)] truncate">
                {vehicle.price && vehicle.price > 0 ? formatPrice(vehicle.price, language) : '-'}
              </p>
            </div>
            <Link
              to={`/reserve/${vehicle.id}`}
              className="flex-1 min-h-[44px] px-6 inline-flex items-center justify-center rounded-lg bg-[var(--brand-red,#D6001C)] text-white font-bold hover:opacity-90 transition-opacity"
            >
              {t('vehicle.reserve')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};