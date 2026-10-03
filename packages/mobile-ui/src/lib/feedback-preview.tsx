import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'mobile-tokens';
import { Badge } from './badge.tsx';
import { Avatar } from './avatar.tsx';
import { Stars } from './stars.tsx';

/** A static native composition, adapted from the web auth story. */
export function FeedbackPreview({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        alignSelf: 'stretch',
        padding: 16,
        borderWidth: 1,
        borderColor: colors.accentLine,
        borderRadius: 20,
        backgroundColor: colors.surface,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={20}
          color={colors.violet}
        />
        <Text
          style={{
            color: colors.violet,
            fontSize: 12,
            fontWeight: '700',
            flex: 1,
          }}
        >
          PRIVATE FEEDBACK
        </Text>
        <Badge label="Demo" tone="violet" />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Avatar initials="JW" tone="peach" size={36} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 15 }}>
            James Wilson
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
            Today · Alex
          </Text>
        </View>
        <Stars rating={3} size={13} />
      </View>
      {!compact && (
        <Text
          style={{
            color: colors.ink,
            fontSize: 15,
            lineHeight: 23,
            marginTop: 12,
          }}
        >
          “Happy with the haircut. A heads-up about the wait would have helped.”
        </Text>
      )}
      <View
        style={{
          backgroundColor: colors.mint,
          borderRadius: 10,
          padding: 10,
          marginTop: 12,
          flexDirection: 'row',
          gap: 8,
        }}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={18}
          color={colors.positiveInk}
        />
        <Text
          style={{
            color: colors.positiveInk,
            fontSize: 13,
            flex: 1,
            lineHeight: 19,
          }}
        >
          Next step: follow up with James
        </Text>
      </View>
    </View>
  );
}
