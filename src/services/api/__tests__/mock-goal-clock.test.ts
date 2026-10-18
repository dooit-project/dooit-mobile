import { toApiLocalDateTime } from '@/utils';

import { mockGoalInstant } from '../mock-goal-clock';

describe('Mock Goal wall-clock conversion', () => {
  it.each([
    ['2026-10-18T01:30:00', 'America/New_York', '2026-10-18T14:30:00'],
    ['2026-11-01T01:30:00', 'America/New_York', '2026-11-01T14:30:00'],
    ['2026-03-08T02:30:00', 'America/New_York', '2026-03-08T16:30:00'],
    ['2026-10-18T00:30:00', 'Asia/Seoul', '2026-10-18T00:30:00'],
  ])('converts %s in %s to %s, including DST overlap/gap', (wallTime, zone, expected) => {
    expect(toApiLocalDateTime(mockGoalInstant(wallTime, zone))).toBe(expected);
  });
});
