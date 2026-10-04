import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Header, Screen } from 'mobile-ui';
import { useTheme } from 'mobile-tokens';
import { useAuth } from '../data-access/auth-context';
import { InvitationAccept } from '../features/team-invitation';
export default function AccountJoinTeam() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  if (!session) return null;
  return (
    <Screen>
      <Header title="Join a workspace" showBack />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 24, gap: 20 }}
      >
        <Card>
          <Text style={{ color: colors.ink, fontSize: 22 }}>
            Accept your team invitation
          </Text>
          <Text style={{ color: colors.muted }}>
            Use the invited email account and the latest invitation link. Accept
            only an invitation you expected.
          </Text>
          {session.user.emailVerified ? (
            <InvitationAccept />
          ) : (
            <Button
              title="Verify your email"
              onPress={() => router.replace('/verify-email')}
            />
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
