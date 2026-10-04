import {
  inviteInputSchema,
  locationInputSchema,
  memberChangeSchema,
  settingsInputSchema,
} from './settings';
const location = {
  revision: 0,
  name: 'Second location',
  address: '',
  timezone: 'UTC',
  hours: Array.from({ length: 7 }, () => []),
  closedDays: Array(7).fill(false),
  archived: false,
};
describe('business and team contracts', () => {
  it('rejects invented roles and client-supplied authorization context', () => {
    const invite = {
      key: '11111111-1111-4111-8111-111111111111',
      name: 'Taylor',
      email: 'Taylor@example.test',
      role: 'STAFF',
    };
    expect(inviteInputSchema.parse(invite).email).toBe('taylor@example.test');
    for (const role of ['Admin', 'Manager', 'Viewer'])
      expect(inviteInputSchema.safeParse({ ...invite, role }).success).toBe(
        false,
      );
    expect(
      inviteInputSchema.safeParse({ ...invite, workspaceId: 'forged' }).success,
    ).toBe(false);
    expect(
      memberChangeSchema.safeParse({ revision: 0, role: 'OWNER', remove: true })
        .success,
    ).toBe(false);
  });
  it('requires useful bounded templates with supported placeholders', () => {
    const value = {
      kind: 'templates',
      revision: 0,
      requestTemplate: 'Hi {name}: {link}',
      rebookingTemplate: 'Book again: {link}',
    };
    expect(settingsInputSchema.safeParse(value).success).toBe(true);
    for (const requestTemplate of [
      ' ',
      'No link',
      'Hello {secret} {link}',
      'x'.repeat(2001),
    ])
      expect(
        settingsInputSchema.safeParse({ ...value, requestTemplate }).success,
      ).toBe(false);
  });
  it('retains structured hours and timezone safeguards for extra locations', () => {
    expect(locationInputSchema.safeParse(location).success).toBe(true);
    expect(
      locationInputSchema.safeParse({
        ...location,
        name: ' ',
        timezone: 'Invented/Zone',
      }).success,
    ).toBe(false);
    expect(
      locationInputSchema.safeParse({
        ...location,
        hours: [
          [{ open: '18:00', close: '09:00' }],
          ...location.hours.slice(1),
        ],
      }).success,
    ).toBe(false);
    expect(
      locationInputSchema.safeParse({
        ...location,
        hours: [
          [{ open: '09:00', close: '17:00' }],
          ...location.hours.slice(1),
        ],
        closedDays: [true, ...location.closedDays.slice(1)],
      }).success,
    ).toBe(false);
  });
});
