import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Field } from 'mobile-ui';
import { useTheme } from 'mobile-tokens';
import { settingsErrorMessage } from 'api-contracts';
import { useAuth } from '../data-access/auth-context';
export function InvitationAccept() {
  const { client } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <View style={{ gap: 12 }}>
      <Field
        label="Invitation token or link"
        value={value}
        secureTextEntry
        autoCorrect={false}
        editable={!busy}
        onChangeText={setValue}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </Text>
      )}
      <Button
        title={busy ? 'Joining…' : 'Accept invitation'}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          setError('');
          try {
            const token = value.includes('#')
              ? new URLSearchParams(value.split('#')[1]).get('token') || ''
              : value;
            const workspace = await client.acceptInvitation(token);
            router.replace({
              pathname: '/workspace',
              params: { workspace: workspace.id },
            });
          } catch (e) {
            setError(settingsErrorMessage(e));
            setBusy(false);
          }
        }}
      />
    </View>
  );
}
