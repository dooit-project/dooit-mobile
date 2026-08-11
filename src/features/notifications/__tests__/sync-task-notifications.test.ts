import type { TaskNotificationCandidateResponse, TaskResponse } from '@/types';

import {
  cancelManagedTaskNotifications,
  getTaskNotificationFingerprint,
  MAX_SCHEDULED_TASK_NOTIFICATIONS,
  reconcileTaskNotifications,
} from '../sync-task-notifications';

const task: TaskResponse = {
  id: 1,
  title: '병원 예약',
  description: null,
  category: null,
  type: 'SCHEDULE',
  status: 'TODAY',
  plannedDate: '2026-08-12',
  targetDate: '2026-08-12',
  unscheduled: false,
  allDay: false,
  startAt: '2026-08-12T09:00:00',
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
  createdAt: '2026-08-11T08:00:00',
  updatedAt: null,
};

function candidate(
  overrides: Partial<TaskNotificationCandidateResponse> = {},
): TaskNotificationCandidateResponse {
  return {
    notificationKey: 'task:1',
    taskId: 1,
    scheduledAt: '2026-08-12T09:00:00',
    recurrenceSeriesId: null,
    occurrenceDate: null,
    suppressLocalNotification: false,
    task,
    ...overrides,
  };
}

describe('task notification reconciliation', () => {
  it('기존 ToDoLab 예약을 갱신하고 현재 후보를 예약한다', async () => {
    const cancel = jest.fn().mockResolvedValue(undefined);
    const schedule = jest.fn().mockResolvedValue(undefined);

    await expect(
      reconcileTaskNotifications(
        [candidate()],
        {
          getScheduled: jest.fn().mockResolvedValue([
            { identifier: 'task:1', source: 'todolab-task' },
            { identifier: 'other-app', source: 'other' },
          ]),
          cancel,
          schedule,
        },
        new Date('2026-08-11T12:00:00'),
      ),
    ).resolves.toEqual({ cancelled: 1, scheduled: 1, kept: 0 });

    expect(cancel).toHaveBeenCalledWith('task:1');
    expect(cancel).not.toHaveBeenCalledWith('other-app');
    expect(schedule).toHaveBeenCalledWith(candidate());
  });

  it('서버 push 억제 후보와 과거 후보는 예약하지 않는다', async () => {
    const schedule = jest.fn().mockResolvedValue(undefined);

    await expect(
      reconcileTaskNotifications(
        [
          candidate({ suppressLocalNotification: true }),
          candidate({ notificationKey: 'task:2', scheduledAt: '2026-08-10T09:00:00' }),
        ],
        {
          getScheduled: jest.fn().mockResolvedValue([]),
          cancel: jest.fn().mockResolvedValue(undefined),
          schedule,
        },
        new Date('2026-08-11T12:00:00'),
      ),
    ).resolves.toEqual({ cancelled: 0, scheduled: 0, kept: 0 });

    expect(schedule).not.toHaveBeenCalled();
  });

  it('오늘 종일 일정은 자정이 지났어도 오전 9시 전이면 예약한다', async () => {
    const schedule = jest.fn().mockResolvedValue(undefined);
    const allDayCandidate = candidate({
      scheduledAt: '2026-08-11T00:00:00',
      task: {
        ...task,
        allDay: true,
        startAt: '2026-08-11T00:00:00',
      },
    });

    await expect(
      reconcileTaskNotifications(
        [allDayCandidate],
        {
          getScheduled: jest.fn().mockResolvedValue([]),
          cancel: jest.fn().mockResolvedValue(undefined),
          schedule,
        },
        new Date('2026-08-11T08:00:00'),
      ),
    ).resolves.toEqual({ cancelled: 0, scheduled: 1, kept: 0 });

    expect(schedule).toHaveBeenCalledWith(allDayCandidate);
  });

  it('fingerprint가 같은 기존 예약은 취소하거나 다시 예약하지 않는다', async () => {
    const currentCandidate = candidate();
    const cancel = jest.fn().mockResolvedValue(undefined);
    const schedule = jest.fn().mockResolvedValue(undefined);

    await expect(
      reconcileTaskNotifications(
        [currentCandidate],
        {
          getScheduled: jest.fn().mockResolvedValue([
            {
              identifier: currentCandidate.notificationKey,
              source: 'todolab-task',
              fingerprint: getTaskNotificationFingerprint(currentCandidate),
            },
          ]),
          cancel,
          schedule,
        },
        new Date('2026-08-11T12:00:00'),
      ),
    ).resolves.toEqual({ cancelled: 0, scheduled: 0, kept: 1 });

    expect(cancel).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });

  it('전달 시각이 가까운 후보부터 최대 예약 수만 유지한다', async () => {
    const schedule = jest.fn().mockResolvedValue(undefined);
    const candidates = Array.from({ length: MAX_SCHEDULED_TASK_NOTIFICATIONS + 2 }, (_, index) => {
      const date = new Date('2026-08-12T09:00:00');
      date.setMinutes(date.getMinutes() + index);
      const scheduledAt = date
        .toISOString()
        .slice(0, 19) as TaskNotificationCandidateResponse['scheduledAt'];
      return candidate({
        notificationKey: `task:${index + 1}`,
        taskId: index + 1,
        scheduledAt,
        task: { ...task, id: index + 1, startAt: scheduledAt },
      });
    }).reverse();

    await expect(
      reconcileTaskNotifications(
        candidates,
        {
          getScheduled: jest.fn().mockResolvedValue([]),
          cancel: jest.fn().mockResolvedValue(undefined),
          schedule,
        },
        new Date('2026-08-11T12:00:00'),
      ),
    ).resolves.toEqual({
      cancelled: 0,
      scheduled: MAX_SCHEDULED_TASK_NOTIFICATIONS,
      kept: 0,
    });

    expect(schedule).toHaveBeenCalledTimes(MAX_SCHEDULED_TASK_NOTIFICATIONS);
    expect(schedule.mock.calls[0]?.[0].notificationKey).toBe('task:1');
    expect(schedule).not.toHaveBeenCalledWith(
      expect.objectContaining({ notificationKey: `task:${MAX_SCHEDULED_TASK_NOTIFICATIONS + 1}` }),
    );
  });

  it('후보에서 사라진 기존 ToDoLab 예약을 취소한다', async () => {
    const cancel = jest.fn().mockResolvedValue(undefined);

    await reconcileTaskNotifications([], {
      getScheduled: jest
        .fn()
        .mockResolvedValue([{ identifier: 'recurrence:3:2026-08-12', source: 'todolab-task' }]),
      cancel,
      schedule: jest.fn().mockResolvedValue(undefined),
    });

    expect(cancel).toHaveBeenCalledWith('recurrence:3:2026-08-12');
  });

  it('로그아웃 시 다른 source 예약은 유지하고 ToDoLab 예약만 제거한다', async () => {
    const cancel = jest.fn().mockResolvedValue(undefined);

    await expect(
      cancelManagedTaskNotifications({
        getScheduled: jest.fn().mockResolvedValue([
          { identifier: 'task:1', source: 'todolab-task' },
          { identifier: 'other', source: 'other-app' },
        ]),
        cancel,
      }),
    ).resolves.toBe(1);

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith('task:1');
  });
});
