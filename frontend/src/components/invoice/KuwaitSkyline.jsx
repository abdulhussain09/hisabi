import React from 'react';

export const KuwaitSkyline = ({ className = "w-44 h-14 text-sky-400 opacity-80" }) => (
    <svg className={className} viewBox="0 0 200 65" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Kuwait Towers Silhouette */}
        {/* Main Tower with 2 spheres */}
        <path d="M125 65V35L124 10L125 5L126 10L125 35V65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="125" cy="38" rx="8" ry="7" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
        <ellipse cx="125" cy="22" rx="5" ry="4.5" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
        <path d="M125 5V0" stroke="currentColor" strokeWidth="1.2" />
        
        {/* Second Tower with 1 sphere */}
        <path d="M142 65V42L141.5 25L142 20L142.5 25L142 42V65" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <ellipse cx="142" cy="40" rx="6" ry="5" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
        <path d="M142 20V15" stroke="currentColor" strokeWidth="1" />

        {/* Third Tower (Spike) */}
        <path d="M110 65V46L110.5 35L110 30L109.5 35L110 46V65" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />

        {/* Liberation Tower Silhouette on left */}
        <path d="M60 65V30L58 28H62L60 30V65" stroke="currentColor" strokeWidth="1.2" />
        <path d="M57 38H63" stroke="currentColor" strokeWidth="1.5" />
        <path d="M55 45H65" stroke="currentColor" strokeWidth="1.5" />
        <path d="M60 28V12L59.5 8L60 6L60.5 8L60 12" stroke="currentColor" strokeWidth="1.2" />

        {/* Modern Buildings background skyline */}
        <rect x="15" y="42" width="12" height="23" rx="1" fill="currentColor" fillOpacity="0.15" />
        <rect x="30" y="36" width="10" height="29" rx="1" fill="currentColor" fillOpacity="0.2" />
        <rect x="42" y="48" width="10" height="17" rx="1" fill="currentColor" fillOpacity="0.15" />
        <rect x="70" y="40" width="14" height="25" rx="1" fill="currentColor" fillOpacity="0.2" />
        <rect x="88" y="45" width="12" height="20" rx="1" fill="currentColor" fillOpacity="0.15" />
        <rect x="155" y="44" width="14" height="21" rx="1" fill="currentColor" fillOpacity="0.2" />
        <rect x="173" y="38" width="16" height="27" rx="1" fill="currentColor" fillOpacity="0.15" />
        <line x1="0" y1="64.5" x2="200" y2="64.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
);
