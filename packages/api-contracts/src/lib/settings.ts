import { z } from 'zod';
import { ApiRequestError } from './client';
import { authErrorMessage } from './auth';
export function settingsErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError && error.status === 409)
    return 'This conflicts with the current workspace state. Refresh and check existing members or invitations. At least one owner must remain.';
  if (error instanceof ApiRequestError && error.status === 400)
    return 'Check the fields. Invitations require the invited, verified email; primary locations are edited with the business profile.';
  return authErrorMessage(error);
}
import { hoursSchema, onboardingDraftSchema } from './onboarding';
const revision = z.number().int().nonnegative();
const template = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine(
    (value) =>
      [...value.matchAll(/\{([^{}]+)\}/g)].every((match) =>
        ['name', 'link'].includes(match[1]),
      ) &&
      !/[{}]/.test(value.replace(/\{(?:name|link)\}/g, '')) &&
      value.includes('{link}'),
    'Use {name} and {link}; include a link.',
  );
export const workspaceSettingsSchema = z.object({
  revision,
  weekly: z.boolean(),
  feedback: z.boolean(),
  reminders: z.boolean(),
  requestTemplate: z.string(),
  rebookingTemplate: z.string(),
});
export const settingsInputSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('notifications'),
      revision,
      weekly: z.boolean(),
      feedback: z.boolean(),
      reminders: z.boolean(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('templates'),
      revision,
      requestTemplate: template,
      rebookingTemplate: template,
    })
    .strict(),
]);
export const pageInputSchema = z
  .object({ page: z.coerce.number().int().min(1).max(10000).default(1) })
  .strict();
export const teamMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email().nullable(),
  role: z.enum(['OWNER', 'STAFF']),
  revision,
});
export const teamPageSchema = z.object({
  items: z.array(teamMemberSchema),
  page: z.number(),
  total: z.number(),
  pageSize: z.literal(25),
});
export const invitationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['OWNER', 'STAFF']),
  expiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
  delivery: z.enum(['PENDING', 'SENT', 'FAILED']),
  revision,
});
export const invitationPageSchema = z.object({
  items: z.array(invitationSchema),
  page: z.number(),
  total: z.number(),
  pageSize: z.literal(25),
});
export const inviteInputSchema = z
  .object({
    key: z
      .string()
      .uuid()
      .transform((v) => v.toLowerCase()),
    name: z.string().trim().min(1).max(100),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    role: z.enum(['OWNER', 'STAFF']),
  })
  .strict();
export const invitationActionSchema = z
  .object({ revision, action: z.enum(['resend', 'revoke']) })
  .strict();
export const memberChangeSchema = z
  .object({
    revision,
    role: z.enum(['OWNER', 'STAFF']).optional(),
    remove: z.boolean().default(false),
  })
  .strict()
  .refine(
    (v) => (v.remove ? !v.role : !!v.role),
    'Choose a role update or removal.',
  );
export const acceptInvitationSchema = z
  .object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
  .strict();
const locationFieldsSchema = z
  .object({
    key: z
      .string()
      .uuid()
      .transform((v) => v.toLowerCase())
      .optional(),
    revision,
    name: z.string().trim().min(1).max(100),
    address: z.string().trim().max(500),
    timezone: onboardingDraftSchema.shape.timezone,
    hours: hoursSchema,
    closedDays: z.array(z.boolean()).length(7),
    archived: z.boolean(),
  })
  .strict();
export const locationInputSchema = locationFieldsSchema.superRefine(
  (value, ctx) => {
    value.closedDays.forEach((closed, index) => {
      if (closed && value.hours[index].length)
        ctx.addIssue({
          code: 'custom',
          path: ['hours', index],
          message: 'Closed days cannot have opening hours.',
        });
    });
  },
);
export const businessLocationSchema = locationFieldsSchema
  .omit({ key: true })
  .extend({
    id: z.string().uuid(),
    primary: z.boolean(),
    publicId: z.string().uuid(),
  });
export const businessLocationsSchema = z.array(businessLocationSchema);
export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;
export type TeamPage = z.infer<typeof teamPageSchema>;
export type Invitation = z.infer<typeof invitationSchema>;
export type InvitationPage = z.infer<typeof invitationPageSchema>;
export type BusinessLocation = z.infer<typeof businessLocationSchema>;
export type LocationInput = z.infer<typeof locationInputSchema>;
