import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode } from 'lucide-react';

const QRCodeImage = ({
    text,
    alt = 'Payment QR',
    className = 'w-full h-full object-contain',
    containerClassName = 'w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-center',
    unavailableText = 'QR Unavailable',
    unavailableSubtext = 'No UPI ID Configured'
}) => {
    const [dataUrl, setDataUrl] = useState('');

    useEffect(() => {
        let isMounted = true;
        if (!text || typeof text !== 'string' || text.trim() === '') {
            setDataUrl('');
            return;
        }

        QRCode.toDataURL(text.trim(), {
            margin: 1,
            width: 140,
            errorCorrectionLevel: 'M',
            color: {
                dark: '#0f172a',
                light: '#ffffff'
            }
        })
            .then(url => {
                if (isMounted) setDataUrl(url);
            })
            .catch(() => {
                if (isMounted) setDataUrl('');
            });

        return () => {
            isMounted = false;
        };
    }, [text]);

    if (!text || !dataUrl) {
        return (
            <div className={`${containerClassName} bg-slate-50 border-dashed border-slate-300 flex-col p-1 text-center`}>
                <QrCode className="w-5 h-5 text-slate-300" />
                <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider leading-tight mt-0.5">
                    {unavailableText}
                </span>
                <span className="text-[6.5px] text-slate-400 leading-tight">
                    {unavailableSubtext}
                </span>
            </div>
        );
    }

    return (
        <div className={containerClassName}>
            <img src={dataUrl} alt={alt} className={className} />
        </div>
    );
};

export default QRCodeImage;
