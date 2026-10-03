import { campaignAudience, validSchedule } from './campaigns';
import { initialCustomers, initialDemoState, demoReducer } from 'mobile-data';

describe('coherent demo actions', () => {
  it('excludes missing consent and opt-outs from every campaign audience', () => {
    for (const audience of [
      'All eligible customers',
      'Regular customers',
      'New customers',
      'Last visit over 30 days',
    ]) {
      const rows = campaignAudience(initialCustomers, audience);
      expect(rows.every((c) => c.consent && !c.optedOut)).toBe(true);
      if (audience === 'New customers')
        expect(
          rows.every(
            (c) => c.tags.includes('New customer') || c.tags.includes('New'),
          ),
        ).toBe(true);
      if (audience === 'Regular customers')
        expect(rows.every((c) => c.tags.includes('Regular'))).toBe(true);
    }
  });
  it('rejects impossible dates and invalid reminder days', () => {
    expect(validSchedule('2026-10-03T10:00', '3')).toBe(true);
    for (const [date, days] of [
      ['2026-02-30T10:00', '3'],
      ['not a date', '3'],
      ['2026-10-03T10:00', '-1'],
      ['2026-10-03T10:00', '1.5'],
      ['2026-10-03T10:00', ''],
      ['2026-10-03T10:00', '31'],
    ])
      expect(validSchedule(date, days)).toBe(false);
  });
  it('keeps opt-out stronger than consent and restores eligibility correctly', () => {
    let state = initialDemoState;
    const id = state.customers.find((c) => c.consent && !c.optedOut)!.id;
    state = demoReducer(state, { type: 'TOGGLE_OPT_OUT', customerId: id });
    state = demoReducer(state, { type: 'TOGGLE_CONSENT', customerId: id });
    expect(state.customers.find((c) => c.id === id)?.status).toBe('Opted out');
    state = demoReducer(state, { type: 'TOGGLE_OPT_OUT', customerId: id });
    expect(state.customers.find((c) => c.id === id)?.status).toBe('No consent');
    expect(
      campaignAudience(state.customers, 'All eligible customers').some(
        (c) => c.id === id,
      ),
    ).toBe(false);
  });
  it('approves a reply once under repeated submissions', () => {
    const once = demoReducer(initialDemoState, {
      type: 'APPROVE_REPLY',
      reviewId: 1,
    });
    const twice = demoReducer(once, { type: 'APPROVE_REPLY', reviewId: 1 });
    expect(twice.approvedReplies.filter((id) => id === 1)).toHaveLength(1);
  });
  it('keeps follow-up status and feedback resolution in sync', () => {
    const id = 1;
    const followUp = {
      assignee: 'Alex',
      priority: 'High',
      tags: '',
      due: '2026-10-03',
      status: 'Resolved' as const,
      summary: 'Followed up',
      history: [],
    };
    let state = demoReducer(initialDemoState, {
      type: 'SET_FOLLOW_UP',
      feedbackId: id,
      followUp,
    });
    expect(state.feedback.find((f) => f.id === id)?.resolved).toBe(true);
    state = demoReducer(state, {
      type: 'SET_FEEDBACK_RESOLVED',
      feedbackId: id,
      resolved: false,
    });
    expect(state.followUps[id].status).toBe('Open');
  });
});
