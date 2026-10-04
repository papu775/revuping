import { BusinessSetup } from '../features/business-setup';
import { Select } from 'mobile-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  AppState,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from 'mobile-tokens';
import {
  Button,
  Card,
  Field,
  Header,
  Screen,
  AuthBlocker,
  useToast,
} from 'mobile-ui';
import { useAuthAction } from '../features/use-auth-action';
import {
  accountDestination,
  authErrorMessage,
  type WorkspaceResponse,
} from 'api-contracts';
import { useAuth } from '../data-access/auth-context';
import {
  rememberedWorkspace,
  rememberWorkspace,
} from '../data-access/workspace-selection';

export default function WorkspaceScreen() {
  const { client, session } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const scroll = useRef<ScrollView>(null);
  const resetStepScroll = useCallback(
    () => scroll.current?.scrollTo({ y: 0, animated: false }),
    [],
  );
  const query = useLocalSearchParams<{ workspace?: string; edit?: string }>();
  const authAction = useAuthAction();
  const { showToast } = useToast();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invalidSelection, setInvalidSelection] = useState(false);
  const [notice, setNotice] = useState('');
  const busy = useRef(false);
  const generation = useRef(0);
  const account = useRef(session?.user.id);
  const workspaceOptions = workspaces.map(
    (item, index) =>
      `${item.name} · ${item.role}${workspaces.filter((other) => other.name === item.name && other.role === item.role).length > 1 ? ` (${index + 1})` : ''}`,
  );
  const workspace = workspaces.find((item) => item.id === selected);
  useEffect(() => {
    setName(workspace?.name ?? '');
  }, [workspace?.id, workspace?.name]);
  const load = async () => {
    const currentGeneration = ++generation.current;
    if (account.current !== session?.user.id) {
      account.current = session?.user.id;
      setWorkspaces([]);
      setSelected('');
      setName('');
      setNotice('');
    }
    setLoading(true);
    try {
      const current = await client.current();
      const list = current.user.emailVerified ? await client.workspaces() : [];
      if (currentGeneration !== generation.current) return;
      if (!current.user.emailVerified) {
        router.replace('/verify-email');
        return;
      }
      const remembered = await rememberedWorkspace(current.user.id);
      if (currentGeneration !== generation.current) return;
      const chosen = query.workspace
        ? list.find((item) => item.id === query.workspace)
        : (list.find(
            (item) => item.id === selected || item.id === remembered,
          ) ?? list[0]);
      if (query.workspace && !chosen) {
        setWorkspaces([]);
        setSelected('');
        setInvalidSelection(true);
        setError('This workspace is unavailable.');
        return;
      }
      if (query.edit === 'business' && chosen?.role !== 'OWNER') {
        setWorkspaces([]);
        setSelected('');
        setInvalidSelection(true);
        setError('Business editing requires owner access.');
        return;
      }
      if (chosen) {
        const onboarding = await client.onboarding(chosen.id);
        if (currentGeneration !== generation.current) return;
        await rememberWorkspace(current.user.id, chosen.id);
        if (
          accountDestination(current, chosen, onboarding.completedAt) ===
            'dashboard' &&
          query.edit !== 'business'
        ) {
          router.replace({
            pathname: '/account-dashboard',
            params: { workspace: chosen.id },
          });
          return;
        }
      }
      setInvalidSelection(false);
      setWorkspaces(list);
      setSelected(chosen?.id ?? '');
      setError('');
    } catch (error) {
      if (currentGeneration === generation.current)
        setError(authErrorMessage(error));
    } finally {
      if (currentGeneration === generation.current) setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    const interval = setInterval(() => void load(), 60000);
    return () => {
      generation.current++;
      subscription.remove();
      clearInterval(interval);
    };
    // The client instance is stable; each account remounts this protected screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    client,
    session?.user.id,
    session?.user.emailVerified,
    query.workspace,
    query.edit,
  ]);
  const run = async (action: () => Promise<void>) => {
    const currentAccount = session?.user.id;
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (error) {
      if (account.current === currentAccount) setError(authErrorMessage(error));
    } finally {
      busy.current = false;
      if (account.current === currentAccount) setPending(false);
    }
  };
  if (!session) return null;
  return (
    <AuthBlocker label={authAction.label} onCancel={authAction.cancel}>
      <Screen>
        <Header title="Your workspace" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            ref={scroll}
            contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={{ color: colors.ink, fontSize: 24, fontWeight: '600' }}
            >
              Welcome, {session.user.displayName ?? 'there'}
            </Text>
            <Text style={{ color: colors.muted }}>{session.user.email}</Text>
            {!!error && (
              <Text accessibilityRole="alert" style={{ color: colors.danger }}>
                {error}
              </Text>
            )}
            {!!notice && (
              <Text
                accessibilityLiveRegion="polite"
                style={{ color: colors.ink }}
              >
                {notice}
              </Text>
            )}
            {!session.user.emailVerified ? (
              <Card>
                <View style={{ gap: 12 }}>
                  <Text style={{ color: colors.ink }}>
                    Verify your email before opening a workspace.
                  </Text>
                  <Button
                    title="Resend verification email"
                    loading={pending}
                    onPress={() =>
                      void authAction.run(
                        'Requesting verification email…',
                        (signal) =>
                          client.publicAction(
                            'resend-verification',
                            {
                              email: session.user.email,
                            },
                            signal,
                          ),
                        () => {
                          const message =
                            'If your account is eligible, a verification email has been sent. Check your inbox and spam folder.';
                          setNotice(message);
                          showToast(message, 'info');
                        },
                        (error) => {
                          const message = authErrorMessage(error);
                          setError(message);
                          showToast(message, 'error');
                        },
                      )
                    }
                  />
                  <Button
                    title="I’ve verified my email"
                    variant="secondary"
                    onPress={() => void load()}
                  />
                  <Button
                    title="Open verification"
                    variant="ghost"
                    onPress={() => router.push('/verify-email')}
                  />
                </View>
              </Card>
            ) : invalidSelection ? (
              <Button
                title="Open authorized workspaces"
                onPress={() => router.replace('/workspace')}
              />
            ) : (loading && !workspace) ||
              (query.workspace && query.workspace !== selected) ? (
              <Text
                accessibilityLiveRegion="polite"
                style={{ color: colors.muted }}
              >
                Loading workspaces…
              </Text>
            ) : (
              <View style={{ gap: 16 }}>
                {workspaces.length > 1 && (
                  <Select
                    label="Workspace"
                    value={
                      workspaceOptions[
                        workspaces.findIndex((item) => item.id === selected)
                      ] ?? ''
                    }
                    options={workspaceOptions}
                    onChange={(value) =>
                      router.replace({
                        pathname: '/workspace',
                        params: {
                          workspace:
                            workspaces[workspaceOptions.indexOf(value)]?.id ??
                            '',
                        },
                      })
                    }
                  />
                )}
                {workspace ? (
                  <BusinessSetup
                    key={workspace.id}
                    id={workspace.id}
                    owner={workspace.role === 'OWNER'}
                    edit={query.edit === 'business'}
                    onStepChange={resetStepScroll}
                  />
                ) : (
                  <Card>
                    <View style={{ gap: 16 }}>
                      <Text style={{ color: colors.ink, fontSize: 22 }}>
                        Let’s set up your business
                      </Text>
                      <Text style={{ color: colors.muted }}>
                        We’ll use your business name for the workspace too.
                      </Text>
                      <Field
                        label="Business name"
                        value={name}
                        onChangeText={setName}
                        maxLength={100}
                      />
                      <Button
                        title="Continue setup"
                        loading={pending}
                        disabled={!name.trim()}
                        onPress={() =>
                          void run(async () => {
                            const created = await client.createWorkspace(name);
                            setSelected(created.id);
                            await load();
                            showToast('Workspace created.');
                          })
                        }
                      />
                    </View>
                  </Card>
                )}
              </View>
            )}
            <Button
              title="Log out"
              variant="secondary"
              loading={pending}
              onPress={() =>
                void authAction.run(
                  'Logging you out…',
                  () => client.logout(),
                  () => {
                    showToast('You’re logged out.');
                    router.replace('/login');
                  },
                  (error) => {
                    const message = authErrorMessage(error);
                    setError(message);
                    showToast(message, 'error');
                  },
                )
              }
            />
            <Button
              title="Log out all sessions"
              variant="ghost"
              disabled={pending}
              onPress={() =>
                void authAction.run(
                  'Logging out all sessions…',
                  () => client.logout(true),
                  () => {
                    showToast('All sessions logged out.');
                    router.replace('/login');
                  },
                  (error) => {
                    const message = authErrorMessage(error);
                    setError(message);
                    showToast(message, 'error');
                  },
                )
              }
            />
            <Button
              title="Back to welcome"
              variant="ghost"
              onPress={() => router.push('/welcome')}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </AuthBlocker>
  );
}
