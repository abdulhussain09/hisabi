import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldCheck, Scale } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-md">
              <Scale className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Terms & Conditions</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Merchant Service Agreement</p>
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
            <h2 className="text-lg font-black text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Hisabi-POS software platform, mobile POS interfaces, or associated API services, merchants agree to abide by these Terms and Conditions and applicable retail tax regulations across the UAE, Kuwait, India, and GCC regions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900">2. Merchant Responsibilities & Tax Compliance</h2>
            <p>
              Merchants are solely responsible for ensuring accurate tax rate configuration (UAE 5% VAT, Kuwait 0% Tax, India 18% GST), providing valid TRN/VAT numbers for TLV QR code encoding, and maintaining adequate stock inventory records.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900">3. Subscription Tiers & Billing</h2>
            <p>
              Hisabi-POS provides Free, Gold, and Premium subscription tiers. Feature gates enforce product limits, staff role limits, and custom branding rules. Payments processed via Razorpay or administrative billing are non-refundable unless specified by regional consumer protection law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900">4. Service Availability & Offline Sync</h2>
            <p>
              Hisabi-POS includes offline-first IndexedDB capabilities allowing checkout during intermittent network outages. Pending transactions automatically sync once internet connectivity is re-established.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
