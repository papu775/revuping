'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Download,
  Leaf,
  QrCode as QrIcon,
} from 'lucide-react';
import type { QrSettings, QrSettingsInput } from 'api-contracts';
import { authErrorMessage, qrSettingsInputSchema } from 'api-contracts';
import { authRequest } from '@/data-access/auth-client';
import { Panel, Field } from '@/components/shared';
import { Dialog } from '@/components/ui/dialog';
import { InlineSpinner } from '@/components/ui/loading';
import { withDeadline } from '@/lib/async-actions';
import { QrCode } from '@/components/qr-code';
import { BrandColour } from '@/components/ui/brand-colour';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/ui/page-heading';
import { qrCardSvg } from '@/lib/qr-card-export';
import { printableColor } from '@/lib/print-palette';
import { useToast } from '@/components/ui/toaster';
type Action = 'save' | 'svg' | 'png' | 'copy';
function ActionLabel({
  label,
  busy,
  pendingLabel,
}: {
  label: string;
  busy: boolean;
  pendingLabel: string;
}) {
  return (
    <span className="action-label">
      <span className="reserved-label" aria-hidden="true">
        {label}
      </span>
      <span>{busy ? pendingLabel : label}</span>
    </span>
  );
}
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
  const [activity, setActivity] = useState<Action | null>(null);
  const [failureAction, setFailureAction] = useState<Action | null>(null);
  const [preview, setPreview] = useState(false);
  const pending = activity !== null;
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
  const run = async (kind: Action, action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setActivity(kind);
    setError('');
    setFailureAction(null);
    try {
      await action();
    } catch (e) {
      setError(authErrorMessage(e));
      setFailureAction(kind);
      toast(
        'Action could not be completed. Your changes are preserved.',
        'error',
      );
    } finally {
      lock.current = false;
      setActivity(null);
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
  const save = async () => {
    const next = await authRequest(
      `workspaces/${workspaceId}/locations/${saved.id}/qr`,
      'qrSettings',
      draft,
      'PUT',
    );
    setList((items) =>
      items.map((location) => (location.id === next.id ? next : location)),
    );
    setDraft(input(next));
    toast('QR settings saved');
  };
  const copy = async () => {
    await withDeadline(navigator.clipboard.writeText(saved.customerUrl));
    toast('Customer link copied');
  };
  const retry = () => {
    if (failureAction === 'save') void run('save', save);
    else if (failureAction === 'copy') void run('copy', copy);
    else if (failureAction) void run('svg', () => download('svg'));
  };
  const textValid = !!draft.displayText.trim();
  const googleValid = qrSettingsInputSchema.shape.googleReviewUrl.safeParse(
    draft.googleReviewUrl,
  ).success;
  const localOnly = ['localhost', '127.0.0.1', '[::1]'].includes(
    new URL(saved.customerUrl).hostname,
  );
  return (
    <>
      <PageHeading
        eyebrow="Branded customer experience"
        title="QR code studio"
        text="Customise your business’s QR card and download an SVG or high-resolution PNG."
      />
      <div className="qr-editor">
        <Panel className="qr-controls">
          <h2>Customise your QR card</h2>
          <p className="muted">Live preview · Save to publish and export.</p>
          <Field>
            Location
            <select
              aria-label="Location"
              value={selected}
              disabled={pending}
              onChange={(event) => {
                if (
                  dirty &&
                  !window.confirm('Discard unsaved changes for this location?')
                )
                  return;
                const next = list.find(
                  (location) => location.id === event.target.value,
                );
                if (!next) return;
                setSelected(next.id);
                setDraft(input(next));
                setError('');
                setFailureAction(null);
                setPreview(false);
              }}
            >
              {list.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.locationName}
                </option>
              ))}
            </select>
          </Field>
          <fieldset disabled={!owner || pending} className="qr-settings-fields">
            <Field>
              Display name override
              <input
                value={draft.displayName}
                maxLength={100}
                placeholder={saved.businessName}
                aria-describedby="qr-name-help"
                onChange={(event) =>
                  update({ displayName: event.target.value })
                }
              />
            </Field>
            <p className="field-help" id="qr-name-help">
              Blank inherits your business name. This override is for the QR
              card only.
            </p>
            <Field>
              Display text
              <input
                value={draft.displayText}
                maxLength={120}
                aria-invalid={!textValid}
                aria-describedby={!textValid ? 'qr-text-error' : undefined}
                onChange={(event) =>
                  update({ displayText: event.target.value })
                }
              />
            </Field>
            {!textValid && (
              <p className="error-note" id="qr-text-error">
                Enter display text before saving or exporting.
              </p>
            )}
            <BrandColour
              label="Brand colour override"
              value={color}
              onChange={(value) => update({ brandColor: value })}
              pickerLabel="Custom brand colour"
            />
            <Button
              variant="ghost"
              size="small"
              onClick={() => update({ brandColor: null })}
            >
              Use business colour
            </Button>
            {qrColor !== color && (
              <p className="field-help" role="status">
                A darker QR colour keeps the code readable; your accent is
                preserved on the card.
              </p>
            )}
            <Field as="div">
              Choose a layout
              <Tabs.Root
                value={draft.layout}
                onValueChange={(layout) =>
                  update({ layout: layout as QrSettingsInput['layout'] })
                }
              >
                <Tabs.List
                  className="template-tabs"
                  aria-label="QR card layout"
                >
                  {(['Counter card', 'Minimal poster'] as const).map(
                    (layout) => (
                      <Tabs.Trigger
                        key={layout}
                        value={layout}
                        id={`real-qr-${layout === 'Counter card' ? 'card' : 'poster'}-tab`}
                        aria-controls={`real-qr-${layout === 'Counter card' ? 'card' : 'poster'}-panel`}
                      >
                        <QrIcon size={21} />
                        {layout}
                      </Tabs.Trigger>
                    ),
                  )}
                </Tabs.List>
                <Tabs.Content
                  value="Counter card"
                  id="real-qr-card-panel"
                  aria-labelledby="real-qr-card-tab"
                  className="field-help"
                >
                  Rounded card with a branded border, designed for your counter.
                </Tabs.Content>
                <Tabs.Content
                  value="Minimal poster"
                  id="real-qr-poster-panel"
                  aria-labelledby="real-qr-poster-tab"
                  className="field-help"
                >
                  A clean, straight-edged layout for display on a wall or
                  mirror.
                </Tabs.Content>
              </Tabs.Root>
            </Field>
            <details className="qr-page-settings">
              <summary>Customer page settings</summary>
              <Field>
                Google review URL
                <input
                  type="url"
                  value={draft.googleReviewUrl}
                  maxLength={500}
                  aria-invalid={!googleValid}
                  aria-describedby="qr-google-help"
                  placeholder="https://g.page/r/…/review"
                  onChange={(event) =>
                    update({ googleReviewUrl: event.target.value })
                  }
                />
              </Field>
              <p className="field-help" id="qr-google-help">
                Supported: g.page/r/…/review,
                search.google.com/local/writereview?placeid=…, or Google Maps
                /maps?cid=…. Short Maps redirects are not supported.
              </p>
              {!googleValid && (
                <p className="error-note">
                  Use a supported HTTPS Google review or Maps URL.
                </p>
              )}
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(event) =>
                    update({ enabled: event.target.checked })
                  }
                />{' '}
                Enable customer page
              </label>
            </details>
            <Button
              variant="secondary"
              className="w-full"
              disabled={
                !dirty || !qrSettingsInputSchema.safeParse(draft).success
              }
              aria-busy={activity === 'save'}
              onClick={() => void run('save', save)}
            >
              {activity === 'save' && <InlineSpinner />}
              <ActionLabel
                label="Save QR settings"
                busy={activity === 'save'}
                pendingLabel="Saving…"
              />
            </Button>
          </fieldset>
          {!owner && (
            <p className="field-help">
              Staff can preview and export saved settings. Only owners can edit.
            </p>
          )}
          <p role="status" className="field-help">
            {dirty
              ? 'Unsaved changes. Save before exporting or opening the customer page.'
              : 'Saved settings · Ready to preview and export.'}
          </p>
          <div className="form-divider" />
          <div className="info-note">
            <CheckCircle2 size={18} />
            <p>
              {localOnly
                ? 'Local-only link: a phone cannot reach your computer’s localhost. Configure a reachable customer web origin before printing.'
                : 'This QR opens your saved customer page. Both review and private feedback choices remain available.'}
            </p>
          </div>
          <Button
            disabled={dirty || pending || !saved.enabled}
            aria-busy={activity === 'svg'}
            onClick={() => void run('svg', () => download('svg'))}
          >
            {activity === 'svg' ? <InlineSpinner /> : <Download size={17} />}
            <ActionLabel
              label="Download SVG card"
              busy={activity === 'svg'}
              pendingLabel="Exporting…"
            />
          </Button>
          <Button
            variant="secondary"
            disabled={dirty || pending || !saved.enabled}
            aria-busy={activity === 'png'}
            onClick={() => void run('png', () => download('png'))}
          >
            {activity === 'png' ? <InlineSpinner /> : <Download size={17} />}
            <ActionLabel
              label="Download PNG card"
              busy={activity === 'png'}
              pendingLabel="Exporting…"
            />
          </Button>
          <Button
            variant="ghost"
            disabled={dirty || pending}
            aria-busy={activity === 'copy'}
            onClick={() => void run('copy', copy)}
          >
            {activity === 'copy' ? <InlineSpinner /> : <Copy size={17} />}
            <ActionLabel
              label="Copy customer link"
              busy={activity === 'copy'}
              pendingLabel="Copying…"
            />
          </Button>
          <Button
            variant="secondary"
            disabled={dirty || pending || !saved.enabled}
            onClick={() => setPreview(true)}
          >
            Preview customer experience <ArrowUpRight size={16} />
          </Button>
          {!!error && (
            <div role="alert" className="info-note qr-action-error">
              <p className="error-note">
                {error} Your changes are preserved. For a version conflict, copy
                your draft before reloading.
              </p>
              {failureAction && (
                <Button
                  variant="secondary"
                  disabled={
                    pending ||
                    (failureAction === 'save'
                      ? !owner ||
                        !dirty ||
                        !qrSettingsInputSchema.safeParse(draft).success
                      : dirty ||
                        ((failureAction === 'svg' || failureAction === 'png') &&
                          !saved.enabled))
                  }
                  onClick={retry}
                >
                  {failureAction === 'save'
                    ? 'Retry saving settings'
                    : failureAction === 'copy'
                      ? 'Retry copying link'
                      : 'Retry SVG export'}
                </Button>
              )}
            </div>
          )}
        </Panel>
        <section className="qr-canvas bg-section" aria-label="QR card preview">
          <div className="canvas-label">
            <span>LIVE PREVIEW</span>
            <span>{draft.layout}</span>
          </div>
          <div
            className={`qr-print-card ${draft.layout === 'Minimal poster' ? 'poster' : ''}`}
            style={{ borderTopColor: color }}
          >
            {saved.hasLogo ? (
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
            ) : (
              <Leaf size={33} style={{ color: qrColor }} />
            )}
            <h2 style={{ color: qrColor }}>{name}</h2>
            <span className="salon-sub">{saved.locationName}</span>
            <QrCode value={saved.customerUrl} color={qrColor} />
            <h3>{draft.displayText || 'Share your experience'}</h3>
            <p>
              Scan to share an honest review
              <br />
              or send us private feedback.
            </p>
            <span className="powered-by">
              a little ping, powered by RevuPing
            </span>
          </div>
          <span className="canvas-footnote">
            SVG or PNG download ·{' '}
            {dirty
              ? 'Unsaved preview'
              : saved.enabled
                ? 'Links to your customer page'
                : 'Customer page disabled'}
          </span>
          <p className="qr-customer-url">{saved.customerUrl}</p>
          <details className="qr-export-details">
            <summary>Export resolution & print guidance</summary>
            <p className="field-help">
              PNG width: 1680 pixels. At 300 dpi this is 5.6 inches wide; test
              your final print and scan distance. No physical scan has been
              certified.
            </p>
          </details>
        </section>
      </div>
      <Dialog
        open={preview}
        onOpenChange={setPreview}
        title="Preview the customer experience"
        description="This preview uses saved settings. Customers can always choose a Google review or private feedback, regardless of their rating."
      >
        <div className="preview-customer">
          {saved.hasLogo ? (
            <img
              src={logoUrl}
              width={100}
              height={60}
              alt={`${saved.businessName} logo`}
              className="qr-business-logo"
            />
          ) : (
            <Leaf
              size={30}
              style={{ color: printableColor(saved.effectiveColor) }}
            />
          )}
          <h3>{saved.effectiveName}</h3>
          <p>{saved.locationName}</p>
          <p>{saved.displayText}</p>
          <p className="field-help">
            {saved.googleReviewUrl
              ? 'Google review and private feedback are both available.'
              : 'No Google review link is configured. Private feedback is available.'}
          </p>
          <Button asChild>
            <a
              href={saved.customerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open customer page <ArrowRight size={16} />
            </a>
          </Button>
        </div>
      </Dialog>
    </>
  );
}
