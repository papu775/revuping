'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { QrSettings, QrSettingsInput } from 'api-contracts';
import { authErrorMessage, qrSettingsInputSchema } from 'api-contracts';
import { authRequest } from '@/data-access/auth-client';
import { Panel } from '@/components/shared';
import { QrCode } from '@/components/qr-code';
import { BrandColour } from '@/components/ui/brand-colour';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/ui/page-heading';
import { qrCardSvg } from '@/lib/qr-card-export';
import { printableColor } from '@/lib/print-palette';
import { useToast } from '@/components/ui/toaster';
const input = (s: QrSettings): QrSettingsInput => ({
  revision: s.revision,
  displayName: s.displayName,
  displayText: s.displayText,
  brandColor: s.brandColor,
  layout: s.layout,
  googleReviewUrl: s.googleReviewUrl,
  enabled: s.enabled,
});
export function RealQrStudio({
  workspaceId,
  owner,
  locations,
}: {
  workspaceId: string;
  owner: boolean;
  locations: QrSettings[];
}) {
  const [list, setList] = useState(locations);
  const [selected, setSelected] = useState(locations[0]?.id ?? '');
  const saved = list.find((l) => l.id === selected);
  const [draft, setDraft] = useState<QrSettingsInput | null>(
    saved ? input(saved) : null,
  );
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const toast = useToast();
  const dirty =
    !!saved &&
    !!draft &&
    JSON.stringify(input(saved)) !== JSON.stringify(draft);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const update = useCallback(
    (patch: Partial<QrSettingsInput>) =>
      setDraft((d) => (d ? { ...d, ...patch } : d)),
    [],
  );
  if (!saved || !draft)
    return (
      <section className="setup-card">
        <h1>QR studio unavailable</h1>
        <p>Complete business setup with a location first.</p>
      </section>
    );
  const color = draft.brandColor ?? saved.businessColor;
  const qrColor = printableColor(color);
  const name = draft.displayName || saved.businessName;
  const logoUrl = `/api/backend/workspaces/${workspaceId}/logo`;
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(authErrorMessage(e));
      toast(
        'Action could not be completed. Your changes are preserved.',
        'error',
      );
    } finally {
      lock.current = false;
      setPending(false);
    }
  };
  const download = async (format: 'svg' | 'png') => {
    const qr = await QRCode.toString(saved.customerUrl, {
      type: 'svg',
      margin: 4,
      color: { dark: printableColor(saved.effectiveColor), light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
    let logo: string | undefined;
    if (saved.hasLogo) {
      const response = await fetch(logoUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Logo unavailable');
      const blob = await response.blob();
      logo = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Logo unavailable'));
        reader.readAsDataURL(blob);
      });
    }
    const svg = qrCardSvg({
      name: saved.effectiveName,
      text: saved.displayText,
      color: saved.effectiveColor,
      template: saved.layout,
      qr,
      logo,
      subtitle: saved.locationName,
    });
    let asset = new Blob([svg], { type: 'image/svg+xml' });
    if (format === 'png') {
      const uri = URL.createObjectURL(asset);
      try {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error('Export timed out')),
            15000,
          );
          image.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          image.onerror = () => {
            clearTimeout(timer);
            reject(new Error('Export unavailable'));
          };
          image.src = uri;
        });
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth * 4;
        canvas.height = image.naturalHeight * 4;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Export unavailable');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        asset = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Export unavailable'))),
            'image/png',
          ),
        );
      } finally {
        URL.revokeObjectURL(uri);
      }
    }
    const uri = URL.createObjectURL(asset);
    const anchor = document.createElement('a');
    anchor.href = uri;
    anchor.download = `revuping-${saved.id}.${format}`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(uri), 1000);
    toast('QR card downloaded');
  };
  return (
    <>
      <PageHeading
        eyebrow="Branded customer experience"
        title="QR code studio"
        text="Create a customer card for your saved location. Both review and private feedback choices remain available."
      />
      <div className="qr-editor">
        <Panel className="qr-controls">
          <h2>Customise your QR card</h2>
          <label className="field">
            Location
            <select
              aria-label="Location"
              value={selected}
              disabled={pending}
              onChange={(e) => {
                if (
                  dirty &&
                  !window.confirm('Discard unsaved changes for this location?')
                )
                  return;
                const next = list.find((l) => l.id === e.target.value);
                if (!next) return;
                setSelected(next.id);
                setDraft(input(next));
                setError('');
              }}
            >
              {list.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.locationName}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">
            These are location-specific display overrides. Your business name
            and onboarding branding stay unchanged.
          </p>
          <fieldset disabled={!owner || pending} className="qr-settings-fields">
            <label className="field">
              Display name override
              <input
                value={draft.displayName}
                maxLength={100}
                placeholder={saved.businessName}
                onChange={(e) => update({ displayName: e.target.value })}
              />
            </label>
            <label className="field">
              Display text
              <input
                value={draft.displayText}
                maxLength={120}
                onChange={(e) => update({ displayText: e.target.value })}
              />
            </label>
            <BrandColour
              label="Brand colour override"
              value={color}
              onChange={(value) => update({ brandColor: value })}
            />
            <Button
              variant="ghost"
              onClick={() => update({ brandColor: null })}
            >
              Use business colour
            </Button>
            <label className="field">
              Choose a layout
              <select
                aria-label="Choose a layout"
                value={draft.layout}
                onChange={(e) =>
                  update({
                    layout: e.target.value as QrSettingsInput['layout'],
                  })
                }
              >
                <option>Counter card</option>
                <option>Minimal poster</option>
              </select>
            </label>
            <label className="field">
              Google review URL
              <input
                type="url"
                value={draft.googleReviewUrl}
                maxLength={500}
                placeholder="https://g.page/r/…/review"
                onChange={(e) => update({ googleReviewUrl: e.target.value })}
              />
            </label>
            <p className="field-help">
              Supported: g.page/r/…/review,
              search.google.com/local/writereview?placeid=…, or Google Maps
              /maps?cid=…. Short Maps redirects are not supported.
            </p>
            <label className="check-label">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => update({ enabled: e.target.checked })}
              />{' '}
              Enable customer page
            </label>
            <Button
              disabled={
                !dirty || !qrSettingsInputSchema.safeParse(draft).success
              }
              aria-busy={pending}
              onClick={() =>
                void run(async () => {
                  const next = await authRequest(
                    `workspaces/${workspaceId}/locations/${saved.id}/qr`,
                    'qrSettings',
                    draft,
                    'PUT',
                  );
                  setList((items) =>
                    items.map((l) => (l.id === next.id ? next : l)),
                  );
                  setDraft(input(next));
                  toast('QR settings saved');
                })
              }
            >
              {pending ? 'Saving…' : 'Save QR settings'}
            </Button>
          </fieldset>
          {!owner && (
            <p>
              Staff can preview and export saved settings. Only owners can edit.
            </p>
          )}
          {dirty && (
            <p role="status">
              Unsaved changes. Save before exporting or opening the customer
              page.
            </p>
          )}
          {!!error && (
            <p role="alert" className="error-note">
              {error} Reload to resolve a version conflict; copy your changes
              first.
            </p>
          )}
          <div className="qr-actions">
            <Button
              variant="secondary"
              disabled={dirty || pending || !saved.enabled}
              onClick={() => void run(() => download('svg'))}
            >
              Download SVG card
            </Button>
            <Button
              variant="secondary"
              disabled={dirty || pending || !saved.enabled}
              onClick={() => void run(() => download('png'))}
            >
              Download PNG card
            </Button>
            <Button
              variant="secondary"
              disabled={dirty || pending}
              onClick={() =>
                void run(async () => {
                  await navigator.clipboard.writeText(saved.customerUrl);
                  toast('Customer link copied');
                })
              }
            >
              Copy customer link
            </Button>
            <Button asChild variant="secondary">
              <a
                href={saved.customerUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={dirty}
                onClick={(e) => {
                  if (dirty) e.preventDefault();
                }}
              >
                Preview customer experience
              </a>
            </Button>
          </div>
          <p className="field-help">
            PNG width: 1680 pixels. At 300 dpi this is 5.6 inches wide; test
            your final print and scan distance. No physical scan has been
            certified.
          </p>
          {['localhost', '127.0.0.1', '[::1]'].includes(
            new URL(saved.customerUrl).hostname,
          ) && (
            <p className="info-note">
              Local-only link: a phone cannot reach your computer’s localhost.
              Configure a reachable customer web origin before printing.
            </p>
          )}
        </Panel>
        <section className="qr-preview-area" aria-label="QR card preview">
          <div
            className={`qr-print-card ${draft.layout === 'Minimal poster' ? 'poster' : ''}`}
            style={{ borderTopColor: color }}
          >
            {saved.hasLogo && (
              <img
                src={logoUrl}
                width={80}
                height={54}
                alt={`${saved.businessName} logo`}
                className="qr-business-logo"
                onError={() =>
                  setError(
                    'The saved logo could not load. Try again before exporting.',
                  )
                }
              />
            )}
            <h2 style={{ color: qrColor }}>{name}</h2>
            <span className="salon-sub">{saved.locationName}</span>
            <QrCode value={saved.customerUrl} color={qrColor} />
            <h3>{draft.displayText}</h3>
            <p>
              Scan to share an honest review
              <br />
              or send us private feedback.
            </p>
            <span className="powered-by">
              a little ping, powered by RevuPing
            </span>
          </div>
          {qrColor !== color && (
            <p className="field-help">
              A darker QR colour keeps the code readable; your accent is
              preserved on the card.
            </p>
          )}
          <p className="qr-customer-url">{saved.customerUrl}</p>
        </section>
      </div>
    </>
  );
}
