import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CookieConsent from './components/CookieConsent';

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Layout = lazy(() => import('./components/Layout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const POS = lazy(() => import('./pages/POS'));
const DueCollection = lazy(() => import('./pages/DueCollection'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Reports = lazy(() => import('./pages/Reports'));
const Profile = lazy(() => import('./pages/Profile'));
const Customers = lazy(() => import('./pages/Customers'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Returns = lazy(() => import('./pages/Returns'));
const Purchases = lazy(() => import('./pages/Purchases'));
const StockAdjustments = lazy(() => import('./pages/StockAdjustments'));
const DiscountCodes = lazy(() => import('./pages/DiscountCodes'));
const EndOfDay = lazy(() => import('./pages/EndOfDay'));
const SalesTargets = lazy(() => import('./pages/SalesTargets'));
const Staff = lazy(() => import('./pages/Staff'));
const Help = lazy(() => import('./pages/Help'));
const SuperAdminLogin = lazy(() => import('./pages/SuperAdminLogin'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const NotFound = lazy(() => import('./pages/NotFound'));

const SEO_MAP = {
  '/dashboard': { title: 'Dashboard | Hisabi-POS', desc: 'Real-time sales summary, top products, and retail metrics overview.' },
  '/pos': { title: 'Point of Sale | Hisabi-POS', desc: 'Fast retail checkout terminal with barcode scanner, GCC VAT, and offline sync.' },
  '/products': { title: 'Inventory Management | Hisabi-POS', desc: 'Manage catalog products, stock levels, barcodes, and item tax categories.' },
  '/invoices': { title: 'Billing & Invoices | Hisabi-POS', desc: 'Search, audit, and print tax receipts with TLV QR codes.' },
  '/due-collection': { title: 'Customer Due Collection | Hisabi-POS', desc: 'Track customer credit accounts and collect outstanding balances.' },
  '/reports': { title: 'Business Analytics | Hisabi-POS', desc: 'Comprehensive financial, tax, and sales performance reports.' },
  '/customers': { title: 'Customer Directory | Hisabi-POS', desc: 'Manage customer contact info, purchase history, and credit records.' },
  '/suppliers': { title: 'Supplier Directory | Hisabi-POS', desc: 'Manage vendor details, purchase orders, and supplier ledgers.' },
  '/expenses': { title: 'Expense Tracking | Hisabi-POS', desc: 'Record operating expenses and track business cash flows.' },
  '/returns': { title: 'Sales Returns | Hisabi-POS', desc: 'Process customer returns, issue refunds, and adjust inventory.' },
  '/purchases': { title: 'Purchase Orders | Hisabi-POS', desc: 'Record stock purchases and supplier receipts.' },
  '/stock-adjustments': { title: 'Stock Adjustments | Hisabi-POS', desc: 'Reconcile stock count discrepancies and physical inventory.' },
  '/discount-codes': { title: 'Discount Codes | Hisabi-POS', desc: 'Create promotional codes and discount campaigns.' },
  '/targets': { title: 'Sales Targets | Hisabi-POS', desc: 'Set monthly sales goals and track revenue performance.' },
  '/staff': { title: 'Staff & Roles | Hisabi-POS', desc: 'Manage employee access controls and RBAC permissions.' },
  '/end-of-day': { title: 'End of Day Closing | Hisabi-POS', desc: 'Daily drawer reconciliation and shift closing summary.' },
  '/profile': { title: 'Account & Settings | Hisabi-POS', desc: 'Update shop branding, logo, VAT registration numbers, and preferences.' },
  '/help': { title: 'Help & Documentation | Hisabi-POS', desc: 'POS user guides, FAQ, and technical support.' },
  '/login': { title: 'Merchant Login | Hisabi-POS', desc: 'Sign in to access your retail POS dashboard and register.' },
  '/privacy': { title: 'Privacy Policy | Hisabi-POS', desc: 'Hisabi-POS data protection policies and merchant privacy practices.' },
  '/terms': { title: 'Terms & Conditions | Hisabi-POS', desc: 'Merchant agreement and service terms for Hisabi-POS SaaS.' },
  '/thank-you': { title: 'Thank You | Hisabi-POS', desc: 'Action completed successfully on Hisabi-POS.' },
  '/super-admin-login': { title: 'System Administration | Hisabi-POS', desc: 'Super admin system portal.' },
  '/super-admin-dashboard': { title: 'Super Admin Dashboard | Hisabi-POS', desc: 'System tenant metrics, ads management, and subscription oversight.' },
};

const TitleManager = () => {
  const location = useLocation();

  React.useEffect(() => {
    const path = location.pathname;
    const match = SEO_MAP[path] || {
      title: 'Hisabi-POS | Complete Inventory & Billing Solution',
      desc: 'Manage your shop with Hisabi-POS. Fast inventory tracking, GST/VAT billing, customer management, and sales analytics.'
    };

    document.title = match.title;
    const metaDesc = document.getElementById('meta-description');
    if (metaDesc) {
      metaDesc.setAttribute('content', match.desc);
    }
  }, [location]);

  return null;
};

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Hisabi-POS...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <TitleManager />
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/thank-you" element={<ThankYou />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="pos" element={<POS />} />
              <Route path="due-collection" element={<DueCollection />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="reports" element={<Reports />} />
              <Route path="profile" element={<Profile />} />
              <Route path="customers" element={<Customers />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="returns" element={<Returns />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="stock-adjustments" element={<StockAdjustments />} />
              <Route path="discount-codes" element={<DiscountCodes />} />
              <Route path="targets" element={<SalesTargets />} />
              <Route path="staff" element={<Staff />} />
              <Route path="end-of-day" element={<EndOfDay />} />
              <Route path="help" element={<Help />} />
            </Route>

            {/* Hidden Super Admin Routes */}
            <Route path="/super-admin-login" element={<SuperAdminLogin />} />
            <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />

            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
