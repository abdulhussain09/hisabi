import React from 'react';

const AmountInWordsCard = ({ amountInWords, isArabic }) => {
    if (!amountInWords) return null;

    return (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Amount Chargeable (in words) {isArabic && '/ المبلغ كتابة'}
            </p>
            <p className="text-xs font-black text-slate-900 mt-0.5">
                {amountInWords}
            </p>
        </div>
    );
};

export default AmountInWordsCard;
