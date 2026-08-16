import {
  getWorkspaceNotificationIdentifier,
  shouldScheduleWorkspaceNotifications,
} from '@/features/workspaces/workspace-notification-policy';

describe('Workspace 알림 정책', () => {
  test('계정·workspace를 알림 식별자에 포함한다', () => {
    expect(
      getWorkspaceNotificationIdentifier({
        accountId: 7,
        workspaceId: 3,
        notificationKey: 'task:11',
      }),
    ).toBe('workspace:7:3:task:11');

    expect(
      getWorkspaceNotificationIdentifier({
        accountId: 8,
        workspaceId: 3,
        notificationKey: 'task:11',
      }),
    ).not.toBe('workspace:7:3:task:11');
  });

  test('Android와 iOS에서만 로컬 예약을 허용한다', () => {
    expect(shouldScheduleWorkspaceNotifications('android')).toBe(true);
    expect(shouldScheduleWorkspaceNotifications('ios')).toBe(true);
    expect(shouldScheduleWorkspaceNotifications('web')).toBe(false);
  });
});
