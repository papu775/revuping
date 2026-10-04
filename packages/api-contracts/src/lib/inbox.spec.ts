import { ApiRequestError } from './client';
import {
  inboxErrorMessage,
  inboxNoteSchema,
  inboxPlanSchema,
  inboxQuerySchema,
} from './inbox';
const plan = {
  revision: 0,
  assigneeId: null,
  status: 'UNRESOLVED',
  priority: 'NORMAL',
  dueDate: '',
  tags: '',
  resolutionSummary: '',
};
describe('private feedback contracts', () => {
  it('gives workspace conflict guidance without suggesting an account registration error', () => {
    expect(inboxErrorMessage(new ApiRequestError(409))).toContain(
      'Discard and refresh',
    );
    expect(inboxErrorMessage(new ApiRequestError(409))).not.toContain('email');
  });
  it('requires a real summary for resolution and validates calendar dates', () => {
    expect(
      inboxPlanSchema.safeParse({ ...plan, status: 'RESOLVED' }).success,
    ).toBe(false);
    expect(
      inboxPlanSchema.safeParse({
        ...plan,
        status: 'RESOLVED',
        resolutionSummary: 'Called the customer and arranged a replacement.',
        dueDate: '2028-02-29',
      }).success,
    ).toBe(true);
    for (const dueDate of ['2026-02-29', '2026-04-31', 'tomorrow'])
      expect(inboxPlanSchema.safeParse({ ...plan, dueDate }).success).toBe(
        false,
      );
  });
  it('bounds pagination/search and rejects forged tenant/actor fields', () => {
    for (const query of [
      { page: 0 },
      { page: 10001 },
      { query: 'x'.repeat(101) },
      { workspaceId: 'other' },
      { page: ['1', '2'] },
    ])
      expect(inboxQuerySchema.safeParse(query).success).toBe(false);
    expect(
      inboxPlanSchema.safeParse({ ...plan, actorId: 'forged' }).success,
    ).toBe(false);
  });
  it('normalizes note retry keys, trims bodies and rejects empty or oversized notes', () => {
    const key = '12345678-1234-4123-8123-ABCDEF123456';
    expect(inboxNoteSchema.parse({ key, body: '  Private note  ' })).toEqual({
      key: key.toLowerCase(),
      body: 'Private note',
    });
    for (const body of [' ', 'x'.repeat(2001)])
      expect(inboxNoteSchema.safeParse({ key, body }).success).toBe(false);
  });
});
