import type { TaskResponse } from '@/types';
import { getTaskScheduleLabel } from '../task-schedule-label';

const schedule = {
  startAt: '2026-10-29T09:00:00',
  endAt: '2026-10-31T18:00:00',
  allDay: false,
  unscheduled: false,
} as TaskResponse;

test('여러 날 일정은 시작과 종료 날짜·시각을 모두 표시한다', () => {
  expect(getTaskScheduleLabel(schedule)).toBe('10월 29일 (목) 09:00 - 10월 31일 (토) 18:00');
});

test('같은 날 일정은 기존처럼 종료 시각만 표시한다', () => {
  expect(getTaskScheduleLabel({ ...schedule, endAt: '2026-10-29T18:00:00' })).toBe(
    '10월 29일 (목) 09:00 - 18:00',
  );
});

test('여러 날 종일 일정은 배타적인 자정 종료를 전날로 표시한다', () => {
  expect(
    getTaskScheduleLabel({
      ...schedule,
      allDay: true,
      startAt: '2026-10-29T00:00:00',
      endAt: '2026-11-01T00:00:00',
    }),
  ).toBe('10월 29일 (목) - 10월 31일 (토) · 종일');
});

test('연도가 바뀌는 일정은 양쪽 연도를 표시한다', () => {
  expect(
    getTaskScheduleLabel({
      ...schedule,
      startAt: '2026-12-31T23:00:00',
      endAt: '2027-01-01T01:00:00',
    }),
  ).toContain('2027년');
});

test('시각이 있는 자정 종료는 다음 날짜와 자정 시각을 표시한다', () => {
  expect(getTaskScheduleLabel({ ...schedule, endAt: '2026-10-30T00:00:00' })).toBe(
    '10월 29일 (목) 09:00 - 10월 30일 (금) 00:00',
  );
});

test('하루 종일 일정과 날짜가 없는 할 일의 기존 문구를 유지한다', () => {
  expect(
    getTaskScheduleLabel({
      ...schedule,
      allDay: true,
      startAt: '2026-10-29T00:00:00',
      endAt: '2026-10-30T00:00:00',
    }),
  ).toBe('종일');
  expect(getTaskScheduleLabel({ ...schedule, startAt: null, endAt: null, unscheduled: true })).toBe(
    '시간 미정',
  );
});
