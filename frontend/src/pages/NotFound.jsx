import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home, Store } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-center mx-auto text-blue-400 shadow-xl shadow-blue-500/10">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tighter text-blue-500">404</h1>
          <h2 className="text-2xl font-black tracking-tight text-white">Page Not Found</h2>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
          <Link
            to="/dashboard"
            className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Home className="w-4 h-4" /> Go to Dashboard
          </Link>
          <Link
            to="/login"
            className="px-6 py-3.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Store className="w-4 h-4" /> Merchant Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
