'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioLines, CheckCircle2, MapPin } from 'lucide-react';
import {
  ApiRequestError,
  onboardingDraftSchema,
  type OnboardingDraft,
  type OnboardingResponse,
} from 'api-contracts';
import { authRequest } from '@/data-access/auth-client';
import { uploadLogo } from '@/data-access/logo-client';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/shared';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toaster';
import { useAuthAction } from './use-auth-action';
import { AuthBlocker } from './auth-blocker';
const steps = ['Business', 'Location', 'Hours & branding', 'Review'];
const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
export function BusinessSetup({ id, owner }: { id: string; owner: boolean }) {
  const [state, setState] = useState<OnboardingResponse | null>(null);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const toast = useToast();
  const action = useAuthAction();
  const heading = useRef<HTMLHeadingElement>(null);
  const load = useCallback(async () => {
    try {
      const result = await authRequest(
        `workspaces/${id}/onboarding`,
        'onboarding',
      );
      setState(result);
      setDraft(result.draft);
      const query = Number(
        new URLSearchParams(window.location.search).get('step') ??
          result.draft.step,
      );
      setStep(Math.max(0, Math.min(3, Number.isInteger(query) ? query : 0)));
      setError('');
    } catch {
      setError('Unable to load business setup. Please retry.');
    }
  }, [id]);
  useEffect(() => {
    void load();
    const pop = () => {
      const next = Number(
        new URLSearchParams(window.location.search).get('step') ?? 0,
      );
      setStep(Number.isInteger(next) ? Math.max(0, Math.min(3, next)) : 0);
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [load]);
  const update = (patch: Partial<OnboardingDraft>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));
  const apply = (result: OnboardingResponse) => {
    setState(result);
    setDraft(result.draft);
  };
  const fail = (error: unknown) => {
    const stale = error instanceof ApiRequestError && error.status === 409;
    setConflict(stale);
    setError(
      stale
        ? 'This business changed in another session. Reload the latest version before saving.'
        : 'Unable to save. Check your connection and try again.',
    );
  };
  const save = async (next: number, complete = false) => {
    if (!draft || !state) return;
    setError('');
    const checked = onboardingDraftSchema.safeParse({ ...draft, step: next });
    if (!checked.success) {
      setError(checked.error.issues[0]?.message ?? 'Check your fields.');
      return;
    }
    if ((step === 0 || complete) && !draft.category) {
      setError('Choose a business category.');
      return;
    }
    if ((step === 1 || complete) && !draft.locationName.trim()) {
      setError('Enter a location name.');
      return;
    }
    await action.run(
      complete ? 'Finishing your setup…' : 'Saving your progress…',
      (signal) =>
        authRequest(
          `workspaces/${id}/onboarding`,
          'onboarding',
          { draft: checked.data, revision: state.revision, complete },
          'PUT',
          signal,
        ),
      (result) => {
        apply(result);
        setStep(next);
        window.history.pushState(null, '', `?workspace=${id}&step=${next}`);
        heading.current?.focus();
        if (complete) {
          setEditing(false);
          toast('Business setup saved.');
        } else toast('Progress saved.');
      },
      fail,
    );
  };
  const changeLogo = async (file: File) => {
    if (!state || !draft) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Choose an image smaller than 2 MB.');
      return;
    }
    setError('');
    setProgress(0);
    let savedDraft: OnboardingResponse | null = null;
    try {
      await action.run(
        'Uploading your logo…',
        async (signal) => {
          const saved = await authRequest(
            `workspaces/${id}/onboarding`,
            'onboarding',
            { draft, revision: state.revision },
            'PUT',
            signal,
          );
          savedDraft = saved;
          return uploadLogo(id, saved.revision, file, setProgress, signal);
        },
        (result) => {
          apply(result);
          toast('Logo saved.');
        },
        (error) => {
          if (savedDraft) apply(savedDraft);
          fail(error);
          if (error instanceof ApiRequestError && error.status === 400)
            setError(
              'Use a valid PNG, JPEG or WebP, at most 4096 × 4096 pixels.',
            );
        },
      );
    } finally {
      setProgress(null);
    }
  };
  if (!state || !draft)
    return (
      <div className="setup-card">
        <p role="status">{error || 'Loading business setup…'}</p>
        {error && (
          <Button type="button" onClick={() => void load()}>
            Retry
          </Button>
        )}
      </div>
    );
  const logo = state.hasLogo
    ? `/api/backend/workspaces/${id}/logo?v=${state.revision}`
    : null;
  const summary = (
    <div className="setup-summary">
      <section>
        {logo && (
          <img className="setup-logo" src={logo} alt={`${draft.name} logo`} />
        )}
        <h3 className="mt-3 font-semibold">{draft.name}</h3>
        <p>{draft.category}</p>
        {owner && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setEditing(true);
              setStep(0);
            }}
          >
            Edit business
          </Button>
        )}
      </section>
      <section>
        <h3 className="font-semibold">{draft.locationName}</h3>
        <p>
          {draft.address || 'Address not added'}
          <br />
          {draft.timezone}
        </p>
        {owner && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setEditing(true);
              setStep(1);
            }}
          >
            Edit location
          </Button>
        )}
      </section>
      <section>
        <p>Brand colour: {draft.brandColor}</p>
        {days.map((day, index) => (
          <p key={day}>
            {day}:{' '}
            {draft.hours[index]
              .map((interval) => `${interval.open}–${interval.close}`)
              .join(', ') || 'Closed / not specified'}
          </p>
        ))}
        {owner && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setEditing(true);
              setStep(2);
            }}
          >
            Edit hours & branding
          </Button>
        )}
      </section>
    </div>
  );
  return (
    <AuthBlocker label={action.label}>
      <div className="setup-grid">
        <section className="setup-card">
          {(state.completedAt && !editing) || !owner ? (
            <>
              <CheckCircle2 className="text-accent mb-4" size={36} />
              <h2>
                {state.completedAt
                  ? 'Your business is ready'
                  : 'Business setup'}
              </h2>
              <p className="mb-6">
                Your details are saved. No customer feedback has been collected
                yet. Review tools will arrive in a future phase.
              </p>
              {summary}
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest">Make it yours</p>
              <h2 ref={heading} tabIndex={-1}>
                {steps[step]}
              </h2>
              <p>
                A few details to make RevuPing feel like your business. Your
                progress is saved when you continue.
              </p>
              <ol className="setup-steps" aria-label="Setup progress">
                {steps.map((title, index) => (
                  <li
                    key={title}
                    aria-current={index === step ? 'step' : undefined}
                  >
                    {index + 1}. {title}
                  </li>
                ))}
              </ol>
              {!owner && (
                <p>
                  You have read access. A workspace owner can complete or edit
                  setup.
                </p>
              )}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void save(Math.min(3, step + 1), step === 3);
                }}
              >
                <fieldset
                  disabled={!owner || action.pending}
                  className="setup-fields"
                >
                  {step === 0 && (
                    <>
                      <Field>
                        Business name
                        <input
                          required
                          maxLength={100}
                          value={draft.name}
                          onChange={(event) =>
                            update({ name: event.target.value })
                          }
                        />
                      </Field>
                      <Field as="div">
                        Category
                        <Select
                          label="Business category"
                          value={draft.category}
                          options={[
                            'Salon & beauty',
                            'Restaurant & café',
                            'Retail',
                            'Health & wellness',
                            'Professional services',
                            'Other',
                          ].map((value) => ({ value, label: value }))}
                          onValueChange={(category) => update({ category })}
                        />
                      </Field>
                      <Field>
                        Business logo{' '}
                        <span className="text-xs text-muted">
                          Optional · PNG, JPEG or WebP · up to 2 MB
                        </span>
                        {logo && (
                          <img
                            className="setup-logo"
                            src={logo}
                            alt="Your business logo"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = '';
                            if (file) void changeLogo(file);
                          }}
                        />
                      </Field>
                      {progress !== null && (
                        <p role="status">
                          {progress < 100
                            ? `Uploading ${progress}%`
                            : 'Processing your image…'}
                        </p>
                      )}
                      {logo && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            void action.run(
                              'Removing your logo…',
                              (signal) =>
                                authRequest(
                                  `workspaces/${id}/logo`,
                                  'onboarding',
                                  { revision: state.revision },
                                  'DELETE',
                                  signal,
                                ),
                              (result) => {
                                setState(result);
                                toast('Logo removed.');
                              },
                              fail,
                            )
                          }
                        >
                          Remove logo
                        </Button>
                      )}
                    </>
                  )}
                  {step === 1 && (
                    <>
                      <Field>
                        Location name
                        <input
                          required
                          maxLength={100}
                          value={draft.locationName}
                          onChange={(event) =>
                            update({ locationName: event.target.value })
                          }
                        />
                      </Field>
                      <Field>
                        Address{' '}
                        <span className="text-xs text-muted">Optional</span>
                        <textarea
                          maxLength={500}
                          value={draft.address}
                          onChange={(event) =>
                            update({ address: event.target.value })
                          }
                        />
                      </Field>
                      <Field>
                        Timezone
                        <input
                          required
                          list="timezones"
                          value={draft.timezone}
                          onChange={(event) =>
                            update({ timezone: event.target.value })
                          }
                        />
                        <datalist id="timezones">
                          {Intl.supportedValuesOf('timeZone').map((zone) => (
                            <option key={zone} value={zone} />
                          ))}
                        </datalist>
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          update({
                            timezone:
                              Intl.DateTimeFormat().resolvedOptions().timeZone,
                          })
                        }
                      >
                        Use device timezone
                      </Button>
                      <p>
                        You can edit this suggestion. Timezone is never inferred
                        from your address.
                      </p>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <Field>
                        Brand colour
                        <input
                          type="color"
                          value={draft.brandColor}
                          onChange={(event) =>
                            update({ brandColor: event.target.value })
                          }
                        />
                      </Field>
                      <p>
                        Opening hours are optional. Leave days closed or add up
                        to four intervals. Overnight hours are not supported.
                      </p>
                      {days.map((day, index) => (
                        <div className="setup-day" key={day}>
                          <span className="font-semibold text-sm">{day}</span>
                          {draft.hours[index].length === 0 && (
                            <span className="text-sm text-muted">
                              Closed / not specified
                            </span>
                          )}
                          {draft.hours[index].map((interval, position) => (
                            <div className="setup-interval" key={position}>
                              {(['open', 'close'] as const).map((key) => (
                                <input
                                  key={key}
                                  type="time"
                                  aria-label={`${day} ${key} ${position + 1}`}
                                  value={interval[key]}
                                  onChange={(event) =>
                                    update({
                                      hours: draft.hours.map((items, i) =>
                                        i === index
                                          ? items.map((item, j) =>
                                              j === position
                                                ? {
                                                    ...item,
                                                    [key]: event.target.value,
                                                  }
                                                : item,
                                            )
                                          : items,
                                      ),
                                    })
                                  }
                                />
                              ))}
                              <Button
                                type="button"
                                variant="ghost"
                                aria-label={`Remove ${day} interval ${position + 1}`}
                                onClick={() =>
                                  update({
                                    hours: draft.hours.map((items, i) =>
                                      i === index
                                        ? items.filter((_, j) => j !== position)
                                        : items,
                                    ),
                                  })
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          {draft.hours[index].length < 4 && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                update({
                                  hours: draft.hours.map((items, i) =>
                                    i === index
                                      ? [
                                          ...items,
                                          { open: '09:00', close: '17:00' },
                                        ]
                                      : items,
                                  ),
                                })
                              }
                            >
                              Add {day} interval
                            </Button>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  {step === 3 && summary}
                </fieldset>
                {error && (
                  <p className="error-note mt-4" role="alert">
                    {error}{' '}
                    {conflict && (
                      <button
                        type="button"
                        className="underline"
                        onClick={() => void load()}
                      >
                        Reload latest
                      </button>
                    )}
                  </p>
                )}
                {owner && (
                  <div className="setup-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={action.pending || step === 0}
                      onClick={() => void save(step - 1)}
                    >
                      Back
                    </Button>
                    <Button type="submit" disabled={action.pending}>
                      {step === 3 ? 'Finish setup' : 'Continue'}
                    </Button>
                  </div>
                )}
              </form>
            </>
          )}
        </section>
        <aside className="setup-preview" aria-label="Brand preview">
          <span className="text-xs uppercase tracking-widest text-muted">
            Your business, your brand
          </span>
          <div className="mt-6 flex items-center gap-3">
            {logo ? (
              <img
                className="setup-logo"
                src={logo}
                alt="Business branding preview"
              />
            ) : (
              <span
                className="setup-logo grid place-items-center"
                style={{ color: draft.brandColor }}
              >
                <AudioLines size={32} />
              </span>
            )}
            <div>
              <h3>{draft.name}</h3>
              <p className="text-sm text-muted">
                {draft.category || 'A little more you'}
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-line bg-surface p-4">
            <MapPin size={18} className="text-accent" />
            <p className="mt-2 font-medium">{draft.locationName}</p>
            <p className="mt-1 text-sm text-muted">
              {draft.address ||
                'Welcome your customers with a consistent brand.'}
            </p>
            <div
              className="mt-4 h-1 rounded"
              style={{ background: draft.brandColor }}
            />
          </div>
          <p className="mt-5 text-sm text-muted">
            A preview of your saved business details. No sample reviews or
            metrics.
          </p>
        </aside>
      </div>
    </AuthBlocker>
  );
}
