import { BusinessHours } from './business-hours';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  findNodeHandle,
  Image,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Field, Select, AuthBlocker, useToast } from 'mobile-ui';
import { useTheme, useReducedMotion } from 'mobile-tokens';
import {
  ApiRequestError,
  businessBrand,
  deviceTimezone,
  supportedTimezones,
  timezoneLabel,
  onboardingDraftSchema,
  type OnboardingDraft,
  type OnboardingResponse,
} from 'api-contracts';
import { useAuth } from '../data-access/auth-context';
import { useAuthAction } from './use-auth-action';
const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
export function BusinessSetup({
  id,
  owner,
  edit = false,
  onStepChange,
}: {
  id: string;
  owner: boolean;
  edit?: boolean;
  onStepChange?: () => void;
}) {
  const router = useRouter();
  const { client } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const action = useAuthAction();
  const [state, setState] = useState<OnboardingResponse | null>(null);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const heading = useRef<Text>(null);
  useEffect(() => {
    opacity.stopAnimation();
    opacity.setValue(reduced ? 1 : 0.88);
    if (!reduced)
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    onStepChange?.();
    let alive = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      const handle = findNodeHandle(heading.current);
      if (alive && enabled && handle)
        AccessibilityInfo.setAccessibilityFocus(handle);
    });
    return () => {
      alive = false;
      opacity.stopAnimation();
    };
  }, [step, reduced, opacity, onStepChange]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [logo, setLogo] = useState<Awaited<
    ReturnType<typeof client.logoSource>
  > | null>(null);
  useEffect(() => {
    let alive = true;
    client
      .onboarding(id)
      .then((result) => {
        if (alive) {
          if (result.completedAt && !(edit && owner)) {
            router.replace({
              pathname: '/account-dashboard',
              params: { workspace: id },
            });
            return;
          }
          setEditing(edit && owner);
          setState(result);
          setDraft(
            result.revision === 0
              ? { ...result.draft, timezone: deviceTimezone() }
              : result.draft,
          );
          setStep(edit ? 0 : result.draft.step);
        }
      })
      .catch(() => {
        if (alive)
          setError('Unable to load setup. Return to this screen to retry.');
      });
    return () => {
      alive = false;
    };
  }, [client, id, edit, owner, router]);
  useEffect(() => {
    let alive = true;
    const refreshLogo = () => {
      if (state?.hasLogo)
        client
          .logoSource(id, state.revision)
          .then((value) => {
            if (alive) setLogo(value);
          })
          .catch(() => {
            if (alive) setLogo(null);
          });
      else setLogo(null);
    };
    refreshLogo();
    const listener = AppState.addEventListener('change', (status) => {
      if (status === 'active') refreshLogo();
    });
    return () => {
      alive = false;
      listener.remove();
    };
  }, [client, id, state]);
  const apply = (result: OnboardingResponse) => {
    setState(result);
    setDraft(result.draft);
    setSaved(true);
  };
  const update = (patch: Partial<OnboardingDraft>) => {
    setSaved(false);
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };
  const fail = (error: unknown) =>
    setError(
      error instanceof ApiRequestError && error.status === 409
        ? 'Another session changed this business. Reopen this screen to load the latest details.'
        : 'Unable to save. Use a valid image or check your connection and retry.',
    );
  const save = async (next: number, complete = false) => {
    if (!draft || !state) return;
    const checked = onboardingDraftSchema.safeParse({ ...draft, step: next });
    if (!checked.success) {
      setError(checked.error.issues[0]?.message ?? 'Check your details.');
      return;
    }
    if ((step === 0 || complete) && !draft.category) {
      setError('Choose a category.');
      return;
    }
    if ((step === 1 || complete) && !draft.locationName.trim()) {
      setError('Enter a location name.');
      return;
    }
    setError('');
    await action.run(
      complete ? 'Finishing setup…' : 'Saving progress…',
      (signal) =>
        client.saveOnboarding(
          id,
          { draft: checked.data, revision: state.revision, complete },
          signal,
        ),
      (result) => {
        apply(result);
        setStep(next);
        if (complete) {
          if (!result.completedAt) {
            setError('Completion was not confirmed. Please retry.');
            return;
          }
          router.replace({
            pathname: '/account-dashboard',
            params: { workspace: id },
          });
        }
        setSaved(true);
        if (complete) showToast('Business details saved.');
      },
      fail,
    );
  };
  const pick = async () => {
    if (!state || !draft) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      if ((file.fileSize ?? 0) > 2 * 1024 * 1024) {
        setError('Choose a logo under 2 MB.');
        return;
      }
      setError('');
      let savedDraft: OnboardingResponse | null = null;
      await action.run(
        'Uploading logo…',
        async (signal) => {
          const saved = await client.saveOnboarding(
            id,
            { draft, revision: state.revision, complete: false },
            signal,
          );
          savedDraft = saved;
          return client.uploadLogo(
            id,
            saved.revision,
            {
              uri: file.uri,
              name: file.fileName ?? 'logo',
              type: file.mimeType ?? 'application/octet-stream',
            },
            signal,
          );
        },
        (value) => {
          apply(value);
          showToast('Logo saved.');
        },
        (error) => {
          if (savedDraft) apply(savedDraft);
          fail(error);
        },
      );
    } catch {
      setError('Unable to open your image library. Check app permissions.');
    }
  };
  if (!state || !draft)
    return (
      <Text style={{ color: colors.muted }}>{error || 'Loading setup…'}</Text>
    );
  const brand = businessBrand(draft.brandColor);
  const summary = (
    <View style={{ gap: 16 }}>
      <Text style={{ color: colors.ink, fontSize: 20 }}>{draft.name}</Text>
      <Text style={{ color: colors.muted }}>{draft.category}</Text>
      <Text style={{ color: colors.ink }}>{draft.locationName}</Text>
      <Text style={{ color: colors.muted }}>
        {draft.address || 'Address not added'} · {draft.timezone}
      </Text>
      <Text style={{ color: colors.ink }}>
        Brand colour: {draft.brandColor}
      </Text>
      {days.map((day, i) => (
        <Text key={day} style={{ color: colors.muted }}>
          {day}:{' '}
          {draft.hours[i]
            .map((item) => `${item.open}–${item.close}`)
            .join(', ') || (draft.closedDays[i] ? 'Closed' : 'Not provided')}
        </Text>
      ))}
    </View>
  );
  return (
    <AuthBlocker label={action.label} onCancel={action.cancel}>
      <Card>
        <View style={{ gap: 16 }}>
          {logo && (
            <Image
              source={logo}
              accessibilityLabel="Business logo"
              resizeMode="contain"
              style={{ width: 112, height: 112, borderRadius: 16 }}
            />
          )}
          <Text
            ref={heading}
            accessibilityRole="header"
            style={{ color: colors.ink, fontSize: 24, fontWeight: '600' }}
          >
            {(state.completedAt && !editing) || !owner
              ? state.completedAt
                ? 'Your business is ready'
                : 'Business setup'
              : ['Business', 'Primary location', 'Hours & branding', 'Review'][
                  step
                ]}
          </Text>
          {!owner && (
            <Text style={{ color: colors.muted }}>
              Read access. A workspace owner can edit these details.
            </Text>
          )}
          {(state.completedAt && !editing) || !owner ? (
            <>
              <Text style={{ color: colors.muted }}>
                Your business details are saved. You can update them whenever
                you need.
              </Text>
              {summary}
              {owner && (
                <Button
                  title="Edit business details"
                  onPress={() => {
                    setEditing(true);
                    setStep(0);
                  }}
                />
              )}
            </>
          ) : (
            <>
              <Text style={{ color: colors.muted }}>
                Step {step + 1} of 4 ·{' '}
                {saved ? 'Saved' : 'Progress saves when you continue.'}
              </Text>
              <Animated.View style={{ gap: 16, opacity }}>
                {step === 0 && (
                  <>
                    <Field
                      label="Business name"
                      value={draft.name}
                      onChangeText={(name) => update({ name })}
                      maxLength={100}
                      editable={owner}
                    />
                    <Select
                      label="Category"
                      value={draft.category || 'Choose a category'}
                      options={[
                        'Salon & beauty',
                        'Restaurant & café',
                        'Retail',
                        'Health & wellness',
                        'Professional services',
                        'Other',
                      ]}
                      onChange={(category) => {
                        if (owner) update({ category });
                      }}
                    />
                    {owner && (
                      <>
                        <Text style={{ color: colors.muted }}>
                          Optional logo: PNG, JPEG or WebP, up to 2 MB and 4096
                          × 4096 pixels.
                        </Text>
                        <Button
                          title={logo ? 'Replace logo' : 'Choose logo'}
                          variant="secondary"
                          onPress={() => void pick()}
                        />
                        {logo && (
                          <Button
                            title="Remove logo"
                            variant="ghost"
                            onPress={() =>
                              void action.run(
                                'Removing logo…',
                                (signal) =>
                                  client.removeLogo(id, state.revision, signal),
                                (result) => {
                                  setState(result);
                                  showToast('Logo removed.');
                                },
                                fail,
                              )
                            }
                          />
                        )}
                      </>
                    )}
                  </>
                )}
                {step === 1 && (
                  <>
                    <Field
                      label="Location name"
                      value={draft.locationName}
                      onChangeText={(locationName) => update({ locationName })}
                      editable={owner}
                    />
                    <Field
                      label="Address (optional)"
                      value={draft.address}
                      onChangeText={(address) => update({ address })}
                      maxLength={500}
                      multiline
                      editable={owner}
                    />
                    {owner ? (
                      <Select
                        label="Timezone"
                        value={draft.timezone}
                        options={supportedTimezones(draft.timezone)}
                        optionLabel={timezoneLabel}
                        searchable
                        onChange={(timezone) => update({ timezone })}
                      />
                    ) : (
                      <Text style={{ color: colors.ink }}>
                        {draft.timezone}
                      </Text>
                    )}
                    <Text style={{ color: colors.muted }}>
                      Choose your city or region.
                    </Text>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Field
                      label="Brand colour (#RRGGBB)"
                      value={draft.brandColor}
                      onChangeText={(brandColor) => update({ brandColor })}
                      editable={owner}
                    />
                    <Text style={{ color: colors.muted }}>
                      Hours are optional. Use HH:mm within one day. Overnight
                      intervals are not supported.
                    </Text>
                    <View
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: brand.accent,
                      }}
                    >
                      <Text
                        style={{
                          color: brand.foreground,
                          fontSize: 18,
                          fontWeight: '600',
                        }}
                      >
                        {draft.name}
                      </Text>
                      <Text style={{ color: brand.foreground }}>
                        {saved
                          ? 'Your saved business branding'
                          : 'Live business preview · unsaved changes'}
                      </Text>
                    </View>
                    <BusinessHours
                      draft={draft}
                      owner={owner}
                      update={update}
                    />
                  </>
                )}
                {step === 3 && (
                  <>
                    {summary}
                    {owner && (
                      <Button
                        title="Edit business"
                        variant="ghost"
                        onPress={() => setStep(0)}
                      />
                    )}
                  </>
                )}
              </Animated.View>
              {!!error && (
                <Text
                  accessibilityRole="alert"
                  style={{ color: colors.danger }}
                >
                  {error}
                </Text>
              )}
              {owner && (
                <View style={{ gap: 8 }}>
                  <Button
                    title={step === 3 ? 'Finish setup' : 'Continue'}
                    onPress={() => void save(Math.min(3, step + 1), step === 3)}
                    disabled={action.pending}
                  />
                  <Button
                    title="Back"
                    variant="secondary"
                    disabled={!step || action.pending}
                    onPress={() => void save(step - 1)}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </Card>
    </AuthBlocker>
  );
}
