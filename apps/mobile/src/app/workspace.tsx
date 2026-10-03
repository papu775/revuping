import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  AppState,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { authErrorMessage, type WorkspaceResponse } from 'api-contracts';
import { useAuth } from '../data-access/auth-context';

export default function WorkspaceScreen() {
  const { client, session } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const authAction = useAuthAction();
  const { showToast } = useToast();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const busy = useRef(false);
  const generation = useRef(0);
  const account = useRef(session?.user.id);
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
      setWorkspaces(list);
      setSelected((value) =>
        list.some((item) => item.id === value) ? value : (list[0]?.id ?? ''),
      );
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
  }, [client, session?.user.id, session?.user.emailVerified]);
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
            ) : loading ? (
              <Text
                accessibilityLiveRegion="polite"
                style={{ color: colors.muted }}
              >
                Loading workspaces…
              </Text>
            ) : (
              <Card>
                <View style={{ gap: 16 }}>
                  <Text
                    style={{
                      color: colors.ink,
                      fontSize: 20,
                      fontWeight: '600',
                    }}
                  >
                    {workspace ? workspace.name : 'Create your workspace'}
                  </Text>
                  <Text style={{ color: colors.muted }}>
                    {workspace
                      ? 'Your workspace is ready. Business setup and review tools will be available in a later phase.'
                      : 'Choose a workspace name. No business or sample records will be created.'}
                  </Text>
                  {!!workspaces.length && (
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: colors.muted }}>
                        Select workspace
                      </Text>
                      {workspaces.map((item) => (
                        <Button
                          key={item.id}
                          title={`${item.name} · ${item.role}${item.id === selected ? ' · Selected' : ''}`}
                          variant={
                            item.id === selected ? 'primary' : 'secondary'
                          }
                          onPress={() => setSelected(item.id)}
                        />
                      ))}
                    </View>
                  )}
                  {(!workspace || workspace.role === 'OWNER') && (
                    <>
                      <Field
                        label="Workspace name"
                        value={name}
                        onChangeText={setName}
                        maxLength={100}
                      />
                      <Button
                        title={
                          workspace ? 'Save workspace name' : 'Create workspace'
                        }
                        disabled={!name.trim()}
                        loading={pending}
                        onPress={() =>
                          void run(async () => {
                            const updated = workspace
                              ? await client.updateWorkspace(workspace.id, name)
                              : await client.createWorkspace(name);
                            setSelected(updated.id);
                            setNotice('Workspace saved.');
                            await load();
                          })
                        }
                      />
                    </>
                  )}
                  {workspace?.role === 'STAFF' && (
                    <Text style={{ color: colors.muted }}>
                      You have read access. An owner can change the workspace
                      name.
                    </Text>
                  )}
                </View>
              </Card>
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
                    router.replace('/welcome');
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
                    router.replace('/welcome');
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
