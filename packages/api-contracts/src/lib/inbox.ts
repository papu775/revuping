import { z } from 'zod';
import { authErrorMessage } from './auth';
import { ApiRequestError } from './client';
export function inboxErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError && error.status === 409)
    return 'This response changed or this note retry conflicts. Your draft is preserved. Discard and refresh before retrying.';
  if (error instanceof ApiRequestError && error.status === 400)
    return 'Check the follow-up fields and the assigned member’s current workspace access.';
  return authErrorMessage(error);
}
export const inboxStatusSchema = z.enum([
  'UNRESOLVED',
  'IN_PROGRESS',
  'RESOLVED',
]);
export const inboxPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH']);
const dueDate = z
  .string()
  .refine(
    (value) =>
      value === '' ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
        new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value),
    'Use a valid date.',
  );
export const inboxPlanSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    assigneeId: z.string().uuid().nullable(),
    priority: inboxPrioritySchema,
    status: inboxStatusSchema,
    dueDate,
    tags: z.string().trim().max(100),
    resolutionSummary: z.string().trim().max(2000),
  })
  .strict()
  .refine(
    (v) => v.status !== 'RESOLVED' || v.resolutionSummary.length > 0,
    'Add a resolution summary.',
  );
export const inboxNoteSchema = z
  .object({
    key: z
      .string()
      .uuid()
      .transform((v) => v.toLowerCase()),
    body: z.string().trim().min(1).max(2000),
  })
  .strict();
export const inboxQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    query: z.string().trim().max(100).default(''),
    status: z
      .enum(['ALL', 'UNRESOLVED', 'IN_PROGRESS', 'RESOLVED', 'OVERDUE'])
      .default('ALL'),
    location: z.string().uuid().optional(),
  })
  .strict();
export const inboxMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export const inboxMembersSchema = z.object({
  items: z.array(inboxMemberSchema),
  page: z.number().int(),
  total: z.number().int(),
  pageSize: z.literal(25),
});
export const inboxItemSchema = z.object({
  id: z.string().uuid(),
  locationId: z.string().uuid(),
  locationName: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  rating: z.number().int().min(1).max(5),
  message: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  revision: z.number().int().nonnegative(),
  status: inboxStatusSchema,
  priority: inboxPrioritySchema,
  assigneeId: z.string().uuid().nullable(),
  assigneeName: z.string().nullable(),
  dueDate,
  tags: z.string(),
  resolutionSummary: z.string(),
});
export const inboxPageSchema = z.object({
  items: z.array(inboxItemSchema),
  page: z.number().int(),
  total: z.number().int(),
  pageSize: z.literal(25),
});
export const inboxActivitySchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(['NOTE', 'PLAN']),
  body: z.string(),
  actorName: z.string(),
  createdAt: z.string().datetime(),
});
export const inboxHistorySchema = z.object({
  items: z.array(inboxActivitySchema),
  page: z.number().int(),
  total: z.number().int(),
  pageSize: z.literal(25),
});
export type InboxItem = z.infer<typeof inboxItemSchema>;
export type InboxPage = z.infer<typeof inboxPageSchema>;
export type InboxPlan = z.infer<typeof inboxPlanSchema>;
export type InboxHistory = z.infer<typeof inboxHistorySchema>;
export type InboxMember = z.infer<typeof inboxMemberSchema>;
