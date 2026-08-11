import type { TaskResponse } from '@/types';

type NotificationPermissionPromptInput = {
  platform: string;
  notificationPermissionPrompted: boolean;
  task: TaskResponse;
  now?: Date;
};

export function shouldPromptForNotificationPermission({
  platform,
  notificationPermissionPrompted,
  task,
  now = new Date(),
}: NotificationPermissionPromptInput) {
  if (platform !== 'android' && platform !== 'ios') {
    return false;
  }

  if (notificationPermissionPrompted || task.status !== 'TODAY' || task.completedAt) {
    return false;
  }

  if (task.recurrenceException === 'SKIPPED' || !task.startAt) {
    return false;
  }

  const scheduledAt = new Date(task.startAt).getTime();
  return Number.isFinite(scheduledAt) && scheduledAt > now.getTime();
}
