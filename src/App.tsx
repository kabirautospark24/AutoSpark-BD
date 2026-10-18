import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { Layout } from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { RouteFallback } from './components/RouteFallback';
import { lazyWithRetry } from './utils/lazyWithRetry';

const HomePage = lazyWithRetry(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const InventoryPage = lazyWithRetry(() => import('./pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const VehicleDetailsPage = lazyWithRetry(() => import('./pages/VehicleDetailsPage').then(m => ({ default: m.VehicleDetailsPage })));
const ServicesPage = lazyWithRetry(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const AccessoriesPage = lazyWithRetry(() => import('./pages/AccessoriesPage').then(m => ({ default: m.default })));
const ProductDetailPage = lazyWithRetry(() => import('./pages/ProductDetailPage').then(m => ({ default: m.default })));
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const SellCarPage = lazyWithRetry(() => import('./pages/SellCarPage').then(m => ({ default: m.SellCarPage })));
const ContactPage = lazyWithRetry(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const VehicleExperiencePage = lazyWithRetry(() => import('./pages/VehicleExperiencePage').then(m => ({ default: m.VehicleExperiencePage })));
const TestimonialsPage = lazyWithRetry(() => import('./pages/TestimonialsPage').then(m => ({ default: m.TestimonialsPage })));
const ColorPreviewPage = lazyWithRetry(() => import('./pages/ColorPreviewPage').then(m => ({ default: m.ColorPreviewPage })));
const CartPage = lazyWithRetry(() => import('./pages/CartPage'));
const CheckoutPage = lazyWithRetry(() => import('./pages/CheckoutPage'));
const InventoryManagementPage = lazyWithRetry(() => import('./pages/InventoryManagementPage'));
const PaymentSuccessPage = lazyWithRetry(() => import('./pages/PaymentSuccessPage').then(m => ({ default: m.PaymentSuccessPage })));
const PaymentFailPage = lazyWithRetry(() => import('./pages/PaymentFailPage'));
const PaymentCancelPage = lazyWithRetry(() => import('./pages/PaymentCancelPage'));
const ThankYouPage = lazyWithRetry(() => import('./pages/ThankYouPage'));
const SparkPilotPage = lazyWithRetry(() => import('./pages/SparkPilotPage').then(m => ({ default: m.SparkPilotPage })));
const PrivacyPage = lazyWithRetry(() => import('./pages/LegalPages').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazyWithRetry(() => import('./pages/LegalPages').then(m => ({ default: m.TermsPage })));

const NotFound = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-16 text-center">
    <p className="text-[clamp(4rem,15vw,8rem)] font-black leading-none tracking-tighter text-[var(--brand-red,#C00000)] tabular-nums">404</p>
    <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-balance">This page drove off</h1>
    <p className="mt-2 max-w-md text-sm sm:text-base text-gray-500 dark:text-gray-400">
      The address may be wrong, or the page has moved. Let's get you back on the road.
    </p>
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <a href="/" className="inline-flex min-h-[44px] items-center rounded-lg bg-[var(--brand-red,#C00000)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]">
        Go home
      </a>
      <a href="/inventory" className="inline-flex min-h-[44px] items-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 active:scale-[0.98]">
        Browse inventory
      </a>
      <a href="/contact" className="inline-flex min-h-[44px] items-center rounded-lg px-6 py-3 text-sm font-semibold text-[var(--brand-red,#C00000)] transition hover:bg-[var(--brand-red,#C00000)]/10 active:scale-[0.98]">
        Contact us
      </a>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Suspense fallback={<RouteFallback />}><HomePage /></Suspense>} />
            <Route path="/inventory" element={<Suspense fallback={<RouteFallback />}><InventoryPage /></Suspense>} />
            <Route path="/vehicle/:id" element={<Suspense fallback={<RouteFallback />}><VehicleDetailsPage /></Suspense>} />
            <Route path="/experience" element={<Suspense fallback={<RouteFallback />}><VehicleExperiencePage /></Suspense>} />
            <Route path="/services" element={<Suspense fallback={<RouteFallback />}><ServicesPage /></Suspense>} />
            <Route path="/accessories" element={<Suspense fallback={<RouteFallback />}><AccessoriesPage /></Suspense>} />
            <Route path="/product/:id" element={<Suspense fallback={<RouteFallback />}><ProductDetailPage /></Suspense>} />
            <Route path="/cart" element={<Suspense fallback={<RouteFallback />}><CartPage /></Suspense>} />
            <Route path="/checkout" element={<Suspense fallback={<RouteFallback />}><CheckoutPage /></Suspense>} />
            <Route path="/payment" element={<Navigate to="/checkout" replace />} />
            <Route path="/inventory-management" element={<Suspense fallback={<RouteFallback />}><InventoryManagementPage /></Suspense>} />
            <Route path="/about" element={<Suspense fallback={<RouteFallback />}><AboutPage /></Suspense>} />
            <Route path="/testimonials" element={<Suspense fallback={<RouteFallback />}><TestimonialsPage /></Suspense>} />
            <Route path="/sell" element={<Suspense fallback={<RouteFallback />}><SellCarPage /></Suspense>} />
            <Route path="/contact" element={<Suspense fallback={<RouteFallback />}><ContactPage /></Suspense>} />
            <Route path="/color-preview" element={<Suspense fallback={<RouteFallback />}><ColorPreviewPage /></Suspense>} />
            <Route path="/payment-success" element={<Suspense fallback={<RouteFallback />}><PaymentSuccessPage /></Suspense>} />
            <Route path="/payment-fail" element={<Suspense fallback={<RouteFallback />}><PaymentFailPage /></Suspense>} />
            <Route path="/payment-cancel" element={<Suspense fallback={<RouteFallback />}><PaymentCancelPage /></Suspense>} />
            <Route path="/payment/success" element={<Navigate to="/payment-success" replace />} />
            <Route path="/payment/fail" element={<Navigate to="/payment-fail" replace />} />
            <Route path="/payment/cancel" element={<Navigate to="/payment-cancel" replace />} />
            <Route path="/thank-you" element={<Suspense fallback={<RouteFallback />}><ThankYouPage /></Suspense>} />
            <Route path="/sparkpilot" element={<Suspense fallback={<RouteFallback />}><SparkPilotPage /></Suspense>} />
            <Route path="/sparkai" element={<Navigate to="/sparkpilot" replace />} />
            <Route path="/privacy" element={<Suspense fallback={<RouteFallback />}><PrivacyPage /></Suspense>} />
            <Route path="/terms" element={<Suspense fallback={<RouteFallback />}><TermsPage /></Suspense>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
