import { Platform } from 'react-native';

import { taskApi } from '@/features/tasks/task-api';
import type { TaskNotificationCandidateResponse } from '@/types';
import { shiftLocalDate, toApiLocalDate } from '@/utils';

import { getTaskNotificationDelivery } from './task-notification-delivery';

const NOTIFICATION_SOURCE = 'todolab-task';
const NOTIFICATION_WINDOW_DAYS = 30;

type ScheduledTaskNotification = {
  identifier: string;
  source?: unknown;
};

type NotificationReconcileDependencies = {
  getScheduled: () => Promise<ScheduledTaskNotification[]>;
  cancel: (identifier: string) => Promise<void>;
  schedule: (candidate: TaskNotificationCandidateResponse) => Promise<void>;
};

type NotificationCancelDependencies = {
  getScheduled: () => Promise<ScheduledTaskNotification[]>;
  cancel: (identifier: string) => Promise<void>;
};

export async function cancelManagedTaskNotifications(
  dependencies?: NotificationCancelDependencies,
) {
  if (!dependencies && Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return 0;
  }

  const resolvedDependencies = dependencies ?? (await createNativeNotificationCancelDependencies());
  const scheduled = await resolvedDependencies.getScheduled();
  const managed = scheduled.filter((notification) => notification.source === NOTIFICATION_SOURCE);

  await Promise.all(
    managed.map((notification) => resolvedDependencies.cancel(notification.identifier)),
  );
  return managed.length;
}

export async function reconcileTaskNotifications(
  candidates: TaskNotificationCandidateResponse[],
  dependencies: NotificationReconcileDependencies,
  now = new Date(),
) {
  const desired = candidates.filter((candidate) => {
    const delivery = getTaskNotificationDelivery(candidate);
    return (
      !candidate.suppressLocalNotification &&
      Boolean(delivery && delivery.date.getTime() > now.getTime())
    );
  });
  const scheduled = await dependencies.getScheduled();
  const managed = scheduled.filter((notification) => notification.source === NOTIFICATION_SOURCE);

  await Promise.all(managed.map((notification) => dependencies.cancel(notification.identifier)));
  await Promise.all(desired.map((candidate) => dependencies.schedule(candidate)));

  return { cancelled: managed.length, scheduled: desired.length };
}

export async function syncUpcomingTaskNotifications(now = new Date()) {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return { cancelled: 0, scheduled: 0 };
  }

  const from = toApiLocalDate(now);
  const to = shiftLocalDate(from, NOTIFICATION_WINDOW_DAYS);
  if (!to) {
    return { cancelled: 0, scheduled: 0 };
  }

  const Notifications = await import('expo-notifications');
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    return { cancelled: 0, scheduled: 0 };
  }

  const candidates = await taskApi.getNotificationCandidates(from, to);
  return reconcileTaskNotifications(
    candidates,
    {
      getScheduled: async () => {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        return scheduled.map((notification) => ({
          identifier: notification.identifier,
          source: notification.content.data?.source,
        }));
      },
      cancel: (identifier) => Notifications.cancelScheduledNotificationAsync(identifier),
      schedule: async (candidate) => {
        const delivery = getTaskNotificationDelivery(candidate);
        if (!delivery) {
          return;
        }

        await Notifications.scheduleNotificationAsync({
          identifier: candidate.notificationKey,
          content: {
            title: delivery.title,
            body: delivery.body,
            data: {
              source: NOTIFICATION_SOURCE,
              taskId: candidate.taskId,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: delivery.date,
            channelId: Platform.OS === 'android' ? 'tasks' : undefined,
          },
        });
      },
    },
    now,
  );
}

async function createNativeNotificationCancelDependencies(): Promise<NotificationCancelDependencies> {
  const Notifications = await import('expo-notifications');

  return {
    getScheduled: async () => {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled.map((notification) => ({
        identifier: notification.identifier,
        source: notification.content.data?.source,
      }));
    },
    cancel: (identifier) => Notifications.cancelScheduledNotificationAsync(identifier),
  };
}
