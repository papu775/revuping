import {
  hoursSchema,
  initialOnboarding,
  saveOnboardingSchema,
} from './onboarding';
describe('business contracts', () => {
  it('allows closed days and multiple intervals but rejects overlap and overnight', () => {
    const hours = initialOnboarding('Studio').hours;
    hours[0] = [
      { open: '09:00', close: '12:00' },
      { open: '13:00', close: '17:00' },
    ];
    expect(hoursSchema.safeParse(hours).success).toBe(true);
    hours[0][1].open = '11:00';
    expect(hoursSchema.safeParse(hours).success).toBe(false);
    hours[0] = [{ open: '22:00', close: '02:00' }];
    expect(hoursSchema.safeParse(hours).success).toBe(false);
  });
  it('rejects cross-tenant references, mass assignment and invented timezones', () => {
    const draft = initialOnboarding('Studio');
    expect(
      saveOnboardingSchema.safeParse({
        revision: 0,
        draft,
        workspaceId: 'other',
      }).success,
    ).toBe(false);
    expect(
      saveOnboardingSchema.safeParse({
        revision: 0,
        draft: { ...draft, timezone: 'invented' },
      }).success,
    ).toBe(false);
  });
});
