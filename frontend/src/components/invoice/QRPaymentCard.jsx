import React from 'react';

const QRPaymentCard = ({ qrCodeData, countryConfig }) => {
    if (!qrCodeData) return null;

    const isArabic = countryConfig.supportsArabic;
    const isIndia = countryConfig.country === 'IN';

    // QR Image URL or Base64 QR code renderer
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrCodeData)}`;

    return (
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-xs flex flex-col items-center justify-center text-center">
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                {isIndia ? 'UPI PAYMENT QR' : (isArabic ? 'Scan to Pay / امسح للدفع' : 'Scan to Pay')}
            </h4>
            <div className="w-24 h-24 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm mb-2 flex items-center justify-center">
                <img src={qrUrl} alt="Payment QR Code" className="w-full h-full object-contain" />
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
                {isIndia ? 'Scan QR to pay via UPI' : 'Scan for invoice verification & payment'}
            </p>
        </div>
    );
};

export default QRPaymentCard;
