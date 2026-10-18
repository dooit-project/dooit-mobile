import { taskQueryKeys } from '@/features/tasks';
import type { TaskResponse } from '@/types';
import { shiftLocalDate, toApiLocalDate } from '@/utils';

import { dedupeCalendarDayTasks, getCalendarDayQueryKeys } from '../calendar-day-query';
import {
  getCalendarMonthStarts,
  getMonthCalendarDates,
  getThreeWeekCalendarDates,
  getWeekDates,
} from '../calendar-date';

describe('Today와 Calendar 날짜 일관성', () => {
  it('서울 자정 전후 instant를 서로 다른 로컬 날짜로 계산한다', () => {
    expect(toApiLocalDate(new Date('2026-06-28T14:59:59.999Z'))).toBe('2026-06-28');
    expect(toApiLocalDate(new Date('2026-06-28T15:00:00.000Z'))).toBe('2026-06-29');
  });

  it('Today에서 계산한 날짜를 주간·월간 Calendar가 그대로 포함한다', () => {
    const date = toApiLocalDate(new Date('2026-06-28T15:00:00.000Z'));

    expect(getWeekDates(date)).toContain(date);
    expect(getMonthCalendarDates(date)).toContain(date);
  });

  it('Calendar가 Today와 완료 목록의 동일한 날짜 query key를 재사용한다', () => {
    const date = toApiLocalDate(new Date('2026-06-28T15:00:00.000Z'));
    const tomorrow = shiftLocalDate(date, 1);
    const calendarKeys = getCalendarDayQueryKeys(date);

    expect(calendarKeys.scheduled).toEqual(taskQueryKeys.today(date));
    expect(calendarKeys.done).toEqual(taskQueryKeys.done(date));
    expect(tomorrow).not.toBeNull();
    expect(getCalendarDayQueryKeys(tomorrow!).scheduled).not.toEqual(calendarKeys.scheduled);
  });
});

describe('Calendar 선택 날짜 일정 중복 방지', () => {
  it('범위 일정이 같은 ID로 반복되어도 한 번만 유지한다', () => {
    const task = {
      id: 1,
      type: 'SCHEDULE',
      title: '기간 일정',
    } as TaskResponse;

    expect(dedupeCalendarDayTasks([task, { ...task }])).toEqual([task]);
  });
});

describe('3주 달력의 월 조회 범위', () => {
  it('월초에 보이는 이전 달도 포함하고 날짜를 옮겨도 같은 월 key를 사용한다', () => {
    expect(getCalendarMonthStarts(getThreeWeekCalendarDates('2026-10-01'))).toEqual([
      '2026-09-01',
      '2026-10-01',
    ]);
    expect(getCalendarMonthStarts(getThreeWeekCalendarDates('2026-10-02'))).toEqual([
      '2026-09-01',
      '2026-10-01',
    ]);
  });

  it('연말의 다음 해 날짜를 포함하고 잘못된 날짜는 조회하지 않는다', () => {
    expect(getCalendarMonthStarts(getThreeWeekCalendarDates('2026-12-31'))).toEqual([
      '2026-12-01',
      '2027-01-01',
    ]);
    expect(getCalendarMonthStarts(['잘못된 날짜', '2026-02-30'])).toEqual([]);
  });
});
