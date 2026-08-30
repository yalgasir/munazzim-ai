import { format, isValid, parseISO } from 'date-fns';

export function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') return value == null ? null : String(value);
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
    return null;
  }
  return trimmed;
}

export function isISODate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = parseISO(value);
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value;
}

export function isClockTime(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parts = value.split(':');
  if (parts.length !== 2 || parts.some((part) => part.length !== 2)) return false;
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  return Number.isInteger(hour) && Number.isInteger(minute)
    && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function minutesSinceMidnight(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function isLegacyTime(value: unknown): value is string {
  if (value === null) return true;
  if (isClockTime(value)) return true;
  if (typeof value !== 'string') return false;
  const parts = value.split(' - ');
  return parts.length === 2 && isClockTime(parts[0]) && isClockTime(parts[1])
    && minutesSinceMidnight(parts[1]) > minutesSinceMidnight(parts[0]);
}
