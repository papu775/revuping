'use client';
import { useState, useRef } from 'react';
import { withDeadline } from '@/lib/async-actions';
import { InlineSpinner } from '@/components/ui/loading';
import { Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { BrandColour } from '@/components/ui/brand-colour';
import { useDemoWorkspace } from '@/data-access/demo-workspace';
import { useToast } from '@/components/ui/toaster';
import { reviews } from '@/data-access/mock-data';
import { Stars } from '@/components/shared';
import {
  Panel,
  Field,
  Button,
  PageHeading,
  Picker,
  Select,
  DemoBanner,
  ErrorText,
  ExportButton,
  Empty,
} from '@/features/product/common';
const xml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
function socialSvg(
  name: string,
  text: string,
  rating: number,
  colour: string,
  author: string,
) {
  const brandLines = name.match(/.{1,30}/gu) || [name];
  const lines = text.match(/.{1,48}(?:\s|$)/g) || [text];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" rx="32" fill="#faf8f3"/><rect x="35" y="35" width="830" height="530" rx="24" fill="white" stroke="#dddcd6"/>${brandLines.map((line, index) => `<text x="80" y="${95 + index * 30}" font-family="sans-serif" font-size="25" fill="#20243c">${xml(line)}</text>`).join('')}<text x="80" y="165" font-family="sans-serif" font-size="34" fill="${xml(colour)}">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</text>${lines
    .slice(0, 6)
    .map(
      (line, index) =>
        `<text x="80" y="${230 + index * 38}" font-family="sans-serif" font-size="26" fill="#20243c">${xml(line.trim())}</text>`,
    )
    .join(
      '',
    )}<text x="80" y="485" font-family="sans-serif" font-size="21" fill="#535768">${xml(author)} · Fictional review sample</text><text x="80" y="530" font-family="sans-serif" font-size="17" fill="#535768">RevuPing frontend demo · not a real endorsement</text></svg>`;
}
export function Widgets() {
  const { product, updateProduct } = useDemoWorkspace();
  const toast = useToast();
  const [carousel, setCarousel] = useState(0);
  const [socialId, setSocialId] = useState(reviews[0].id);
  const [copyError, setCopyError] = useState(false);
  const [copying, setCopying] = useState(false);
  const copyLock = useRef(false);
  const widget = product.widget;
  const chosen = reviews.filter((review) =>
    widget.reviewIds.includes(review.id),
  );
  const active = reviews.find((review) => review.id === socialId) || reviews[0];
  const code = `<div data-revuping-demo-widget="${widget.layout.toLowerCase().replaceAll(' ', '-')}" data-theme="${widget.theme.toLowerCase()}">Sample placeholder — not a production embed</div>`;
  async function copyCode() {
    if (copyLock.current) return;
    copyLock.current = true;
    setCopying(true);
    try {
      await withDeadline(navigator.clipboard.writeText(code));
      setCopyError(false);
      toast('Sample embed code copied');
    } catch {
      setCopyError(true);
      toast('Sample code could not be copied', 'error');
    } finally {
      copyLock.current = false;
      setCopying(false);
    }
  }
  function previewCard(review: (typeof reviews)[number]) {
    return (
      <article key={review.id} className="widget-review">
        <Stars rating={review.rating} />
        <p>{review.text}</p>
        <strong>{review.name}</strong>
        <small>Fictional review sample</small>
      </article>
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="A showcase, without inflated claims"
        title="Review widgets & social cards"
        text="Choose a fictional review layout, inspect sample markup and create a local social-card file."
      />
      <DemoBanner>
        Widget markup is illustrative only. Production installation and live
        review feeds are not implemented.
      </DemoBanner>
      <div className="product-split">
        <Panel>
          <h2>Widget controls</h2>
          <Picker
            label="Widget layout"
            value={widget.layout}
            onChange={(layout) =>
              updateProduct({ widget: { ...widget, layout } })
            }
            options={[
              'Compact badge',
              'Review cards',
              'Carousel',
              'Review wall',
            ]}
          />
          <Picker
            label="Widget preview theme"
            value={widget.theme}
            onChange={(theme) =>
              updateProduct({ widget: { ...widget, theme } })
            }
            options={['Light', 'Dark']}
          />
          <BrandColour
            label="Accent colour"
            value={widget.colour}
            onChange={(colour) =>
              updateProduct({ widget: { ...widget, colour } })
            }
          />
          <h3>Choose sample reviews</h3>
          {reviews.map((review) => (
            <label key={review.id} className="consent-checkbox">
              <input
                type="checkbox"
                checked={widget.reviewIds.includes(review.id)}
                onChange={(event) => {
                  setCarousel(0);
                  updateProduct({
                    widget: {
                      ...widget,
                      reviewIds: event.target.checked
                        ? [...widget.reviewIds, review.id]
                        : widget.reviewIds.filter((id) => id !== review.id),
                    },
                  });
                }}
              />
              <span>
                {review.name} · {review.rating}/5<small>{review.text}</small>
              </span>
            </label>
          ))}
          <p className="field-help">
            Selecting reviews changes this demonstration only. These samples are
            not real customer endorsements.
          </p>
        </Panel>
        <Panel className="product-detail">
          <h2>Live layout preview</h2>
          <div
            className="widget-preview"
            data-preview-theme={widget.theme}
            style={{ '--widget-accent': widget.colour } as React.CSSProperties}
          >
            {!chosen.length ? (
              <Empty title="Select a sample review" />
            ) : widget.layout === 'Compact badge' ? (
              <div className="widget-badge">
                <strong>
                  {(
                    chosen.reduce((sum, review) => sum + review.rating, 0) /
                    chosen.length
                  ).toFixed(1)}{' '}
                  / 5
                </strong>
                <span>{chosen.length} selected fictional reviews</span>
              </div>
            ) : widget.layout === 'Carousel' ? (
              <>
                {previewCard(chosen[carousel % chosen.length])}
                <div className="product-actions">
                  <Button
                    variant="secondary"
                    size="small"
                    aria-label="Previous sample review"
                    onClick={() =>
                      setCarousel(
                        (carousel + chosen.length - 1) % chosen.length,
                      )
                    }
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span>
                    {(carousel % chosen.length) + 1} of {chosen.length}
                  </span>
                  <Button
                    variant="secondary"
                    size="small"
                    aria-label="Next sample review"
                    onClick={() => setCarousel((carousel + 1) % chosen.length)}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </>
            ) : (
              <div
                className={
                  widget.layout === 'Review wall'
                    ? 'widget-wall'
                    : 'widget-cards'
                }
              >
                {chosen.map(previewCard)}
              </div>
            )}
          </div>
          <h3>Sample embed code</h3>
          <pre className="embed-code">
            <code>{code}</code>
          </pre>
          <p className="field-help">
            This placeholder does not load a widget when installed. A real
            integration is planned.
          </p>
          <Button
            variant="secondary"
            className="w-full !whitespace-normal"
            aria-busy={copying}
            aria-disabled={copying}
            onClick={() => void copyCode()}
          >
            {copying ? <InlineSpinner /> : <Copy size={17} />}
            {copying
              ? 'Copying…'
              : copyError
                ? 'Retry copying sample code'
                : 'Copy sample embed code'}
          </Button>
          {copyError && (
            <ErrorText>
              Clipboard copying failed or timed out. Retry or select the code
              manually.
            </ErrorText>
          )}
        </Panel>
      </div>
      <Panel>
        <div className="product-panel-heading">
          <div>
            <h2>Social review-card generator</h2>
            <p>
              A genuine local SVG download, clearly marked as a fictional review
              sample.
            </p>
          </div>
          <ExportButton
            filename="revuping-fictional-social-card.svg"
            type="image/svg+xml"
            content={() =>
              socialSvg(
                product.business.name,
                active.text,
                active.rating,
                widget.colour,
                active.name,
              )
            }
          />
        </div>
        <Field as="div">
          Social card review
          <Select
            label="Social card review"
            value={String(socialId)}
            onValueChange={(id) => setSocialId(Number(id))}
            options={reviews.map((review) => ({
              value: String(review.id),
              label: `${review.name} · ${review.rating}/5`,
            }))}
          />
        </Field>
        <div className="social-card-preview">
          <strong>{product.business.name}</strong>
          <Stars rating={active.rating} />
          <blockquote>{active.text}</blockquote>
          <p>{active.name} · Fictional review sample</p>
          <small>RevuPing demo · not a real endorsement</small>
        </div>
      </Panel>
    </>
  );
}
