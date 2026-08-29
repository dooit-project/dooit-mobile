import type { TaskNotificationCandidateResponse, TaskResponse } from '@/types';

import {
  cancelManagedWorkspaceNotifications,
  createWorkspaceNotificationCandidate,
  getWorkspaceNotificationFingerprint,
  reconcileWorkspaceNotifications,
} from '../sync-workspace-notifications';

const task: TaskResponse = {
  id: 11,
  title: '공유 출시 점검',
  description: null,
  category: null,
  type: 'SCHEDULE',
  status: 'TODAY',
  plannedDate: '2026-08-20',
  targetDate: '2026-08-20',
  unscheduled: false,
  allDay: false,
  startAt: '2026-08-20T09:00:00',
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
  createdAt: '2026-08-19T08:00:00',
  updatedAt: null,
};

const candidate: TaskNotificationCandidateResponse = {
  notificationKey: 'task:11',
  taskId: 11,
  scheduledAt: '2026-08-20T09:00:00',
  recurrenceSeriesId: null,
  occurrenceDate: null,
  suppressLocalNotification: false,
  task,
};

describe('Workspace 알림 동기화', () => {
  test('계정과 Workspace를 포함한 식별자로 예약한다', async () => {
    const item = createWorkspaceNotificationCandidate(7, 3, candidate);
    const schedule = jest.fn().mockResolvedValue(undefined);

    await expect(
      reconcileWorkspaceNotifications(
        [item],
        {
          getScheduled: jest.fn().mockResolvedValue([]),
          cancel: jest.fn().mockResolvedValue(undefined),
          schedule,
        },
        new Date('2026-08-19T12:00:00'),
      ),
    ).resolves.toEqual({ cancelled: 0, scheduled: 1, kept: 0 });

    expect(item.identifier).toBe('workspace:7:3:task:11');
    expect(schedule).toHaveBeenCalledWith(item);
  });

  test('다른 계정·Workspace 예약과 현재 fingerprint를 구분한다', async () => {
    const item = createWorkspaceNotificationCandidate(7, 3, candidate);
    const cancel = jest.fn().mockResolvedValue(undefined);
    const schedule = jest.fn().mockResolvedValue(undefined);

    await expect(
      reconcileWorkspaceNotifications(
        [item],
        {
          getScheduled: jest.fn().mockResolvedValue([
            {
              identifier: item.identifier,
              source: 'dooit-workspace-task',
              fingerprint: getWorkspaceNotificationFingerprint(item),
            },
            {
              identifier: 'workspace:8:3:task:11',
              source: 'dooit-workspace-task',
            },
            { identifier: 'task:11', source: 'dooit-task' },
          ]),
          cancel,
          schedule,
        },
        new Date('2026-08-19T12:00:00'),
      ),
    ).resolves.toEqual({ cancelled: 1, scheduled: 0, kept: 1 });

    expect(cancel).toHaveBeenCalledWith('workspace:8:3:task:11');
    expect(cancel).not.toHaveBeenCalledWith('task:11');
    expect(schedule).not.toHaveBeenCalled();
  });

  test('Workspace source 예약만 일괄 취소한다', async () => {
    const cancel = jest.fn().mockResolvedValue(undefined);

    await expect(
      cancelManagedWorkspaceNotifications({
        getScheduled: jest.fn().mockResolvedValue([
          { identifier: 'workspace:7:3:task:11', source: 'dooit-workspace-task' },
          { identifier: 'task:11', source: 'dooit-task' },
        ]),
        cancel,
      }),
    ).resolves.toBe(1);

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith('workspace:7:3:task:11');
  });

  test('억제되거나 지난 후보는 예약하지 않는다', async () => {
    const schedule = jest.fn().mockResolvedValue(undefined);
    const suppressed = createWorkspaceNotificationCandidate(7, 3, {
      ...candidate,
      suppressLocalNotification: true,
    });
    const past = createWorkspaceNotificationCandidate(7, 3, {
      ...candidate,
      notificationKey: 'task:12',
      scheduledAt: '2026-08-18T09:00:00',
      task: { ...task, id: 12, startAt: '2026-08-18T09:00:00' },
    });

    await expect(
      reconcileWorkspaceNotifications(
        [suppressed, past],
        {
          getScheduled: jest.fn().mockResolvedValue([]),
          cancel: jest.fn().mockResolvedValue(undefined),
          schedule,
        },
        new Date('2026-08-19T12:00:00'),
      ),
    ).resolves.toEqual({ cancelled: 0, scheduled: 0, kept: 0 });

    expect(schedule).not.toHaveBeenCalled();
  });
});
