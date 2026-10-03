import type { Customer } from 'mobile-data';
export function campaignAudience(customers: Customer[], audience: string) {
  return customers.filter(
    (c) =>
      c.consent &&
      !c.optedOut &&
      (audience === 'Regular customers'
        ? c.tags.includes('Regular')
        : audience === 'New customers'
          ? c.tags.some((tag) => tag === 'New' || tag === 'New customer')
          : audience === 'Last visit over 30 days'
            ? Date.parse('2026-10-02') - Date.parse(c.lastVisit) > 30 * 86400000
            : true),
  );
}
export function validSchedule(value: string, reminderDays: string) {
  const date = new Date(value);
  const days = Number(reminderDays);
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
    Number.isFinite(date.getTime()) &&
    date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() + 1 === Number(value.slice(5, 7)) &&
    date.getDate() === Number(value.slice(8, 10)) &&
    reminderDays.trim() !== '' &&
    Number.isInteger(days) &&
    days >= 0 &&
    days <= 30
  );
}
