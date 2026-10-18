import { parseApiLocalDateTime } from '@/utils';

import { ApiClientError } from './api-error';

export function mockGoalWallTime(instant: Date, timeZone: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
}

/** Mock-only LocalDateTime.atZone conversion; production timezone authority remains the server. */
export function mockGoalInstant(wallTime: string, timeZone: string) {
  const parsed = parseApiLocalDateTime(wallTime);
  if (!parsed)
    throw new ApiClientError('실천 시각을 확인해 주세요.', {
      kind: 'http',
      status: 400,
      code: 10001,
    });
  // parseApiLocalDateTime reads Seoul wall-clock. Add its offset to obtain a UTC-shaped wall value.
  const wall = Math.floor((parsed.getTime() + 9 * 60 * 60 * 1000) / 1000) * 1000;
  const offsets = [-1, 0, 1].map((day) => {
    const instant = wall + day * 86400000;
    const formatted = mockGoalWallTime(new Date(instant), timeZone);
    return Date.parse(`${formatted}Z`) - instant;
  });
  const candidates = [...new Set(offsets)].map((offset) => wall - offset);
  const matching = candidates.filter(
    (candidate) =>
      mockGoalWallTime(new Date(candidate), timeZone) === new Date(wall).toISOString().slice(0, 19),
  );
  // Earlier offset during overlap; move forward through a gap, matching ordinary atZone behavior.
  return new Date(matching.length ? Math.min(...matching) : Math.max(...candidates));
}

export function mockGoalToday(timeZone: string) {
  return mockGoalWallTime(new Date(), timeZone).slice(0, 10);
}
