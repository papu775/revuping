import {
  CategorySelect,
  HoursEditor,
  LocationsEditor,
} from '../../features/business-editors';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'mobile-tokens';
import { Screen, Button, Field, Card, Header, BrandColour } from 'mobile-ui';
import { useDemoStore } from 'mobile-data';
import { spacing, typography } from 'mobile-tokens';
import { Ionicons } from '@expo/vector-icons';

const steps = ['Business info', 'Hours & locations', 'Branding', 'Complete'];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { state, dispatch } = useDemoStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.business.name);
  const [category, setCategory] = useState(state.business.category);
  const [hours, setHours] = useState(state.business.hours);
  const [locations, setLocations] = useState(state.business.locations);
  const [branding, setBranding] = useState(state.business.branding);
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return undefined;
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (step === 0) return false;
          setStep((v) => v - 1);
          return true;
        },
      );
      return () => subscription.remove();
    }, [step]),
  );

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0 && category.trim().length > 0;
    if (step === 1)
      return hours.trim().length > 0 && locations.trim().length > 0;
    if (step === 2) return /^#[0-9a-fA-F]{6}$/.test(branding);
    return true;
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      dispatch({
        type: 'SET_BUSINESS',
        business: { name, category, hours, locations, branding },
      });
      dispatch({ type: 'COMPLETE_ONBOARDING' });
      router.replace('/(tabs)');
    }
  };

  return (
    <Screen edges={[]}>
      <Header
        title="Business onboarding"
        subtitle="Demo setup · No account is created"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Text
          accessibilityLiveRegion="polite"
          style={{ paddingHorizontal: 24, paddingTop: 16, color: colors.muted }}
        >
          Step {step + 1} of {steps.length} · {steps[step]}
        </Text>
        <View style={styles.progress}>
          {steps.map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                {
                  backgroundColor: i <= step ? colors.violet : colors.border,
                },
              ]}
            />
          ))}
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.stepTitle, { color: colors.ink }]}>
            {steps[step]}
          </Text>
          {step === 0 && (
            <>
              <Field
                label="Business name"
                value={name}
                onChangeText={setName}
                placeholder="Bloom & Co."
                autoCapitalize="words"
              />
              <CategorySelect value={category} onChange={setCategory} />
            </>
          )}
          {step === 1 && (
            <>
              <HoursEditor value={hours} onChange={setHours} />
              <LocationsEditor value={locations} onChange={setLocations} />
            </>
          )}
          {step === 2 && (
            <BrandColour value={branding} onChange={setBranding} />
          )}
          {step === 3 && (
            <Card>
              <View style={styles.completeHeader}>
                <Ionicons
                  name="checkmark"
                  size={32}
                  color={colors.positiveInk}
                />
                <Text style={[styles.completeTitle, { color: colors.ink }]}>
                  You're all set!
                </Text>
              </View>
              <Text style={[styles.completeText, { color: colors.muted }]}>
                Your business profile is ready. You can update these details
                anytime in Settings.
              </Text>
            </Card>
          )}
        </ScrollView>
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          {step > 0 && (
            <Button
              title="Back"
              variant="secondary"
              onPress={() => setStep(step - 1)}
              style={{ marginBottom: spacing.sm }}
            />
          )}
          <Button
            title={step === steps.length - 1 ? 'Get started' : 'Continue'}
            onPress={handleNext}
            disabled={!canProceed()}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: spacing.lg,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  colorPreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  completeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  completeTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    flexShrink: 1,
  },
  completeText: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: spacing.lg,
  },
});
