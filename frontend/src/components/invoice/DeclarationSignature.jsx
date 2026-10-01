import React from 'react';

const DeclarationSignature = ({ shop, declaration, countryConfig }) => {
    const defaultDecl = "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
    const declText = declaration || defaultDecl;
    const isArabic = countryConfig.supportsArabic;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
            {/* DECLARATION / NOTES */}
            <div className="space-y-1">
                <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
                    DECLARATION {isArabic && '/ إقرار'}
                </p>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    {declText}
                </p>
            </div>

            {/* SIGNATURE SECTION */}
            <div className="flex justify-between items-end pt-8 md:pt-4">
                <div className="text-center w-36">
                    <div className="border-b border-slate-300 mb-1"></div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Customer Signature</p>
                </div>
                <div className="text-center w-40">
                    <div className="border-b border-slate-300 mb-1"></div>
                    <p className="text-[10px] font-black text-slate-900 uppercase">For {shop?.name || 'Company'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Authorised Signatory</p>
                </div>
            </div>
        </div>
    );
};

export default DeclarationSignature;
