'use client';
import { useRef, useState } from 'react';
import { AudioLines, Upload, X } from 'lucide-react';
import type { OnboardingDraft } from 'api-contracts';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
export const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
export function LogoPicker({
  logo,
  progress,
  error,
  disabled,
  onUpload,
  onRemove,
}: {
  logo: string | null;
  progress: number | null;
  error: string;
  disabled: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [retry, setRetry] = useState<File | null>(null);
  const choose = (file: File) => {
    setRetry(file);
    onUpload(file);
  };
  return (
    <div className="logo-upload-group">
      <h3>
        Business logo <span className="field-helper">Optional</span>
      </h3>
      <div
        className={`logo-drop ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file && !disabled) choose(file);
        }}
      >
        <div className="logo-upload-preview">
          {logo ? (
            <img src={logo} alt="Your business logo" />
          ) : (
            <>
              <AudioLines size={34} />
              <span>No logo yet</span>
            </>
          )}
        </div>
        <div className="logo-upload-controls">
          <p>Give your business a familiar face.</p>
          <span className="field-helper" id="logo-help">
            PNG, JPEG or WebP · up to 2 MB
            <br />
            Drop an image here or choose a file.
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={disabled}
              onClick={() => input.current?.click()}
            >
              <Upload size={16} />
              {logo ? 'Replace logo' : 'Upload logo'}
            </Button>
            {logo && (
              <Button
                type="button"
                variant="danger"
                disabled={disabled}
                onClick={onRemove}
              >
                Remove logo
              </Button>
            )}
          </div>
          <input
            ref={input}
            className="sr-only"
            type="file"
            tabIndex={-1}
            aria-label="Business logo file"
            aria-describedby="logo-help"
            accept="image/png,image/jpeg,image/webp"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) choose(file);
            }}
          />
        </div>
      </div>
      {progress !== null && (
        <div className="logo-progress" role="status">
          <progress
            max={100}
            value={progress}
            aria-label="Logo upload progress"
          />
          <span>
            {progress < 100
              ? `Uploading ${progress}%`
              : 'Processing your image…'}
          </span>
        </div>
      )}
      {error && (
        <div className="logo-upload-error">
          <p className="field-error" role="alert">
            {error}
          </p>
          {retry && (
            <Button
              type="button"
              variant="ghost"
              size="small"
              disabled={disabled}
              onClick={() => onUpload(retry)}
            >
              Retry upload
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
export function HoursEditor({
  draft,
  update,
  error,
  invalidDays,
}: {
  invalidDays: number[];
  error?: string;
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  const [copyFrom, setCopyFrom] = useState<number | null>(null);
  const [destinations, setDestinations] = useState<number[]>([]);
  const setDay = (
    i: number,
    intervals: OnboardingDraft['hours'][number],
    closed = false,
  ) =>
    update({
      hours: draft.hours.map((value, n) => (n === i ? intervals : value)),
      closedDays: draft.closedDays.map((value, n) =>
        n === i ? closed : value,
      ),
    });
  return (
    <section className="hours-editor">
      <div className="section-heading">
        <h3>Opening hours</h3>
        <span className="field-helper">Optional</span>
      </div>
      <p className="field-helper">
        Add times within the same day. For overnight opening, leave hours not
        provided for now.
      </p>
      <div className="hours-grid-head" aria-hidden="true">
        <span>Day</span>
        <span>Status</span>
        <span>Opening</span>
        <span>Closing</span>
        <span />
      </div>
      <div className="hours-days">
        {days.map((day, i) => (
          <div className="setup-day" key={day}>
            <strong className="hours-day-label">{day}</strong>
            <div className="hours-day-heading">
              <Select
                label={`${day} status`}
                value={
                  draft.hours[i].length
                    ? 'open'
                    : draft.closedDays[i]
                      ? 'closed'
                      : 'unknown'
                }
                options={[
                  { value: 'unknown', label: 'Not provided' },
                  { value: 'open', label: 'Open' },
                  { value: 'closed', label: 'Closed' },
                ]}
                onValueChange={(value) =>
                  setDay(
                    i,
                    value === 'open' ? [{ open: '09:00', close: '17:00' }] : [],
                    value === 'closed',
                  )
                }
              />
            </div>
            <div className="hours-day-times">
              {!draft.hours[i].length && (
                <p className="hours-empty">
                  {draft.closedDays[i]
                    ? 'Closed all day'
                    : 'Hours not provided'}
                </p>
              )}
              {draft.hours[i].map((interval, position) => (
                <div className="setup-interval" key={position}>
                  {(['open', 'close'] as const).map((key) => (
                    <label key={key}>
                      <span className="hours-mobile-label">
                        {key === 'open' ? 'Opening' : 'Closing'}
                      </span>
                      <input
                        key={key}
                        type="time"
                        aria-invalid={!!error && invalidDays.includes(i)}
                        aria-describedby={
                          error && invalidDays.includes(i)
                            ? 'setup-hours-error'
                            : undefined
                        }
                        aria-label={`${day} ${key} ${position + 1}`}
                        value={interval[key]}
                        onChange={(event) =>
                          setDay(
                            i,
                            draft.hours[i].map((item, j) =>
                              j === position
                                ? { ...item, [key]: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    aria-label={`Remove ${day} interval ${position + 1}`}
                    onClick={() =>
                      setDay(
                        i,
                        draft.hours[i].filter((_, j) => j !== position),
                      )
                    }
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
              <div className="hours-row-actions">
                {draft.hours[i].length < 4 && !draft.closedDays[i] && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    aria-label={`Add ${day} interval`}
                    onClick={() =>
                      setDay(i, [
                        ...draft.hours[i],
                        { open: '09:00', close: '17:00' },
                      ])
                    }
                  >
                    {draft.hours[i].length ? '+ Interval' : '+ Add hours'}
                  </Button>
                )}
                {(draft.hours[i].length > 0 || draft.closedDays[i]) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    aria-label={`Copy ${day} hours to other days`}
                    onClick={() => {
                      setCopyFrom(i);
                      setDestinations([]);
                    }}
                  >
                    Copy hours
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Dialog
        open={copyFrom !== null}
        onOpenChange={(open) => {
          if (!open) setCopyFrom(null);
        }}
        title="Copy hours to other days"
        description={`Choose which days should use ${copyFrom === null ? '' : days[copyFrom]}'s hours. Existing hours on those days will be replaced.`}
        compact
        footer={
          <Button
            type="button"
            disabled={!destinations.length}
            onClick={() => {
              if (copyFrom === null) return;
              update({
                hours: draft.hours.map((value, i) =>
                  destinations.includes(i)
                    ? draft.hours[copyFrom].map((item) => ({ ...item }))
                    : value,
                ),
                closedDays: draft.closedDays.map((value, i) =>
                  destinations.includes(i) ? draft.closedDays[copyFrom] : value,
                ),
              });
              setCopyFrom(null);
            }}
          >
            Copy to selected days
          </Button>
        }
      >
        <div className="copy-day-options">
          {days.map(
            (day, i) =>
              i !== copyFrom && (
                <label key={day}>
                  <input
                    type="checkbox"
                    checked={destinations.includes(i)}
                    onChange={(event) =>
                      setDestinations((current) =>
                        event.target.checked
                          ? [...current, i]
                          : current.filter((n) => n !== i),
                      )
                    }
                  />
                  {day}
                </label>
              ),
          )}
        </div>
      </Dialog>
    </section>
  );
}
