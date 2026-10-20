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

const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

export function AppRoutes() {
  return (
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
      <Route path="*" element={<Suspense fallback={<RouteFallback />}><NotFoundPage /></Suspense>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <ScrollToTop />
        <Layout>
          <AppRoutes />
        </Layout>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
