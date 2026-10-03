import {
  countLabel,
  formatDate,
  formatDateTime,
  parseLocalDate,
  initialDemoState,
  demoReducer,
  overviewMetrics,
  sampleTrend,
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
  it('preserves approval when the saved reply is unchanged, including a revised draft', () => {
    const initialApproved = demoReducer(initialDemoState, {
      type: 'APPROVE_REPLY',
      reviewId: 1,
    });
    const unchanged = demoReducer(initialApproved, {
      type: 'SET_REPLY_DRAFT',
      reviewId: 1,
      draft: initialDemoState.reviews[0].draft,
    });
    expect(unchanged.approvedReplies).toContain(1);
    const changed = demoReducer(unchanged, {
      type: 'SET_REPLY_DRAFT',
      reviewId: 1,
      draft: 'Revised owner reply.',
    });
    const reapproved = demoReducer(changed, {
      type: 'APPROVE_REPLY',
      reviewId: 1,
    });
    const savedAgain = demoReducer(reapproved, {
      type: 'SET_REPLY_DRAFT',
      reviewId: 1,
      draft: 'Revised owner reply.',
    });
    expect(savedAgain.approvedReplies).toContain(1);
  });
  it('migrates acquisition wording without inventing consent in an old saved customer', () => {
    const customer = {
      ...initialDemoState.customers[3],
      source: 'In-salon permission · fictional',
      consentDate: '2026-09-10',
    };
    const restored = demoReducer(initialDemoState, {
      type: 'HYDRATE',
      payload: { customers: [customer] },
    });
    expect(restored.customers[0].source).toBe('In-salon record · fictional');
    expect(restored.customers[0].consent).toBe(false);
    expect(restored.customers[0].consentDate).toBe('');
  });
  it('uses the same weekly totals for the dashboard and plotted daily series', () => {
    expect(
      Number(overviewMetrics.find((m) => m.label === 'QR scans')?.value),
    ).toBe(sampleTrend.scans.reduce((a, b) => a + b, 0));
    expect(
      Number(
        overviewMetrics.find((m) => m.label === 'Private feedback')?.value,
      ),
    ).toBe(sampleTrend.feedback.reduce((a, b) => a + b, 0));
  });
});
