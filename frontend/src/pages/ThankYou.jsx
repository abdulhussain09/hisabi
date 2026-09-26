import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Home, Store, Printer } from 'lucide-react';

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const invoiceNum = searchParams.get('inv') || 'SUCCESS';
  const type = searchParams.get('type') || 'transaction';

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {type === 'subscription' ? 'Subscription Activated!' : 'Thank You!'}
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {type === 'subscription' ? 'Your account has been upgraded successfully' : `Transaction Ref: #${invoiceNum}`}
          </p>
        </div>

        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700/50 text-xs text-slate-300 space-y-1">
          <p className="font-bold text-white">Action Completed Successfully</p>
          <p className="text-[11px] text-slate-400">All data has been recorded into your Hisabi-POS register.</p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link
            to="/pos"
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95"
          >
            <Store className="w-4 h-4" /> Return to POS Terminal
          </Link>
          <Link
            to="/dashboard"
            className="w-full py-3.5 bg-slate-700/60 text-slate-300 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Home className="w-4 h-4" /> Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
