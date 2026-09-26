import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Cookie, Check, X } from 'lucide-react';

const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('hisabi_cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('hisabi_cookie_consent', 'accepted');
    setShow(false);
    if (window.gtag && window.VITE_GA_MEASUREMENT_ID) {
      window.gtag('config', window.VITE_GA_MEASUREMENT_ID);
    }
  };

  const handleDecline = () => {
    localStorage.setItem('hisabi_cookie_consent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 border border-slate-700/80 text-white rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/20 flex-shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1 pr-2">
            <h3 className="text-sm font-black tracking-tight text-white">We Respect Your Privacy</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              We use essential cookies and analytics to ensure smooth POS operations and optimize performance. Read our{' '}
              <Link to="/privacy" className="text-blue-400 underline hover:text-blue-300">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAccept}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Check className="w-3.5 h-3.5" /> Accept All
          </button>
          <button
            onClick={handleDecline}
            className="py-2.5 px-4 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-all flex items-center justify-center gap-1 active:scale-95"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
