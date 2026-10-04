import { z } from 'zod';
// Deliberately narrow destinations; never resolve user URLs on the server.
export function isGoogleReviewUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port || u.hash)
      return false;
    if (u.hostname === 'g.page')
      return /^\/r\/[A-Za-z0-9_-]+\/review\/?$/.test(u.pathname) && !u.search;
    if (u.hostname === 'search.google.com')
      return (
        u.pathname === '/local/writereview' &&
        /^[A-Za-z0-9_-]{5,200}$/.test(u.searchParams.get('placeid') ?? '') &&
        [...u.searchParams.keys()].every((k) => k === 'placeid')
      );
    if (u.hostname === 'www.google.com' || u.hostname === 'maps.google.com')
      return (
        u.pathname === '/maps' &&
        /^\d{1,30}$/.test(u.searchParams.get('cid') ?? '') &&
        [...u.searchParams.keys()].every((k) => k === 'cid')
      );
    return false;
  } catch {
    return false;
  }
}
export const qrSettingsInputSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    displayName: z.string().trim().max(100), // Empty inherits saved business name.
    displayText: z.string().trim().min(1).max(120),
    brandColor: z
      .string()
      .regex(/^#[a-f0-9]{6}$/i)
      .nullable(), // null inherits business branding.
    layout: z.enum(['Counter card', 'Minimal poster']),
    googleReviewUrl: z
      .string()
      .max(500)
      .refine(
        (v) => v === '' || isGoogleReviewUrl(v),
        'Use a supported HTTPS Google review or Maps URL.',
      ),
    enabled: z.boolean(),
  })
  .strict();
export const qrSettingsSchema = qrSettingsInputSchema.extend({
  id: z.string().uuid(),
  locationName: z.string(),
  businessName: z.string(),
  effectiveName: z.string(),
  effectiveColor: z.string(),
  businessColor: z.string(),
  hasLogo: z.boolean(),
  publicId: z.string().uuid(),
  customerUrl: z.string().url(),
});
export const qrLocationsSchema = z.array(qrSettingsSchema);
export const publicCustomerSchema = z.object({
  name: z.string(),
  locationName: z.string(),
  displayText: z.string(),
  brandColor: z.string(),
  hasLogo: z.boolean(),
  googleReviewUrl: z.string().nullable(),
});
export const feedbackInputSchema = z
  .object({
    key: z
      .string()
      .uuid()
      .transform((value) => value.toLowerCase()),
    rating: z.number().int().min(1).max(5),
    message: z.string().trim().min(1).max(2000),
    name: z.string().trim().max(100).default(''),
    email: z
      .union([z.literal(''), z.string().trim().email().max(254)])
      .default(''),
  })
  .strict();
export const feedbackReceiptSchema = z.object({ received: z.literal(true) });
export type QrSettings = z.infer<typeof qrSettingsSchema>;
export type QrSettingsInput = z.infer<typeof qrSettingsInputSchema>;
export type PublicCustomer = z.infer<typeof publicCustomerSchema>;
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
