import { getTodayWeekDateLabel } from '../today-week-strip';

describe('getTodayWeekDateLabel', () => {
  it('shows only the day inside the same month', () => {
    expect(getTodayWeekDateLabel('2026-08-21')).toBe('21');
  });

  it('shows the month at a month boundary', () => {
    expect(getTodayWeekDateLabel('2026-09-01')).toBe('9/1');
  });
});
