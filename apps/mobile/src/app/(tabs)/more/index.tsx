import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import { Card, Avatar, Button } from 'mobile-ui';
import { useAuth } from '../../../data-access/auth-context';
import { spacing, typography } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';

const menuItems = [
  {
    title: 'QR studio',
    subtitle: 'Branded QR codes',
    iconName: 'qr-code' as const,
    route: '/(tabs)/more/qr-studio',
  },
  {
    title: 'Google reviews',
    subtitle: 'Review list & replies',
    iconName: 'star' as const,
    route: '/(tabs)/more/reviews',
  },
  {
    title: 'Referrals',
    subtitle: 'Invitation programme preview',
    iconName: 'gift' as const,
    route: '/(tabs)/more/referrals',
  },
  {
    title: 'Surveys',
    subtitle: 'Question editor & responses',
    iconName: 'document-text' as const,
    route: '/(tabs)/more/surveys',
  },
  {
    title: 'Reports',
    subtitle: 'Charts & filters',
    iconName: 'bar-chart' as const,
    route: '/(tabs)/more/reports',
  },
  {
    title: 'Staff & services',
    subtitle: 'Team insights',
    iconName: 'people' as const,
    route: '/(tabs)/more/staff',
  },
  {
    title: 'Competitors',
    subtitle: 'Fictional comparison',
    iconName: 'trending-up' as const,
    route: '/(tabs)/more/competitors',
  },
  {
    title: 'Widgets',
    subtitle: 'Social card previews',
    iconName: 'grid' as const,
    route: '/(tabs)/more/widgets',
  },
  {
    title: 'Integrations',
    subtitle: 'Setup previews',
    iconName: 'link' as const,
    route: '/(tabs)/more/integrations',
  },
  {
    title: 'Settings',
    subtitle: 'Business, team & templates',
    iconName: 'settings' as const,
    route: '/(tabs)/more/settings',
  },
  {
    title: 'Billing',
    subtitle: 'Plan preview',
    iconName: 'card' as const,
    route: '/(tabs)/more/billing',
  },
  {
    title: 'Profile',
    subtitle: 'Theme & reset demo',
    iconName: 'person' as const,
    route: '/(tabs)/more/profile',
  },
];

export default function MoreScreen() {
  const { exitDemo } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state } = useDemoStore();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.canvas, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>More</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar initials="DO" tone="lavender" size={48} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.ink }]}>
                Demo owner
              </Text>
              <Text style={[styles.profileEmail, { color: colors.muted }]}>
                {state.business.name} · Demo workspace
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.menuCard}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              onPress={() => router.push(item.route as Href)}
              style={[styles.menuRow, { borderBottomColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: colors.surfaceSection },
                ]}
              >
                <Ionicons
                  name={item.iconName}
                  size={20}
                  color={colors.violet}
                />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.ink }]}>
                  {item.title}
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.muted }]}>
                  {item.subtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </Card>
        <Button
          title="Leave demo"
          variant="ghost"
          onPress={() => {
            exitDemo();
            router.replace('/welcome');
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
  },
  profileCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.heading,
    fontWeight: '700',
    flexShrink: 1,
  },
  profileEmail: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  menuCard: {
    marginHorizontal: spacing.xl,
    padding: 0,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.label,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: typography.caption,
    marginTop: 2,
  },
});
