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

describe('explicit closed days', () => {
  it('keeps legacy empty days unknown and rejects closed days with intervals', () => {
    const draft = initialOnboarding('Studio');
    const { closedDays: _legacy, ...legacy } = draft;
    const parsed = saveOnboardingSchema.parse({ revision: 0, draft: legacy });
    expect(parsed.draft.closedDays).toEqual(Array(7).fill(false));
    draft.closedDays[0] = true;
    expect(saveOnboardingSchema.safeParse({ revision: 0, draft }).success).toBe(
      true,
    );
    draft.hours[0] = [{ open: '09:00', close: '17:00' }];
    expect(saveOnboardingSchema.safeParse({ revision: 0, draft }).success).toBe(
      false,
    );
  });
});
