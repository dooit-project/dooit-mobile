import type { TaskResponse } from '@/types';

import type { NotificationPermissionState } from './notification-settings';

type NotificationPermissionPromptInput = {
  platform: string;
  notificationPermissionPrompted: boolean;
  permissionState?: NotificationPermissionState;
  task: TaskResponse;
  now?: Date;
};

export function shouldPromptForNotificationPermission({
  platform,
  notificationPermissionPrompted,
  permissionState = 'undetermined',
  task,
  now = new Date(),
}: NotificationPermissionPromptInput) {
  if (platform !== 'android' && platform !== 'ios') {
    return false;
  }

  if (
    notificationPermissionPrompted ||
    permissionState !== 'undetermined' ||
    task.status !== 'TODAY' ||
    task.completedAt
  ) {
    return false;
  }

  if (task.recurrenceException === 'SKIPPED' || !task.startAt) {
    return false;
  }

  const scheduledAt = new Date(task.startAt).getTime();
  return Number.isFinite(scheduledAt) && scheduledAt > now.getTime();
}
