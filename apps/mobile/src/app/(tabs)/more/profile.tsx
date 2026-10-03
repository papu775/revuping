import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme, type ThemePreference } from 'mobile-tokens';
import { useDemoStore } from 'mobile-data';
import { Header, Card, Avatar, Button, Dialog, useToast } from 'mobile-ui';
import { spacing, typography } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';

type ThemeIconName = 'sunny' | 'moon' | 'phone-portrait';

const themeOptions: {
  label: string;
  value: ThemePreference;
  iconName: ThemeIconName;
}[] = [
  { label: 'Light', value: 'light', iconName: 'sunny' },
  { label: 'Dark', value: 'dark', iconName: 'moon' },
  { label: 'System', value: 'system', iconName: 'phone-portrait' },
];

export default function ProfileScreen() {
  const { colors, themePreference, setThemePreference } = useTheme();
  const { resetDemo } = useDemoStore();
  const toast = useToast();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleReset = () => {
    resetDemo();
    setShowResetDialog(false);
    toast.showToast('Demo data reset');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Header title="Profile" showBack />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      >
        <Card style={styles.card}>
          <View style={styles.profileRow}>
            <Avatar initials="DO" tone="lavender" size={56} />
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.ink }]}>
                Demo owner
              </Text>
              <Text style={[styles.email, { color: colors.muted }]}>
                owner@example.com
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Theme
          </Text>
          <View style={styles.themeRow}>
            {themeOptions.map((option) => {
              const isSelected = themePreference === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setThemePreference(option.value)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isSelected
                        ? colors.actionBg
                        : colors.surfaceSection,
                      borderColor: isSelected ? colors.actionBg : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label} theme`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Ionicons
                    name={option.iconName}
                    size={20}
                    color={isSelected ? '#ffffff' : colors.ink}
                  />
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: isSelected ? '#ffffff' : colors.ink },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#ffffff"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Demo data
          </Text>
          <Text style={[styles.demoText, { color: colors.muted }]}>
            Reset all demo data to its initial state. This clears all local
            changes.
          </Text>
          <Button
            title="Reset demo data"
            variant="danger"
            onPress={() => setShowResetDialog(true)}
            style={{ marginTop: spacing.md }}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            About
          </Text>
          <Text style={[styles.aboutText, { color: colors.muted }]}>
            RevuPing Mobile v1.0.0 · Demo prototype{'\n'}
            No real authentication, payments, or integrations.
          </Text>
        </Card>
      </ScrollView>

      <Dialog
        visible={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        title="Reset demo data?"
        message="This will clear all local changes and restore the initial demo state."
        confirmLabel="Reset"
        onConfirm={handleReset}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
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
  name: {
    fontSize: typography.heading,
    fontWeight: '700',
    flexShrink: 1,
  },
  email: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.label,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  themeOption: {
    flexGrow: 1,
    flexBasis: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  themeLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  demoText: {
    fontSize: typography.caption,
    lineHeight: 20,
  },
  aboutText: {
    fontSize: typography.caption,
    lineHeight: 20,
  },
});
