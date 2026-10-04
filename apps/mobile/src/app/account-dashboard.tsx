import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AppState, Image, ScrollView, Text, View } from 'react-native';
import { Button, Card, Header, Screen, Select } from 'mobile-ui';
import { useTheme } from 'mobile-tokens';
import {
  accountDestination,
  authErrorMessage,
  type OnboardingResponse,
  type WorkspaceResponse,
} from 'api-contracts';
import { useAuth } from '../data-access/auth-context';
import {
  rememberedWorkspace,
  rememberWorkspace,
} from '../data-access/workspace-selection';
export default function AccountDashboard() {
  const { client, session, enterDemo } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const query = useLocalSearchParams<{ workspace?: string }>();
  const [state, setState] = useState<{
    workspace: WorkspaceResponse;
    list: WorkspaceResponse[];
    onboarding: OnboardingResponse;
    logo: Awaited<ReturnType<typeof client.logoSource>> | null;
  } | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setState(null);
        setAttempt((value) => value + 1);
      }
    });
    return () => subscription.remove();
  }, []);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setState(null);
      setError('');
      (async () => {
        const current = await client.current();
        if (!current.user.emailVerified) {
          if (alive) router.replace('/verify-email');
          return;
        }
        const list = await client.workspaces();
        const remembered = await rememberedWorkspace(current.user.id);
        const workspace = query.workspace
          ? list.find((item) => item.id === query.workspace)
          : (list.find((item) => item.id === remembered) ?? list[0]);
        if (query.workspace && !workspace)
          throw new Error('Unauthorized workspace');
        if (!workspace) {
          if (alive) router.replace('/workspace');
          return;
        }
        const onboarding = await client.onboarding(workspace.id);
        if (!alive) return;
        if (
          accountDestination(current, workspace, onboarding.completedAt) !==
          'dashboard'
        ) {
          router.replace({
            pathname: '/workspace',
            params: { workspace: workspace.id },
          });
          return;
        }
        const logo = onboarding.hasLogo
          ? await client.logoSource(workspace.id, onboarding.revision)
          : null;
        if (!alive) return;
        await rememberWorkspace(current.user.id, workspace.id);
        if (alive) setState({ workspace, list, onboarding, logo });
      })().catch((error) => {
        if (alive) setError(authErrorMessage(error));
      });
      return () => {
        alive = false;
      };
    }, [client, query.workspace, router, attempt]),
  );
  if (!session) return null;
  return (
    <Screen>
      <Header title="Your dashboard" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>
            {error}
          </Text>
        )}
        {!state ? (
          <View style={{ gap: 12 }}>
            {error ? (
              <Button
                title="Try again"
                onPress={() => setAttempt((value) => value + 1)}
              />
            ) : (
              <Text style={{ color: colors.muted }}>
                Loading your workspace…
              </Text>
            )}
          </View>
        ) : (
          <>
            <Select
              label="Workspace"
              value={`${state.workspace.name} · ${state.list.findIndex((item) => item.id === state.workspace.id) + 1}`}
              options={state.list.map(
                (item, index) => `${item.name} · ${index + 1}`,
              )}
              onChange={(label) =>
                router.replace({
                  pathname: '/workspace',
                  params: {
                    workspace: state.list.find(
                      (item, index) => `${item.name} · ${index + 1}` === label,
                    )!.id,
                  },
                })
              }
            />
            <View style={{ gap: 12 }}>
              {state.logo && (
                <Image
                  source={state.logo}
                  style={{ width: 120, height: 72 }}
                  resizeMode="contain"
                  accessibilityLabel={`${state.onboarding.draft.name} logo`}
                />
              )}
              <Text
                style={{ color: colors.ink, fontSize: 28, fontWeight: '600' }}
              >
                {state.onboarding.draft.name}
              </Text>
            </View>
            <Card>
              <View style={{ gap: 12 }}>
                <Text style={{ color: colors.ink, fontSize: 22 }}>
                  Business setup complete
                </Text>
                <Text style={{ color: colors.muted }}>
                  {state.onboarding.draft.locationName} ·{' '}
                  {state.onboarding.draft.timezone}
                </Text>
                {state.workspace.role === 'OWNER' && (
                  <Button
                    title="Edit business details"
                    onPress={() =>
                      router.push({
                        pathname: '/workspace',
                        params: {
                          workspace: state.workspace.id,
                          edit: 'business',
                        },
                      })
                    }
                  />
                )}
              </View>
            </Card>
            <Button
              title="QR studio"
              onPress={() =>
                router.push({
                  pathname: '/account-qr-studio',
                  params: { workspace: state.workspace.id },
                })
              }
            />
            <Button
              title="Feedback inbox"
              onPress={() =>
                router.push({
                  pathname: '/account-feedback',
                  params: { workspace: state.workspace.id },
                })
              }
            />
            <Button
              title="Business & team"
              onPress={() =>
                router.push({
                  pathname: '/account-settings',
                  params: { workspace: state.workspace.id },
                })
              }
            />
            <Card>
              <View style={{ gap: 12 }}>
                <Text style={{ color: colors.ink, fontSize: 22 }}>
                  Activity
                </Text>
                <Text style={{ color: colors.muted }}>
                  Activity reporting is not available yet. Read private QR
                  feedback in your Feedback Inbox. Campaigns and integrations
                  remain unavailable.
                </Text>
              </View>
            </Card>
            <Button
              title="Explore the separate fictional demo"
              variant="secondary"
              onPress={() => {
                enterDemo();
                router.push('/(tabs)');
              }}
            />
          </>
        )}
        <Button
          title="Log out"
          variant="secondary"
          onPress={async () => {
            try {
              await client.logout();
              router.replace('/login');
            } catch (error) {
              setError(authErrorMessage(error));
            }
          }}
        />
      </ScrollView>
    </Screen>
  );
}
