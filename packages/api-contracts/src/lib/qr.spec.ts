import {
  feedbackInputSchema,
  isGoogleReviewUrl,
  qrSettingsInputSchema,
} from './qr';
it('accepts narrow Google destinations and rejects redirects or deceptive hosts', () => {
  for (const u of [
    'https://g.page/r/Ab_C-12/review',
    'https://search.google.com/local/writereview?placeid=ChIJ12345',
    'https://www.google.com/maps?cid=12345',
  ])
    expect(isGoogleReviewUrl(u)).toBe(true);
  for (const u of [
    'https://g.page.evil.test/r/a/review',
    'https://google.com/url?q=https://evil.test',
    'https://www.google.com/maps?cid=123&url=https://evil.test',
    'javascript:alert(1)',
    'https://u:p@g.page/r/a/review',
    'https://g.page/r/a/review#evil',
    'https://maps.app.goo.gl/anything',
  ])
    expect(isGoogleReviewUrl(u)).toBe(false);
});
it('rejects ownership injection, bounds ratings/messages and keeps QR display fields separate', () => {
  const key = 'd2e7dbb8-020b-49c2-b5f4-a7cca897ae19';
  expect(
    feedbackInputSchema.safeParse({
      key,
      rating: 5,
      message: 'Good',
      workspaceId: key,
    }).success,
  ).toBe(false);
  expect(
    feedbackInputSchema.safeParse({ key, rating: 0, message: '' }).success,
  ).toBe(false);
  expect(
    qrSettingsInputSchema.safeParse({
      revision: 0,
      displayName: '',
      displayText: 'Welcome',
      brandColor: null,
      layout: 'Counter card',
      googleReviewUrl: '',
      enabled: true,
    }).success,
  ).toBe(true);
});

it('normalizes UUID casing before idempotency serialization', () => {
  const key = 'd2e7dbb8-020b-49c2-b5f4-a7cca897ae19';
  expect(
    feedbackInputSchema.parse({
      key: key.toUpperCase(),
      rating: 5,
      message: 'Good',
    }).key,
  ).toBe(key);
});
