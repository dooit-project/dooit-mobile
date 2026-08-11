import type { TaskResponse } from '@/types';

import { shouldPromptForNotificationPermission } from '../notification-permission-policy';

const futureSchedule: TaskResponse = {
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
  recurrenceException: null,
  createdAt: '2026-08-11T08:00:00',
  updatedAt: null,
};

const now = new Date('2026-08-11T12:00:00');

describe('notification permission policy', () => {
  it.each(['android', 'ios'])('%s에서 미래 일정 저장 후 처음 한 번만 안내한다', (platform) => {
    expect(
      shouldPromptForNotificationPermission({
        platform,
        notificationPermissionPrompted: false,
        task: futureSchedule,
        now,
      }),
    ).toBe(true);

    expect(
      shouldPromptForNotificationPermission({
        platform,
        notificationPermissionPrompted: true,
        task: futureSchedule,
        now,
      }),
    ).toBe(false);
  });

  it('Web과 최초 실행에서는 OS 권한 안내를 열지 않는다', () => {
    expect(
      shouldPromptForNotificationPermission({
        platform: 'web',
        notificationPermissionPrompted: false,
        task: futureSchedule,
        now,
      }),
    ).toBe(false);
  });

  it.each(['granted', 'denied', 'unsupported'] as const)(
    'OS 권한 상태가 %s이면 저장 후 안내를 반복하지 않는다',
    (permissionState) => {
      expect(
        shouldPromptForNotificationPermission({
          platform: 'android',
          notificationPermissionPrompted: false,
          permissionState,
          task: futureSchedule,
          now,
        }),
      ).toBe(false);
    },
  );

  it.each([
    ['시간이 없는 Task', { startAt: null }],
    ['Inbox Task', { status: 'INBOX' as const }],
    ['완료 Task', { status: 'DONE' as const, completedAt: '2026-08-11T10:00:00' as const }],
    ['건너뛴 occurrence', { recurrenceException: 'SKIPPED' as const }],
    ['과거 일정', { startAt: '2026-08-10T09:00:00' as const }],
  ])('%s에는 안내하지 않는다', (_label, overrides) => {
    expect(
      shouldPromptForNotificationPermission({
        platform: 'android',
        notificationPermissionPrompted: false,
        task: { ...futureSchedule, ...overrides },
        now,
      }),
    ).toBe(false);
  });
});
