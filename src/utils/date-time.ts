import type { LocalDateString, LocalDateTimeString } from '@/types';

export const APP_TIME_ZONE = 'Asia/Seoul';
export const API_TIME_ZONE_OFFSET = '+09:00';

const localDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const localDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/;

const apiDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function getNumericParts(date: Date) {
  const parts = apiDateTimeFormatter.formatToParts(date);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function isValidDateParts(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function isLocalDateString(value: string): value is LocalDateString {
  const match = localDatePattern.exec(value);

  if (!match) {
    return false;
  }

  return isValidDateParts(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function isLocalDateTimeString(value: string): value is LocalDateTimeString {
  const match = localDateTimePattern.exec(value);

  if (!match) {
    return false;
  }

  const [, year, month, day, hour, minute, second = '0'] = match;

  return (
    isValidDateParts(Number(year), Number(month), Number(day)) &&
    Number(hour) >= 0 &&
    Number(hour) <= 23 &&
    Number(minute) >= 0 &&
    Number(minute) <= 59 &&
    Number(second) >= 0 &&
    Number(second) <= 59
  );
}

export function toApiLocalDate(date: Date = new Date()): LocalDateString {
  const { year, month, day } = getNumericParts(date);

  return `${year}-${month}-${day}`;
}

export function toApiLocalDateTime(date: Date): LocalDateTimeString {
  const { year, month, day, hour, minute, second } = getNumericParts(date);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export function parseApiLocalDate(value: LocalDateString) {
  const match = localDatePattern.exec(value);

  if (!match || !isLocalDateString(value)) {
    return null;
  }

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), -9));
}

export function parseApiLocalDateTime(value: LocalDateTimeString) {
  const match = localDateTimePattern.exec(value);

  if (!match || !isLocalDateTimeString(value)) {
    return null;
  }

  const [, year, month, day, hour, minute, second = '0', fraction = '0'] = match;
  const milliseconds = Number(fraction.padEnd(3, '0').slice(0, 3));

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) - 9,
      Number(minute),
      Number(second),
      milliseconds,
    ),
  );
}

export function shiftLocalDate(value: LocalDateString, days: number): LocalDateString | null {
  const match = localDatePattern.exec(value);

  if (!match || !isLocalDateString(value)) {
    return null;
  }

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days, 12),
  );

  return [
    String(date.getUTCFullYear()).padStart(4, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

export function getMillisecondsUntilNextAppDate(now: Date = new Date()) {
  const nextDate = shiftLocalDate(toApiLocalDate(now), 1);
  const midnight = nextDate ? parseApiLocalDate(nextDate) : null;
  return midnight ? Math.max(1, midnight.getTime() - now.getTime()) : 60_000;
}

export function formatDateLabel(
  value: LocalDateString,
  options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  },
) {
  const date = parseApiLocalDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    ...options,
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

export function formatTimeLabel(value: LocalDateTimeString) {
  const date = parseApiLocalDateTime(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: APP_TIME_ZONE,
  }).format(date);
}
