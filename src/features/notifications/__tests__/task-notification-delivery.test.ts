import type { TaskNotificationCandidateResponse, TaskResponse } from '@/types';

import { getTaskNotificationDelivery } from '../task-notification-delivery';

const task: TaskResponse = {
  id: 1,
  title: '건강검진',
  description: null,
  category: null,
  type: 'SCHEDULE',
  status: 'TODAY',
  plannedDate: '2026-08-13',
  targetDate: '2026-08-13',
  unscheduled: false,
  allDay: false,
  startAt: '2026-08-13T14:30:00',
  endAt: null,
  todayOrder: 1,
  completedAt: null,
  carryOverCount: 0,
  staleCarryOver: false,
  deferReason: null,
  deferReasonLabel: null,
  ddayGoalId: null,
  ddayGoalTitle: null,
  ddayGoalTargetDate: null,
  ddayDaysLeft: null,
  createdAt: '2026-08-12T10:00:00',
  updatedAt: null,
};

function candidate(
  overrides: Partial<TaskNotificationCandidateResponse> = {},
): TaskNotificationCandidateResponse {
  return {
    notificationKey: 'task:1',
    taskId: 1,
    scheduledAt: '2026-08-13T14:30:00',
    recurrenceSeriesId: null,
    occurrenceDate: null,
    suppressLocalNotification: false,
    task,
    ...overrides,
  };
}

describe('task notification delivery', () => {
  it('시간 일정은 시작 시각과 시작 문구를 사용한다', () => {
    const delivery = getTaskNotificationDelivery(candidate());

    expect(delivery).toMatchObject({
      title: '건강검진',
      body: '일정을 시작할 시간이에요.',
    });
    expect(delivery?.date.getHours()).toBe(14);
    expect(delivery?.date.getMinutes()).toBe(30);
  });

  it('종일 일정은 자정 대신 해당 날짜 오전 9시에 알린다', () => {
    const delivery = getTaskNotificationDelivery(
      candidate({
        scheduledAt: '2026-08-13T00:00:00',
        task: {
          ...task,
          allDay: true,
          startAt: '2026-08-13T00:00:00',
        },
      }),
    );

    expect(delivery).toMatchObject({
      title: '건강검진',
      body: '오늘 예정된 종일 일정이에요.',
    });
    expect(delivery?.date.getHours()).toBe(9);
    expect(delivery?.date.getMinutes()).toBe(0);
  });

  it('유효하지 않은 예약 시각은 사용하지 않는다', () => {
    expect(getTaskNotificationDelivery(candidate({ scheduledAt: 'invalid' as never }))).toBeNull();
  });
});
