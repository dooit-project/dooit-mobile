import type { TaskResponse } from '@/types';
import { buildTaskScheduleUpdate, getScheduleEndDayOffset } from '../task-schedule-update';

const task = {
  id: 4,
  title: '원래 제목',
  type: 'SCHEDULE',
  description: '원문 설명',
  category: '학습',
  estimatedDurationMinutes: 25,
  linkedGoalId: 7,
  allDay: false,
  startAt: '2026-10-27T14:00:00',
  endAt: '2026-10-27T14:30:00',
  notificationEnabled: true,
  notifyAt: '2026-10-27T12:37:00',
  recurrenceSeriesId: 3,
  recurrenceRule: 'FREQ=WEEKLY;BYDAY=TU,TH',
} as TaskResponse;
const input = { date: '2026-10-29', startTime: '15:00', endTime: '15:30', allDay: false };

test('날짜·시간만 바꾸고 원문/메뉴 밖 알림 시간차를 보존하며 반복·목표 변경을 요청하지 않는다', () => {
  const result = buildTaskScheduleUpdate(task, input);
  expect(result).toEqual({
    ok: true,
    request: {
      title: task.title,
      type: task.type,
      description: task.description,
      category: task.category,
      estimatedDurationMinutes: 25,
      allDay: false,
      startAt: '2026-10-29T15:00:00',
      endAt: '2026-10-29T15:30:00',
      notificationEnabled: true,
      notifyAt: '2026-10-29T13:37:00',
    },
  });
  if (result.ok) {
    expect(result.request).not.toHaveProperty('recurrence');
    expect(result.request).not.toHaveProperty('linkedGoalId');
    expect(result.request).not.toHaveProperty('plannedDate');
  }
});

test('꺼둔 알림을 종일 전환으로 켜지 않으며 기존 종일 exclusive 기간을 유지한다', () => {
  expect(
    buildTaskScheduleUpdate(
      { ...task, notificationEnabled: false },
      { ...input, allDay: true, endDayOffset: 3 },
    ),
  ).toMatchObject({
    ok: true,
    request: {
      allDay: true,
      startAt: '2026-10-29T00:00:00',
      endAt: '2026-11-01T00:00:00',
      notificationEnabled: false,
      notifyAt: null,
    },
  });
});

test('밤을 넘기는 일정과 여러 날 일정의 종료 날짜를 잃지 않는다', () => {
  const source = { ...task, endAt: '2026-10-29T02:00:00' };
  const endDayOffset = getScheduleEndDayOffset(source);
  expect(endDayOffset).toBe(2);
  expect(
    buildTaskScheduleUpdate(source, { ...input, endTime: '02:00', endDayOffset }),
  ).toMatchObject({
    ok: true,
    request: { startAt: '2026-10-29T15:00:00', endAt: '2026-10-31T02:00:00' },
  });
});

test('같은 날의 잘못된 종료와 존재하지 않는 날짜는 제출을 막는다', () => {
  expect(buildTaskScheduleUpdate(task, { ...input, endTime: '13:00' })).toMatchObject({
    ok: false,
    field: 'endTime',
  });
  expect(buildTaskScheduleUpdate(task, { ...input, date: '2026-02-30' })).toMatchObject({
    ok: false,
    field: 'date',
  });
});
