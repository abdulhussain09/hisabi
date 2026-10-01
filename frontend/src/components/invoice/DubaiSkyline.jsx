import React from 'react';

export const DubaiSkyline = ({ className = "w-44 h-14 text-sky-400 opacity-80" }) => (
    <svg className={className} viewBox="0 0 200 65" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Burj Khalifa Silhouette in center */}
        <path d="M98 65V45L99 30L99.5 15L100 2L100.5 15L101 30L102 45V65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="97" y1="48" x2="103" y2="48" stroke="currentColor" strokeWidth="1" />
        <line x1="98" y1="35" x2="102" y2="35" stroke="currentColor" strokeWidth="1" />
        <line x1="99" y1="20" x2="101" y2="20" stroke="currentColor" strokeWidth="1" />
        <line x1="100" y1="2" x2="100" y2="0" stroke="currentColor" strokeWidth="1.2" />

        {/* Burj Al Arab Silhouette on left */}
        <path d="M30 65V35C30 35 34 25 45 25C54 25 57 33 57 65" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12" />
        <line x1="43" y1="25" x2="43" y2="65" stroke="currentColor" strokeWidth="1.2" />
        <line x1="30" y1="42" x2="57" y2="42" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />

        {/* Emirates Towers / Skyscrapers on right */}
        <path d="M140 65V26L148 18L156 26V65" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
        <path d="M162 65V32L168 25L174 32V65" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />

        {/* Supporting urban skyline */}
        <rect x="10" y="48" width="14" height="17" rx="1" fill="currentColor" fillOpacity="0.15" />
        <rect x="65" y="40" width="12" height="25" rx="1" fill="currentColor" fillOpacity="0.18" />
        <rect x="80" y="32" width="12" height="33" rx="1" fill="currentColor" fillOpacity="0.22" />
        <rect x="106" y="36" width="14" height="29" rx="1" fill="currentColor" fillOpacity="0.2" />
        <rect x="124" y="44" width="12" height="21" rx="1" fill="currentColor" fillOpacity="0.15" />
        <rect x="180" y="42" width="14" height="23" rx="1" fill="currentColor" fillOpacity="0.15" />

        <line x1="0" y1="64.5" x2="200" y2="64.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
);
