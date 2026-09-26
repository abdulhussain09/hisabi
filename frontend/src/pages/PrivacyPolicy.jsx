import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Privacy Policy</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hisabi-POS Data Protection</p>
            </div>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>

        <div className="bg-white rounded-[2rem] p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" /> 1. Information We Collect
            </h2>
            <p>
              Hisabi-POS collects information necessary to provide retail management, Point-of-Sale billing, inventory tracking, and GCC VAT compliance services. This includes user account details (username, email, shop name, TRN/VAT registration numbers), transaction logs, customer phone numbers, and product catalog data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> 2. How Information Is Used
            </h2>
            <p>
              Your data is strictly utilized to compute tax invoices, generate VAT audit reports, maintain offline-first synchronization via browser IndexedDB, process subscriptions via Razorpay, and manage multi-tenant staff permissions. We do not sell or monetize merchant transaction data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> 3. Data Storage & Security
            </h2>
            <p>
              All passwords are encrypted using bcrypt algorithms. Sensitive session tokens are transmitted over TLS/HTTPS encryption. Offline cached data is securely stored locally in browser IndexedDB storage and synced automatically upon network connection.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900">4. Contact & Regulatory Inquiries</h2>
            <p>
              For data privacy inquiries or request for account deletion, please contact our support desk at <span className="font-bold text-slate-900">support@hisabi.cc</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
