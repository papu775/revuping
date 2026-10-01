'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
export function QrCode({
  color = '#22213e',
  onReady,
}: {
  color?: string;
  onReady?: (svg: string) => void;
}) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let active = true;
    QRCode.toString(`${window.location.origin}/r/demo-salon`, {
      type: 'svg',
      margin: 1,
      width: 220,
      color: { dark: color, light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then((value) => {
      if (active) {
        setSvg(value);
        onReady?.(value);
      }
    });
    return () => {
      active = false;
    };
  }, [color, onReady]);
  return (
    <div
      className="qr-code"
      role="img"
      aria-label="QR code linking to the demo salon customer page"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
