import { z } from 'zod';
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const intervalSchema = z.object({ open: time, close: time }).strict();
export const hoursSchema = z
  .array(z.array(intervalSchema).max(4))
  .length(7)
  .superRefine((days, ctx) => {
    days.forEach((day, index) => {
      const sorted = [...day].sort((a, b) => a.open.localeCompare(b.open));
      if (
        sorted.some(
          (item, i) =>
            item.open >= item.close ||
            (i > 0 && sorted[i - 1].close > item.open),
        )
      )
        ctx.addIssue({
          code: 'custom',
          path: [index],
          message:
            'Use non-overlapping intervals within one day; overnight hours are not supported.',
        });
    });
  });
export const onboardingDraftSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    category: z.string().trim().max(80),
    locationName: z.string().trim().max(100),
    address: z.string().trim().max(500),
    timezone: z
      .string()
      .max(80)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat('en', { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, 'Choose a valid IANA timezone.'),
    brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    hours: hoursSchema,
    step: z.number().int().min(0).max(3),
  })
  .strict();
export const saveOnboardingSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    draft: onboardingDraftSchema,
    complete: z.boolean().default(false),
  })
  .strict();
export const onboardingSchema = z.object({
  revision: z.number().int().nonnegative(),
  draft: onboardingDraftSchema,
  completedAt: z.string().datetime().nullable(),
  hasLogo: z.boolean(),
});
export type OnboardingDraft = z.infer<typeof onboardingDraftSchema>;
export type OnboardingResponse = z.infer<typeof onboardingSchema>;
export type SaveOnboardingInput = z.infer<typeof saveOnboardingSchema>;
export function initialOnboarding(name: string): OnboardingDraft {
  return {
    name,
    category: '',
    locationName: 'Main location',
    address: '',
    timezone: 'UTC',
    brandColor: '#7856ff',
    hours: Array.from({ length: 7 }, () => []),
    step: 0,
  };
}
