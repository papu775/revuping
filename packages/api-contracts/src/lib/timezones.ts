/** Supported runtime IANA zones; UTC is the editable device-detection fallback. */
export function supportedTimezones(saved?: string): string[] {
  const zones = [
    'UTC',
    ...(typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : []),
  ];
  // Preserve valid saved aliases even if the runtime lists their canonical name.
  if (saved && !zones.includes(saved)) {
    try {
      new Intl.DateTimeFormat('en', { timeZone: saved });
      zones.push(saved);
    } catch {
      /* invalid saved values remain server errors */
    }
  }
  return zones.sort();
}
export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
export function timezoneLabel(zone: string): string {
  return zone === 'UTC'
    ? 'Coordinated Universal Time · UTC'
    : `${zone.split('/').slice(1).join(' / ').replaceAll('_', ' ')} · ${zone}`;
}
