import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Button,
  Card,
  Field,
  Header,
  Screen,
  Select,
  BrandColour,
  QRCode,
} from 'mobile-ui';
import { useTheme } from 'mobile-tokens';
import {
  businessBrand,
  authErrorMessage,
  qrSettingsInputSchema,
  type QrSettings,
  type QrSettingsInput,
} from 'api-contracts';
import { useAuth } from '../data-access/auth-context';
const input = (s: QrSettings): QrSettingsInput => ({
  revision: s.revision,
  displayName: s.displayName,
  displayText: s.displayText,
  brandColor: s.brandColor,
  layout: s.layout,
  googleReviewUrl: s.googleReviewUrl,
  enabled: s.enabled,
});
export default function AccountQrStudio() {
  const { client, session } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const { workspace } = useLocalSearchParams<{ workspace: string }>();
  const [list, setList] = useState<QrSettings[]>([]);
  const [selected, setSelected] = useState('');
  const [draft, setDraft] = useState<QrSettingsInput | null>(null);
  const [owner, setOwner] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [logo, setLogo] = useState<Awaited<
    ReturnType<typeof client.logoSource>
  > | null>(null);
  const busy = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    let alive = true;
    generation.current++;
    busy.current = false;
    setPending(false);
    setList([]);
    setDraft(null);
    setError('');
    setLogo(null);
    (async () => {
      const current = await client.current();
      if (!current.user.emailVerified) {
        if (alive) router.replace('/verify-email');
        return;
      }
      const membership = (await client.workspaces()).find(
        (w) => w.id === workspace,
      );
      if (!membership) throw new Error('Unavailable workspace');
      const onboarding = await client.onboarding(workspace);
      if (!onboarding.completedAt) {
        if (alive)
          router.replace({ pathname: '/workspace', params: { workspace } });
        return;
      }
      const locations = await client.qrLocations(workspace);
      const image = onboarding.hasLogo
        ? await client.logoSource(workspace, onboarding.revision)
        : null;
      if (alive) {
        setList(locations);
        setSelected(locations[0]?.id ?? '');
        setDraft(locations[0] ? input(locations[0]) : null);
        setOwner(membership.role === 'OWNER');
        setLogo(image);
      }
    })().catch((e) => {
      if (alive) setError(authErrorMessage(e));
    });
    return () => {
      alive = false;
      generation.current++;
    };
  }, [client, workspace, router, attempt]);
  const saved = list.find((l) => l.id === selected);
  const dirty =
    !!draft &&
    !!saved &&
    JSON.stringify(input(saved)) !== JSON.stringify(draft);
  const update = (patch: Partial<QrSettingsInput>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));
  const action = async (work: () => Promise<unknown>) => {
    if (busy.current) return;
    busy.current = true;
    const current = generation.current;
    setPending(true);
    setError('');
    try {
      await work();
    } catch (e) {
      if (current === generation.current) setError(authErrorMessage(e));
    } finally {
      if (current === generation.current) {
        busy.current = false;
        setPending(false);
      }
    }
  };
  if (!session) return null;
  return (
    <Screen>
      <Header title="QR studio" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 24, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>
            {error}
          </Text>
        )}
        {!saved || !draft ? (
          <>
            <Text style={{ color: colors.muted }}>
              {error
                ? 'Your QR settings could not load.'
                : 'Loading QR settings…'}
            </Text>
            <Button
              title="Try again"
              onPress={() => setAttempt((v) => v + 1)}
            />
          </>
        ) : (
          <>
            <Select
              label="Location"
              value={`${saved.locationName} · ${list.findIndex((l) => l.id === selected) + 1}`}
              options={list.map((l, i) => `${l.locationName} · ${i + 1}`)}
              onChange={(label) => {
                if (busy.current) return;
                const next = list.find(
                  (l, i) => `${l.locationName} · ${i + 1}` === label,
                )!;
                const choose = () => {
                  setSelected(next.id);
                  setDraft(input(next));
                  setError('');
                };
                if (dirty)
                  Alert.alert(
                    'Discard unsaved changes?',
                    'This location has an unsaved draft.',
                    [
                      { text: 'Keep editing', style: 'cancel' },
                      { text: 'Discard', onPress: choose },
                    ],
                  );
                else choose();
              }}
            />
            <Card
              style={{
                backgroundColor: '#ffffff',
                borderRadius: draft.layout === 'Minimal poster' ? 0 : 12,
                borderTopWidth: draft.layout === 'Counter card' ? 4 : 1,
                borderTopColor: businessBrand(
                  draft.brandColor ?? saved.businessColor,
                ).accent,
              }}
            >
              <View style={{ gap: 16, alignItems: 'center' }}>
                {logo && (
                  <Image
                    source={logo}
                    style={{ width: 100, height: 60 }}
                    resizeMode="contain"
                    accessibilityLabel={`${saved.businessName} logo`}
                  />
                )}
                <Text style={{ color: '#20243c', fontSize: 24 }}>
                  {draft.displayName || saved.businessName}
                </Text>
                <Text style={{ color: '#535768' }}>{saved.locationName}</Text>
                <QRCode
                  value={saved.customerUrl}
                  color={draft.brandColor ?? saved.businessColor}
                />
                <Text style={{ color: '#20243c' }}>{draft.displayText}</Text>
                <Text style={{ color: '#535768' }}>
                  Scan to share an honest review or private feedback.
                </Text>
              </View>
            </Card>
            <Text style={{ color: colors.muted }}>
              Location overrides do not rename your business.{' '}
              {owner
                ? 'Save changes before sharing.'
                : 'Staff can view and share saved settings.'}
            </Text>
            {owner && (
              <View
                style={{ gap: 16 }}
                pointerEvents={pending ? 'none' : 'auto'}
              >
                <Field
                  label="Display name override"
                  value={draft.displayName}
                  onChangeText={(v) => update({ displayName: v })}
                  maxLength={100}
                />
                <Field
                  label="Display text"
                  value={draft.displayText}
                  onChangeText={(v) => update({ displayText: v })}
                  maxLength={120}
                />
                <BrandColour
                  value={draft.brandColor ?? saved.businessColor}
                  onChange={(v) => update({ brandColor: v })}
                />
                <Button
                  title="Use business colour"
                  variant="ghost"
                  onPress={() => update({ brandColor: null })}
                />
                <Select
                  label="Layout"
                  value={draft.layout}
                  options={['Counter card', 'Minimal poster']}
                  onChange={(v) =>
                    update({ layout: v as QrSettingsInput['layout'] })
                  }
                />
                <Field
                  label="Google review URL"
                  value={draft.googleReviewUrl}
                  onChangeText={(v) => update({ googleReviewUrl: v })}
                  maxLength={500}
                />
                <Text style={{ color: colors.muted }}>
                  Use g.page/r/…/review,
                  search.google.com/local/writereview?placeid=…, or Google Maps
                  /maps?cid=….
                </Text>
                <Button
                  title={
                    draft.enabled
                      ? 'Disable customer page'
                      : 'Enable customer page'
                  }
                  variant="secondary"
                  onPress={() => update({ enabled: !draft.enabled })}
                />
                <Button
                  title="Save QR settings"
                  loading={pending}
                  disabled={
                    !dirty || !qrSettingsInputSchema.safeParse(draft).success
                  }
                  onPress={() =>
                    void action(async () => {
                      const current = generation.current;
                      const next = await client.saveQr(
                        workspace,
                        saved.id,
                        draft,
                      );
                      if (current !== generation.current) return;
                      setList((items) =>
                        items.map((l) => (l.id === next.id ? next : l)),
                      );
                      setDraft(input(next));
                    })
                  }
                />
              </View>
            )}
            {dirty && (
              <Text style={{ color: colors.muted }}>Unsaved changes</Text>
            )}
            <Button
              title="Preview customer experience"
              variant="secondary"
              disabled={dirty || pending}
              onPress={() =>
                void action(() => Linking.openURL(saved.customerUrl))
              }
            />
            <Button
              title="Share customer link"
              variant="secondary"
              disabled={dirty || pending}
              onPress={() =>
                void action(() => Share.share({ message: saved.customerUrl }))
              }
            />
            <Button
              title="Open card downloads on web"
              variant="secondary"
              disabled={dirty || pending}
              onPress={() =>
                void action(() =>
                  Linking.openURL(
                    `${new URL(saved.customerUrl).origin}/workspace/qr-studio?workspace=${workspace}`,
                  ),
                )
              }
            />
            <Text style={{ color: colors.muted }}>
              SVG and high-resolution PNG downloads use the web studio; sign in
              there with the same account. Native sharing sends the customer
              link. A localhost link cannot be reached from a phone; configure a
              reachable web origin before printing.
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
