'use client';
import { focusWorkspacePanel } from '@/lib/workspace-focus';
import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { Plus, Trash2, ArrowUp, CheckCircle2 } from 'lucide-react';
import { useDemoWorkspace } from '@/data-access/demo-workspace';
import { useToast } from '@/components/ui/toaster';
import { Dialog } from '@/components/ui/dialog';
import { ThemeControl } from '@/components/theme';
import {
  demoDate,
  type Question,
  type Survey,
} from '@/data-access/product-data';
import { Logo } from '@/components/shared';
import {
  Panel,
  Badge,
  Field,
  Button,
  PageHeading,
  Picker,
  SampleTable,
  SampleChart,
  DemoBanner,
  ErrorText,
  MetricCards,
  Link,
  Empty,
} from '@/features/product/common';
function npsSummary(values: number[]) {
  if (!values.length) return 'No responses';
  return `${Math.round(((values.filter((value) => value >= 9).length - values.filter((value) => value <= 6).length) / values.length) * 100)}`;
}
export function Surveys({ selectedId }: { selectedId?: number }) {
  const { product, updateProduct } = useDemoWorkspace();
  const toast = useToast();
  const [selected, setSelected] = useState(
    selectedId || product.surveys[0]?.id,
  );
  const [open, setOpen] = useState(false);
  const saveLock = useRef(false);
  const addedQuestion = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const [draft, setDraft] = useState<Survey>({
    id: 0,
    name: '',
    status: 'Draft',
    questions: [],
  });
  const [error, setError] = useState('');
  const [optionsText, setOptionsText] = useState<Record<number, string>>({});
  useEffect(() => {
    if (addedQuestion.current === null) return;
    const question = document.getElementById(
      `builder-question-${addedQuestion.current}`,
    );
    addedQuestion.current = null;
    question?.scrollIntoView({
      block: 'nearest',
      behavior: reduced ? 'instant' : 'smooth',
    });
    question
      ?.querySelector<HTMLInputElement>('input[type="text"], input:not([type])')
      ?.focus({ preventScroll: true });
  }, [draft.questions, reduced]);
  useEffect(() => {
    if (error) document.getElementById('survey-builder-error')?.focus();
  }, [error]);
  function addQuestion() {
    const id = Date.now();
    addedQuestion.current = id;
    setDraft({
      ...draft,
      questions: [
        ...draft.questions,
        {
          id,
          type: 'Optional text',
          title: 'Anything else to share?',
          options: [],
          required: false,
        },
      ],
    });
  }
  const active = product.surveys.find((survey) => survey.id === selected);
  const responses = product.responses.filter(
    (response) => response.surveyId === active?.id,
  );
  const npsQuestion = active?.questions.find(
    (question) => question.type === 'NPS',
  );
  const nps = npsQuestion
    ? responses
        .map((response) => response.answers[npsQuestion.id])
        .filter((value) => value !== undefined && value !== '')
        .map(Number)
    : [];
  function edit(survey?: Survey) {
    saveLock.current = false;
    const next = survey
      ? {
          ...survey,
          questions: survey.questions.map((question) => ({
            ...question,
            options: [...question.options],
          })),
        }
      : {
          id: 0,
          name: 'New visit survey',
          status: 'Draft' as const,
          questions: [
            {
              id: Date.now(),
              type: 'Satisfaction' as const,
              title: 'How was your visit?',
              options: [],
              required: true,
            },
          ],
        };
    setDraft(next);
    setOptionsText(
      Object.fromEntries(
        next.questions.map((question) => [
          question.id,
          question.options.join(', '),
        ]),
      ),
    );
    setError('');
    setOpen(true);
  }
  function changeQuestion(id: number, changes: Partial<Question>) {
    setDraft({
      ...draft,
      questions: draft.questions.map((question) =>
        question.id === id ? { ...question, ...changes } : question,
      ),
    });
  }
  function saveSurvey() {
    if (saveLock.current) return;
    if (
      !draft.name.trim() ||
      !draft.questions.length ||
      draft.questions.some(
        (question) =>
          !question.title.trim() ||
          (question.type === 'Multiple choice' &&
            (question.options.length < 2 ||
              new Set(question.options).size !== question.options.length)),
      )
    ) {
      setError(
        'Add a survey name and at least one named question. Multiple-choice questions need two distinct options.',
      );
      return;
    }
    saveLock.current = true;
    const id = draft.id || Date.now();
    updateProduct((product) => ({
      ...product,
      surveys: draft.id
        ? product.surveys.map((survey) => (survey.id === id ? draft : survey))
        : [...product.surveys, { ...draft, id }],
    }));
    setSelected(id);
    setOpen(false);
    toast('Demo survey saved');
  }
  return (
    <>
      <PageHeading
        eyebrow="Listen beyond the review"
        title="Customer surveys"
        text="Build a short optional survey. Participation is separate from Google review eligibility."
      >
        <Button onClick={() => edit()}>
          <Plus size={17} />
          Create survey
        </Button>
      </PageHeading>
      <DemoBanner>
        Public survey previews record fictional answers in this session only. No
        invitations or responses are transmitted.
      </DemoBanner>
      <div className="product-split">
        <Panel>
          <h2>Your surveys</h2>
          <SampleTable
            caption="Local demo surveys"
            headers={['Survey', 'Status', 'Questions', 'Open']}
            rows={product.surveys.map((survey) => [
              survey.name,
              <Badge key="status" mint={survey.status === 'Active'}>
                {survey.status}
              </Badge>,
              survey.questions.length,
              <Button
                key="open"
                variant="secondary"
                size="small"
                onClick={() => {
                  setSelected(survey.id);
                  focusWorkspacePanel('surveys-detail');
                }}
              >
                View survey
              </Button>,
            ])}
          />
        </Panel>
        <Panel
          className="product-detail"
          id="surveys-detail"
          tabIndex={-1}
          aria-label="Survey details"
        >
          {active ? (
            <>
              <h2>{active.name}</h2>
              <div className="product-actions">
                <Button variant="secondary" onClick={() => edit(active)}>
                  Edit survey
                </Button>
                <Button asChild>
                  <Link href={`/survey/demo-salon?id=${active.id}`}>
                    Open mobile survey preview
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const status =
                      active.status === 'Active' ? 'Paused' : 'Active';
                    updateProduct((product) => ({
                      ...product,
                      surveys: product.surveys.map((survey) =>
                        survey.id === active.id
                          ? { ...survey, status }
                          : survey,
                      ),
                    }));
                    toast(`Survey ${status.toLowerCase()} in this demo`);
                  }}
                >
                  {active.status === 'Active'
                    ? 'Pause survey'
                    : 'Activate demo survey'}
                </Button>
              </div>
              <MetricCards
                items={[
                  {
                    label: 'Responses',
                    value: responses.length,
                    detail: 'Fictional fixtures + local submissions',
                  },
                  {
                    label: 'NPS',
                    value: npsQuestion ? npsSummary(nps) : 'Not included',
                    detail: `${nps.length} recommendation answers`,
                  },
                ]}
              />
              <h3>What NPS means</h3>
              <p>
                On a 0–10 recommendation scale, 9–10 are promoters, 7–8 are
                passives, and 0–6 are detractors. NPS is the percentage of
                promoters minus the percentage of detractors, from −100 to +100.
                Small samples need context.
              </p>
              <SampleChart
                title="Recommendation distribution"
                unit="answers"
                rows={[
                  {
                    label: 'Promoters · 9–10',
                    value: nps.filter((value) => value >= 9).length,
                  },
                  {
                    label: 'Passives · 7–8',
                    value: nps.filter((value) => value >= 7 && value <= 8)
                      .length,
                  },
                  {
                    label: 'Detractors · 0–6',
                    value: nps.filter((value) => value <= 6).length,
                  },
                ]}
              />
              <SampleTable
                caption="Sample survey responses"
                headers={['Date', 'Answers', 'Source']}
                rows={responses.map((response) => [
                  response.date,
                  active.questions
                    .map(
                      (question) =>
                        `${question.title}: ${response.answers[question.id] || 'Skipped'}`,
                    )
                    .join(' · '),
                  'Fictional / local demo',
                ])}
              />
            </>
          ) : (
            <Empty title="No survey selected" />
          )}
        </Panel>
      </div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Survey builder"
        wide
        footer={
          <div className="flex flex-wrap items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                disabled={draft.questions.length >= 8}
                onClick={addQuestion}
              >
                <Plus size={17} />
                Add question
              </Button>
              <span className="text-xs text-muted" role="status">
                {draft.questions.length} of 8 questions
              </span>
            </div>
            <Button onClick={saveSurvey}>Save demo survey</Button>
          </div>
        }
        description="Keep the questions short, clear and independent of public review participation."
      >
        <div className="grid gap-x-5 sm:grid-cols-[2fr_1fr] [&>.field]:!mt-0">
          <Field>
            Survey name
            <input
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
              maxLength={80}
            />
          </Field>
          <Picker
            label="Survey status"
            value={draft.status}
            onChange={(status) => setDraft({ ...draft, status: status })}
            options={['Draft', 'Active', 'Paused']}
          />
        </div>
        {error && (
          <div id="survey-builder-error" tabIndex={-1}>
            <ErrorText>{error}</ErrorText>
          </div>
        )}
        {draft.questions.map((question, index) => (
          <section
            className="survey-question"
            id={`builder-question-${question.id}`}
            key={question.id}
          >
            <div className="product-panel-heading">
              <h3>Question {index + 1}</h3>
              <div className="product-actions !m-0 !gap-2">
                <Button
                  size="small"
                  className="!size-10 !min-h-10 !p-2"
                  variant="ghost"
                  disabled={index === 0}
                  aria-label={`Move question ${index + 1} up`}
                  onClick={() => {
                    const questions = [...draft.questions];
                    [questions[index - 1], questions[index]] = [
                      questions[index],
                      questions[index - 1],
                    ];
                    setDraft({ ...draft, questions });
                  }}
                >
                  <ArrowUp size={16} />
                </Button>
                <Button
                  size="small"
                  className="!size-10 !min-h-10 !p-2"
                  variant="ghost"
                  aria-label={`Remove question ${index + 1}`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      questions: draft.questions.filter(
                        (item) => item.id !== question.id,
                      ),
                    })
                  }
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            <div className="grid gap-x-4 sm:grid-cols-[1fr_2fr] [&>.field]:!m-0">
              <Picker
                label={`Question ${index + 1} type`}
                value={question.type}
                onChange={(type) => {
                  setOptionsText((previous) => ({
                    ...previous,
                    [question.id]:
                      type === 'Multiple choice'
                        ? 'Listening, Comfort, Results'
                        : '',
                  }));
                  changeQuestion(question.id, {
                    type: type,
                    required:
                      type === 'Optional text' ? false : question.required,
                    options:
                      type === 'Multiple choice'
                        ? ['Listening', 'Comfort', 'Results']
                        : [],
                  });
                }}
                options={[
                  'Satisfaction',
                  'NPS',
                  'Multiple choice',
                  'Optional text',
                ]}
              />
              <Field>
                Question text
                <input
                  value={question.title}
                  onChange={(event) =>
                    changeQuestion(question.id, { title: event.target.value })
                  }
                  maxLength={180}
                />
              </Field>
            </div>
            {question.type === 'Multiple choice' && (
              <Field>
                Options, separated by commas
                <input
                  value={
                    optionsText[question.id] ?? question.options.join(', ')
                  }
                  onChange={(event) => {
                    setOptionsText({
                      ...optionsText,
                      [question.id]: event.target.value,
                    });
                    changeQuestion(question.id, {
                      options: event.target.value
                        .split(',')
                        .map((option) => option.trim())
                        .filter(Boolean),
                    });
                  }}
                />
              </Field>
            )}
            {question.type !== 'Optional text' && (
              <label className="consent-checkbox">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(event) =>
                    changeQuestion(question.id, {
                      required: event.target.checked,
                    })
                  }
                />
                <span>Required question</span>
              </label>
            )}
          </section>
        ))}
      </Dialog>
    </>
  );
}
export function PublicSurvey({ surveyId = 1 }: { surveyId?: number }) {
  const { product, updateProduct } = useDemoWorkspace();
  const survey = product.surveys.find((survey) => survey.id === surveyId);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);
  const success = useRef<HTMLDivElement>(null);
  const submitted = useRef(false);
  useEffect(() => {
    if (done) success.current?.focus();
  }, [done]);
  return (
    <main className="public-product">
      <header>
        <Logo />
        <ThemeControl />
      </header>
      <Panel className="public-product-card">
        {!survey ? (
          <>
            <h1>Survey not found</h1>
            <p>
              New surveys exist only in the browser session where they were
              created.
            </p>
            <Button asChild>
              <Link href="/dashboard/surveys">Back to survey builder</Link>
            </Button>
          </>
        ) : done ? (
          <div tabIndex={-1} ref={success} role="status">
            <CheckCircle2 size={38} />
            <h1>Thank you for sharing</h1>
            <p>
              Your fictional survey answers were added to this demo session.
              Nothing was sent to a business.
            </p>
            <div className="product-actions">
              <Button asChild>
                <Link href="/r/demo-salon">
                  Choose Google review or private feedback
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/dashboard/surveys?item=${survey.id}`}>
                  View demo response summary
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <span className="eyebrow">BLOOM & CO. · SURVEY PREVIEW</span>
            <h1>{survey.name}</h1>
            <p>
              Optional participation, honest answers. You can always choose a
              public review or private feedback regardless of your answers.
            </p>
            <Badge mint={survey.status === 'Active'}>
              {survey.status} · local preview
            </Badge>
            {survey.status !== 'Active' ? (
              <>
                <p>
                  This survey is not accepting answers in the demo. Activate it
                  in the survey builder.
                </p>
                <Button asChild variant="secondary">
                  <Link href="/r/demo-salon">
                    Open the customer feedback page
                  </Link>
                </Button>
              </>
            ) : (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  if (submitted.current) return;
                  const next = Object.fromEntries(
                    survey.questions
                      .filter(
                        (question) =>
                          question.required && !answers[question.id],
                      )
                      .map((question) => [
                        question.id,
                        'Please answer this question.',
                      ]),
                  );
                  setErrors(next);
                  if (Object.keys(next).length) {
                    document
                      .getElementById(`survey-question-${Object.keys(next)[0]}`)
                      ?.focus();
                    return;
                  }
                  submitted.current = true;
                  updateProduct((state) => ({
                    ...state,
                    responses: [
                      ...state.responses,
                      {
                        id: Date.now(),
                        surveyId: survey.id,
                        answers,
                        date: demoDate,
                      },
                    ],
                  }));
                  setDone(true);
                }}
              >
                {survey.questions.map((question, index) => (
                  <fieldset
                    key={question.id}
                    className="public-survey-question"
                  >
                    <legend>
                      {index + 1}. {question.title}{' '}
                      <small>
                        {question.required ? 'Required' : 'Optional'}
                      </small>
                    </legend>
                    {question.type === 'Optional text' ? (
                      <textarea
                        id={`survey-question-${question.id}`}
                        rows={3}
                        maxLength={1000}
                        aria-label={question.title}
                        value={answers[question.id] || ''}
                        onChange={(event) =>
                          setAnswers({
                            ...answers,
                            [question.id]: event.target.value,
                          })
                        }
                      />
                    ) : (
                      <div
                        className={
                          question.type === 'Multiple choice'
                            ? 'survey-choice-list'
                            : 'survey-rating-options'
                        }
                      >
                        {(question.type === 'Multiple choice'
                          ? question.options
                          : Array.from(
                              { length: question.type === 'NPS' ? 11 : 5 },
                              (_, index) =>
                                `${question.type === 'NPS' ? index : index + 1}`,
                            )
                        ).map((option, optionIndex) => (
                          <label key={option}>
                            <input
                              id={
                                optionIndex === 0
                                  ? `survey-question-${question.id}`
                                  : undefined
                              }
                              type="radio"
                              name={`question-${question.id}`}
                              value={option}
                              checked={answers[question.id] === option}
                              aria-describedby={
                                errors[question.id]
                                  ? `survey-error-${question.id}`
                                  : undefined
                              }
                              onChange={() => {
                                setAnswers({
                                  ...answers,
                                  [question.id]: option,
                                });
                                setErrors({ ...errors, [question.id]: '' });
                              }}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {question.type === 'NPS' && (
                      <p className="field-help">
                        0 = not at all likely · 10 = extremely likely. This
                        answer never changes review access.
                      </p>
                    )}
                    {question.type === 'Satisfaction' && (
                      <p className="field-help">
                        1 = very dissatisfied · 5 = very satisfied
                      </p>
                    )}
                    {errors[question.id] && (
                      <ErrorText id={`survey-error-${question.id}`}>
                        {errors[question.id]}
                      </ErrorText>
                    )}
                  </fieldset>
                ))}
                <Button type="submit">Submit demo survey</Button>
                <p className="field-help">
                  Demo answers remain in memory and reset when the page is
                  reloaded. Please use fictional comments.
                </p>
              </form>
            )}
            <Link className="text-link" href="/r/demo-salon">
              Google review and private feedback are always available →
            </Link>
          </>
        )}
      </Panel>
    </main>
  );
}
export function PublicReferral() {
  const { product, updateProduct } = useDemoWorkspace();
  const [done, setDone] = useState(false);
  const submitted = useRef(false);
  return (
    <main className="public-product">
      <header>
        <Logo />
        <ThemeControl />
      </header>
      <Panel className="public-product-card">
        <span className="eyebrow">FICTIONAL REFERRAL PREVIEW</span>
        <h1>{product.referral.name}</h1>
        <p>
          {product.referral.message.replaceAll('{link}', 'this local preview')}
        </p>
        <h2>Who can participate?</h2>
        <p>{product.referral.eligibility}</p>
        <h2>Programme terms</h2>
        <p>{product.referral.terms}</p>
        <p>
          No rewards are linked to Google reviews or positive ratings. This
          programme is a design preview.
        </p>
        {product.referral.paused ? (
          <Badge>Programme paused in demo</Badge>
        ) : done ? (
          <div role="status" className="product-message">
            <CheckCircle2 size={22} />
            <p>
              Sample referral interest recorded. No booking, reward or message
              was created.
            </p>
          </div>
        ) : (
          <Button
            onClick={() => {
              if (submitted.current) return;
              submitted.current = true;
              updateProduct((state) => ({
                ...state,
                referralActivity: [
                  {
                    id: Date.now(),
                    name: 'Demo visitor',
                    status: 'Sample interest recorded',
                    date: demoDate,
                  },
                  ...state.referralActivity,
                ],
              }));
              setDone(true);
            }}
          >
            Record sample referral interest
          </Button>
        )}
        <div className="product-actions">
          <Button asChild variant="secondary">
            <Link href="/r/demo-salon">Explore the customer page</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard/referrals">Back to referral demo</Link>
          </Button>
        </div>
      </Panel>
    </main>
  );
}
