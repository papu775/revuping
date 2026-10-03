import {
  countLabel,
  formatDate,
  formatDateTime,
  parseLocalDate,
  initialDemoState,
  demoReducer,
} from 'mobile-data';

describe('mobile presentation semantics', () => {
  it('handles zero, singular and plural without inventing counts', () => {
    expect(countLabel(0, 'customer')).toBe('0 customers');
    expect(countLabel(1, 'customer')).toBe('1 customer');
    expect(countLabel(2, 'feedback item')).toBe('2 feedback items');
  });
  it('formats local calendar dates and rejects impossible dates', () => {
    expect(formatDate('2026-10-03')).toBe('3 Oct 2026');
    expect(formatDateTime('2026-10-03T10:00')).toMatch(/3 Oct 2026.*10:00/);
    expect(parseLocalDate('2026-02-30')).toBeUndefined();
    expect(parseLocalDate('2026-10-03T25:00')).toBeUndefined();
    expect(formatDate('Today, 10:42 am')).toBe('Today, 10:42 am');
  });
  it('requires new owner approval after an approved reply is edited', () => {
    const approved = demoReducer(initialDemoState, {
      type: 'APPROVE_REPLY',
      reviewId: 1,
    });
    const edited = demoReducer(approved, {
      type: 'SET_REPLY_DRAFT',
      reviewId: 1,
      draft: 'A revised response.',
    });
    expect(edited.approvedReplies).not.toContain(1);
    expect(edited.replyDrafts[1]).toBe('A revised response.');
    const reapproved = demoReducer(edited, {
      type: 'APPROVE_REPLY',
      reviewId: 1,
    });
    expect(reapproved.approvedReplies).toContain(1);
  });
});
