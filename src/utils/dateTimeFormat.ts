export interface DateTimeParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour12: number; // 1-12
  minute: number; // 0-59
  meridiem: 'AM' | 'PM';
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function toLocalDateTimeString(date: Date): string {
  const safe = Number.isNaN(date.getTime()) ? new Date(Date.now() + 86400000) : date;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${safe.getFullYear()}-${pad(safe.getMonth() + 1)}-${pad(safe.getDate())}T${pad(
    safe.getHours()
  )}:${pad(safe.getMinutes())}`;
}

export function parseLocalDateTimeParts(
  value: string,
  fallbackMs: number = Date.now() + 86400000
): DateTimeParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '');
  let year: number;
  let month: number;
  let day: number;
  let hour24: number;
  let minute: number;

  if (match) {
    year = Number(match[1]);
    month = Math.min(12, Math.max(1, Number(match[2])));
    const maxDay = getDaysInMonth(year, month);
    day = Math.min(maxDay, Math.max(1, Number(match[3])));
    hour24 = Math.min(23, Math.max(0, Number(match[4])));
    minute = Math.min(59, Math.max(0, Number(match[5])));
  } else {
    const d = new Date(fallbackMs);
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
    hour24 = d.getHours();
    minute = d.getMinutes();
  }

  const meridiem: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return { year, month, day, hour12, minute, meridiem };
}

export function buildLocalDateTimeString(parts: DateTimeParts): string {
  const safeYear = Math.max(2024, Math.min(2035, Math.round(parts.year)));
  const safeMonth = Math.max(1, Math.min(12, Math.round(parts.month)));
  const maxDay = getDaysInMonth(safeYear, safeMonth);
  const safeDay = Math.max(1, Math.min(maxDay, Math.round(parts.day)));
  const safeHour12 = Math.max(1, Math.min(12, Math.round(parts.hour12)));
  const safeMinute = Math.max(0, Math.min(59, Math.round(parts.minute)));

  let hour24 = safeHour12 % 12;
  if (parts.meridiem === 'PM') {
    hour24 += 12;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${safeYear}-${pad(safeMonth)}-${pad(safeDay)}T${pad(hour24)}:${pad(safeMinute)}`;
}

export type QuickSchedulePreset =
  | 'in-15m'
  | 'in-1h'
  | 'in-3h'
  | 'tonight-8pm'
  | 'tomorrow-8pm'
  | 'in-3d'
  | 'in-7d';

export function applyQuickSchedulePreset(
  preset: QuickSchedulePreset,
  nowMs: number = Date.now()
): string {
  const base = new Date(nowMs);

  switch (preset) {
    case 'in-15m':
      return toLocalDateTimeString(new Date(nowMs + 15 * 60 * 1000));
    case 'in-1h':
      return toLocalDateTimeString(new Date(nowMs + 60 * 60 * 1000));
    case 'in-3h':
      return toLocalDateTimeString(new Date(nowMs + 3 * 60 * 60 * 1000));
    case 'tonight-8pm': {
      const target = new Date(base);
      target.setHours(20, 0, 0, 0);
      if (target.getTime() <= nowMs) {
        target.setDate(target.getDate() + 1);
      }
      return toLocalDateTimeString(target);
    }
    case 'tomorrow-8pm': {
      const target = new Date(base);
      target.setDate(target.getDate() + 1);
      target.setHours(20, 0, 0, 0);
      return toLocalDateTimeString(target);
    }
    case 'in-3d': {
      const target = new Date(nowMs + 3 * 24 * 60 * 60 * 1000);
      return toLocalDateTimeString(target);
    }
    case 'in-7d': {
      const target = new Date(nowMs + 7 * 24 * 60 * 60 * 1000);
      return toLocalDateTimeString(target);
    }
  }
}

export function formatTargetCountdownSummary(
  value: string,
  nowMs: number = Date.now()
): { formatted: string; relative: string; isPast: boolean } {
  if (!value) {
    return { formatted: 'No date selected', relative: 'Pick a date & time', isPast: false };
  }
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) {
    return { formatted: 'Invalid date', relative: 'Pick a valid date & time', isPast: false };
  }

  const formatted = target.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const diff = target.getTime() - nowMs;
  if (diff <= 0) {
    return { formatted, relative: 'Broadcasting LIVE immediately', isPast: true };
  }

  const totalMins = Math.floor(diff / 60000);
  const days = Math.floor(totalMins / (60 * 24));
  const hours = Math.floor((totalMins % (60 * 24)) / 60);
  const mins = totalMins % 60;

  if (days > 0) {
    return { formatted, relative: `Starts in ${days}d ${hours}h ${mins}m`, isPast: false };
  }
  if (hours > 0) {
    return { formatted, relative: `Starts in ${hours}h ${mins}m`, isPast: false };
  }
  return { formatted, relative: `Starts in ${Math.max(1, mins)}m`, isPast: false };
}
