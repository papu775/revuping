import { workspaceDate } from './workspace-date';
describe('workspace follow-up calendar', () => {
  it('uses the business date around UTC midnight and daylight-saving transitions', () => {
    expect(
      workspaceDate('America/Los_Angeles', new Date('2026-01-01T01:00:00Z')),
    ).toBe('2025-12-31');
    expect(
      workspaceDate('Pacific/Kiritimati', new Date('2026-01-01T12:00:00Z')),
    ).toBe('2026-01-02');
    expect(
      workspaceDate('America/New_York', new Date('2026-03-08T06:59:00Z')),
    ).toBe('2026-03-08');
    expect(
      workspaceDate('America/New_York', new Date('2026-03-08T07:01:00Z')),
    ).toBe('2026-03-08');
  });
});
