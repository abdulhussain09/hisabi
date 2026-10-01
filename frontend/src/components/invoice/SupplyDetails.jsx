import React from 'react';

const SupplyDetails = ({ invoice, countryConfig }) => {
    const hasSupplyDate = countryConfig.fields.supplyDate && invoice.supply_date;
    const hasPlaceOfSupply = countryConfig.fields.placeOfSupply && (invoice.place_of_supply_state || invoice.place_of_supply_code);
    const isReverseCharge = countryConfig.fields.reverseCharge && invoice.reverse_charge;

    if (!hasSupplyDate && !hasPlaceOfSupply && !isReverseCharge) return null;

    const supplyDateStr = invoice.supply_date ? new Date(invoice.supply_date).toLocaleDateString('en-GB') : null;

    return (
        <div className="bg-slate-100/70 border border-slate-200/80 rounded-xl p-3 mb-6 flex flex-wrap items-center justify-between gap-4 text-xs">
            {hasPlaceOfSupply && (
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Place of Supply:</span>
                    <span className="font-black text-slate-800">
                        {invoice.place_of_supply_state || ''} {invoice.place_of_supply_code ? `(${invoice.place_of_supply_code})` : ''}
                    </span>
                </div>
            )}
            {hasSupplyDate && (
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Date of Supply:</span>
                    <span className="font-black text-slate-800">{supplyDateStr}</span>
                </div>
            )}
            {isReverseCharge && (
                <div className="flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300/80 px-2.5 py-1 rounded-lg font-black text-[10px] uppercase">
                    <span>Reverse Charge Applicable</span>
                </div>
            )}
        </div>
    );
};

export default SupplyDetails;
