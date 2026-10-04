'use client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { AudioLines, CheckCircle2, MapPin } from 'lucide-react';
import {
  ApiRequestError,
  businessBrand,
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
import { HoursEditor, LogoPicker } from './business-controls';
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [logoError, setLogoError] = useState('');
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const toast = useToast();
  const action = useAuthAction();
  const heading = useRef<HTMLHeadingElement>(null);
  const focusedStep = useRef('');
  const load = useCallback(async () => {
    try {
      const result = await authRequest(
        `workspaces/${id}/onboarding`,
        'onboarding',
      );
      setState(result);
      setDraft(result.draft);
      setSaved(true);
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
  const update = (patch: Partial<OnboardingDraft>) => {
    setSaved(false);
    setDraft((current) => (current ? { ...current, ...patch } : current));
    if (!draft) return;
    const check = onboardingDraftSchema.safeParse({ ...draft, ...patch });
    setFieldErrors((errors) => {
      const result = { ...errors };
      for (const key of Object.keys(patch))
        if (
          key in result &&
          (check.success ||
            !check.error.issues.some((issue) => issue.path[0] === key))
        )
          delete result[key];
      return result;
    });
  };
  useLayoutEffect(() => {
    if (!draft || action.pending) return;
    const currentStep = `${step}-${editing}-${!!state?.completedAt}`;
    if (focusedStep.current === currentStep) return;
    focusedStep.current = currentStep;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [step, editing, !!draft, action.pending, !!state?.completedAt]);
  const go = (next: number) => {
    setEditing(true);
    setStep(next);
    window.history.pushState(null, '', `?workspace=${id}&step=${next}`);
  };

  const apply = (result: OnboardingResponse) => {
    setState(result);
    setDraft(result.draft);
    setSaved(true);
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
    const errors: Record<string, string> = {};
    if (!checked.success)
      checked.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        errors[key] ??= issue.message;
      });
    if ((step === 0 || complete) && !draft.category)
      errors.category = 'Choose a business category.';
    if ((step === 1 || complete) && !draft.locationName.trim())
      errors.locationName = 'Enter a location name.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('.setup-card [aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    if (!checked.success) return;
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
        if (complete) {
          setEditing(false);
          toast('Business setup saved.');
        } else setSaved(true);
      },
      fail,
    );
  };
  const changeLogo = async (file: File) => {
    if (!state || !draft) return;
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Choose an image smaller than 2 MB.');
      return;
    }
    setError('');
    setLogoError('');
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
          if (error instanceof ApiRequestError && error.status === 409)
            fail(error);
          else
            setLogoError(
              'Upload failed. Your previous logo is kept. Check your connection and retry.',
            );
          if (error instanceof ApiRequestError && error.status === 400)
            setLogoError(
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
  const currentValidation = onboardingDraftSchema.safeParse(draft);
  const invalidHoursDays = !currentValidation.success
    ? currentValidation.error.issues
        .filter((issue) => issue.path[0] === 'hours')
        .map((issue) => Number(issue.path[1]))
    : [];
  const brand = businessBrand(draft.brandColor);
  const brandStyle = {
    '--business-accent': brand.accent,
    '--business-foreground': brand.foreground,
    '--business-focus-light': brand.lightFocus,
    '--business-focus-dark': brand.darkFocus,
  } as CSSProperties;
  const edit = (title: string, next: number) =>
    owner && (
      <Button
        type="button"
        variant="ghost"
        size="small"
        onClick={() => go(next)}
      >
        {title}
      </Button>
    );
  const summary = (
    <div className="setup-summary">
      <section className="summary-business">
        {logo ? (
          <img
            className="setup-logo summary-logo"
            src={logo}
            alt={`${draft.name} logo`}
          />
        ) : (
          <span className="setup-logo summary-logo logo-placeholder">
            <AudioLines size={32} />
          </span>
        )}
        <div>
          <h3>{draft.name}</h3>
          <p>{draft.category || 'Category not added'}</p>
        </div>
        {edit('Edit business', 0)}
      </section>
      <section>
        <div className="section-heading">
          <h3>Location</h3>
          {edit('Edit location', 1)}
        </div>
        <strong>{draft.locationName}</strong>
        <p className="summary-address">
          {draft.address || 'Address not added'}
        </p>
        <p className="summary-timezone">
          {draft.timezone.replaceAll('_', ' ')}
        </p>
      </section>
      <section>
        <div className="section-heading">
          <h3>Branding</h3>
          {edit('Edit branding', 2)}
        </div>
        <div className="brand-swatch-row">
          <span className="brand-swatch" style={{ background: brand.accent }} />
          <div>
            <strong>Business accent</strong>
            <p>{draft.brandColor.toUpperCase()}</p>
          </div>
        </div>
      </section>
      <section>
        <div className="section-heading">
          <h3>Opening hours</h3>
          {edit('Edit hours & branding', 2)}
        </div>
        <dl className="hours-summary">
          {days.map((day, index) => (
            <div key={day}>
              <dt>{day}</dt>
              <dd>
                {draft.hours[index]
                  .map((interval) => `${interval.open}–${interval.close}`)
                  .join(', ') ||
                  (draft.closedDays[index] ? 'Closed' : 'Not provided')}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
  const fieldError = (key: string) =>
    fieldErrors[key] && (
      <span className="field-error" id={`setup-${key}-error`} role="alert">
        {fieldErrors[key]}
      </span>
    );
  const invalid = (key: string) => ({
    'aria-invalid': !!fieldErrors[key],
    'aria-describedby': fieldErrors[key] ? `setup-${key}-error` : undefined,
  });
  const ready = (state.completedAt && !editing) || !owner;
  const preview = (
    <aside
      className="setup-preview business-brand"
      aria-label="Brand preview"
      style={brandStyle}
    >
      <span className="preview-eyebrow">Business preview</span>
      <div className="preview-business-header">
        {logo ? (
          <img
            className="setup-logo"
            src={logo}
            alt="Business branding preview"
          />
        ) : (
          <span className="setup-logo logo-placeholder">
            <AudioLines size={32} />
          </span>
        )}
        <div>
          <h3>{draft.name || 'Your business'}</h3>
          <p>{draft.category || 'Your category'}</p>
        </div>
      </div>
      <div className="preview-location">
        <MapPin size={18} />
        <strong>{draft.locationName || 'Your location'}</strong>
        <p>{draft.address || 'Your location details will appear here.'}</p>
        <span className="business-accent-chip">
          {draft.name || 'Your business'}
        </span>
      </div>
      <p className="preview-caption">
        {ready
          ? 'Your saved business branding.'
          : saved
            ? 'Progress saved. Preview of your current details.'
            : 'Live preview · unsaved changes are shown.'}
      </p>
    </aside>
  );
  return (
    <AuthBlocker
      label={
        progress !== null
          ? progress < 100
            ? `Uploading your logo… ${progress}%`
            : 'Processing your image…'
          : action.label
      }
    >
      <div className="setup-grid business-brand" style={brandStyle}>
        <section className="setup-card">
          {ready ? (
            <>
              <CheckCircle2 className="text-accent mb-4" size={36} />
              <h2 ref={heading} tabIndex={-1}>
                {state.completedAt
                  ? 'Your business is ready'
                  : 'Business setup'}
              </h2>
              <p className="mb-6">
                {state.completedAt
                  ? 'Your business details are saved. You can update them whenever you need.'
                  : 'A workspace owner can finish setting up these details.'}
              </p>
              {summary}
            </>
          ) : (
            <>
              <div className="section-heading">
                <p className="setup-eyebrow">Make it yours</p>
                {saved && (
                  <span className="saved-indicator" role="status">
                    ✓ Saved
                  </span>
                )}
              </div>
              <h2 ref={heading} tabIndex={-1}>
                {steps[step]}
              </h2>
              <p>Progress saves when you continue.</p>
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
              <form
                noValidate
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
                          aria-label="Business name"
                          value={draft.name}
                          {...invalid('name')}
                          onBlur={() => {
                            if (!draft.name.trim())
                              setFieldErrors((current) => ({
                                ...current,
                                name: 'Enter a business name.',
                              }));
                          }}
                          onChange={(event) =>
                            update({ name: event.target.value })
                          }
                        />
                        {fieldError('name')}
                      </Field>
                      <Field as="div">
                        Category
                        <Select
                          label="Business category"
                          value={draft.category}
                          className={
                            fieldErrors.category ? 'border-danger' : ''
                          }
                          options={[
                            'Salon & beauty',
                            'Restaurant & café',
                            'Retail',
                            'Health & wellness',
                            'Professional services',
                            'Other',
                          ].map((value) => ({ value, label: value }))}
                          onValueChange={(category) => {
                            update({ category });
                            setFieldErrors((current) => ({
                              ...current,
                              category: '',
                            }));
                          }}
                          {...invalid('category')}
                        />
                        {fieldError('category')}
                      </Field>
                      <LogoPicker
                        logo={logo}
                        progress={progress}
                        error={logoError}
                        disabled={action.pending}
                        onUpload={(file) => void changeLogo(file)}
                        onRemove={() =>
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
                              setLogoError('');
                              toast('Logo removed.');
                            },
                            fail,
                          )
                        }
                      />
                    </>
                  )}
                  {step === 1 && (
                    <>
                      <Field>
                        Location name
                        <input
                          required
                          maxLength={100}
                          aria-label="Location name"
                          value={draft.locationName}
                          {...invalid('locationName')}
                          onChange={(event) =>
                            update({ locationName: event.target.value })
                          }
                        />
                        {fieldError('locationName')}
                      </Field>
                      <Field>
                        Address <span className="field-helper">Optional</span>
                        <textarea
                          maxLength={500}
                          aria-label="Address"
                          rows={3}
                          value={draft.address}
                          {...invalid('address')}
                          onChange={(event) =>
                            update({ address: event.target.value })
                          }
                        />
                        {fieldError('address')}
                      </Field>
                      <Field>
                        Timezone
                        <input
                          required
                          aria-label="Timezone"
                          list="timezones"
                          value={draft.timezone}
                          {...invalid('timezone')}
                          onChange={(event) =>
                            update({ timezone: event.target.value })
                          }
                        />
                        <datalist id="timezones">
                          {['UTC', ...Intl.supportedValuesOf('timeZone')].map(
                            (zone) => (
                              <option key={zone} value={zone} />
                            ),
                          )}
                        </datalist>
                        <span className="field-helper">
                          Search for your city or region.
                        </span>
                        {fieldError('timezone')}
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
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <section className="brand-editor">
                        <h3>Business branding</h3>
                        <p className="field-helper">
                          Your business accent. Appearance follows your existing
                          Light, Dark or System setting.
                        </p>
                        <Field>
                          Brand colour
                          <div className="brand-colour-control">
                            <input
                              type="color"
                              value={draft.brandColor}
                              aria-label="Brand colour"
                              onChange={(event) =>
                                update({ brandColor: event.target.value })
                              }
                            />
                            <span>{draft.brandColor.toUpperCase()}</span>
                          </div>
                          {fieldError('brandColor')}
                        </Field>
                      </section>
                      <HoursEditor
                        draft={draft}
                        update={update}
                        error={fieldErrors.hours}
                        invalidDays={invalidHoursDays}
                      />
                      {fieldErrors.hours && (
                        <p
                          className="field-error"
                          role="alert"
                          id="setup-hours-error"
                          tabIndex={-1}
                        >
                          {fieldErrors.hours}
                        </p>
                      )}
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
              </form>
            </>
          )}
        </section>
        {preview}
      </div>
    </AuthBlocker>
  );
}
