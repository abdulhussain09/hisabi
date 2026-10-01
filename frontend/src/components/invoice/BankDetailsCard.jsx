import React from 'react';

const BankDetailsCard = ({ shop, bankDetails, isArabic }) => {
    const bank = bankDetails || shop?.bank_details || {};
    if (!bank.bank_name && !bank.account_number && !bank.iban_ifsc) return null;

    return (
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-xs">
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2 border-b border-slate-200/60 pb-1">
                BANK DETAILS {isArabic && '/ تفاصيل البنك'}
            </h4>
            <div className="space-y-1 text-slate-700">
                {bank.bank_name && (
                    <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Bank Name:</span>
                        <span className="font-bold text-slate-900">{bank.bank_name}</span>
                    </div>
                )}
                {bank.account_name && (
                    <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Account Holder:</span>
                        <span className="font-bold text-slate-900">{bank.account_name}</span>
                    </div>
                )}
                {bank.account_number && (
                    <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">A/C No:</span>
                        <span className="font-mono font-bold text-slate-900">{bank.account_number}</span>
                    </div>
                )}
                {bank.iban_ifsc && (
                    <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">IBAN / IFSC:</span>
                        <span className="font-mono font-bold text-slate-900">{bank.iban_ifsc}</span>
                    </div>
                )}
                {bank.swift_bic && (
                    <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">SWIFT / BIC:</span>
                        <span className="font-mono font-bold text-slate-900">{bank.swift_bic}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BankDetailsCard;
