export function countLabel(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Date-only values stay on their local calendar day rather than shifting via UTC. */
export function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value);
  if (!match) return undefined;
  const [, y, m, d, h = '0', min = '0'] = match;
  const date = new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(h),
    Number(min),
  );
  return date.getFullYear() === Number(y) &&
    date.getMonth() === Number(m) - 1 &&
    date.getDate() === Number(d) &&
    Number(h) < 24 &&
    Number(min) < 60
    ? date
    : undefined;
}
export function formatDate(value: string, short = false) {
  const date = parseLocalDate(value);
  if (!date) return value || 'Not recorded';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(short ? {} : { year: 'numeric' }),
  });
}
export function formatDateTime(value: string) {
  const date = parseLocalDate(value);
  return date
    ? `${formatDate(value)} · ${date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}`
    : value || 'Not scheduled';
}
