'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { printPalette, printableColor } from '@/lib/print-palette';
export function QrCode({
  value,
  color = '#22213e',
  onReady,
  decorative = false,
}: {
  value?: string;
  color?: string;
  onReady?: (svg: string) => void;
  decorative?: boolean;
}) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(true);
  const foreground = printableColor(color);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError(false);
    const deadline = setTimeout(() => {
      if (active) {
        active = false;
        setError(true);
        setBusy(false);
      }
    }, 10000);
    QRCode.toString(
      value ??
        (decorative
          ? 'RevuPing illustration: explore the demo to create a business QR card.'
          : `${window.location.origin}/r/demo-salon`),
      {
        type: 'svg',
        margin: 4,
        width: 220,
        color: { dark: foreground, light: printPalette.paper },
        errorCorrectionLevel: 'M',
      },
    )
      .then((value) => {
        if (active) {
          clearTimeout(deadline);
          setBusy(false);
          setSvg(value);
          onReady?.(value);
        }
      })
      .catch(() => {
        if (active) {
          clearTimeout(deadline);
          setBusy(false);
          setError(true);
        }
      });
    return () => {
      active = false;
      clearTimeout(deadline);
    };
  }, [value, foreground, onReady, decorative, attempt]);
  if (error)
    return (
      <div className="qr-code" role="alert">
        <p>QR preview could not load.</p>
        <button onClick={() => setAttempt((value) => value + 1)}>
          Retry QR preview
        </button>
      </div>
    );
  return (
    <div
      className="qr-code"
      style={{
        minHeight: 220,
        width: '100%',
        maxWidth: 220,
        marginInline: 'auto',
      }}
      aria-busy={busy}
      role="img"
      aria-label={
        decorative
          ? 'Illustrative QR pattern, not a customer link'
          : value
            ? 'QR code linking to the customer page'
            : 'QR code linking to the demo salon customer page'
      }
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
