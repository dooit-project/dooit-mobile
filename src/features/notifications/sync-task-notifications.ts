import { Platform } from 'react-native';

import { taskApi } from '@/features/tasks/task-api';
import type { TaskNotificationCandidateResponse } from '@/types';
import { shiftLocalDate, toApiLocalDate } from '@/utils';

import { getTaskNotificationDelivery } from './task-notification-delivery';

const NOTIFICATION_SOURCE = 'dooit-task';
const NOTIFICATION_WINDOW_DAYS = 30;
export const MAX_SCHEDULED_TASK_NOTIFICATIONS = 50;

type ScheduledTaskNotification = {
  identifier: string;
  source?: unknown;
  fingerprint?: unknown;
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
  const desired = new Map<
    string,
    { candidate: TaskNotificationCandidateResponse; fingerprint: string }
  >();
  candidates
    .map((candidate) => ({ candidate, delivery: getTaskNotificationDelivery(candidate) }))
    .filter(
      ({ candidate, delivery }) =>
        !candidate.suppressLocalNotification &&
        Boolean(delivery && delivery.date.getTime() > now.getTime()),
    )
    .sort(
      (left, right) =>
        left.delivery!.date.getTime() - right.delivery!.date.getTime() ||
        left.candidate.notificationKey.localeCompare(right.candidate.notificationKey),
    )
    .slice(0, MAX_SCHEDULED_TASK_NOTIFICATIONS)
    .forEach(({ candidate }) => {
      desired.set(candidate.notificationKey, {
        candidate,
        fingerprint: getTaskNotificationFingerprint(candidate),
      });
    });
  const scheduled = await dependencies.getScheduled();
  const managed = scheduled.filter((notification) => notification.source === NOTIFICATION_SOURCE);
  const pending = new Map(desired);
  const stale = managed.filter((notification) => {
    const expected = desired.get(notification.identifier);
    if (expected && notification.fingerprint === expected.fingerprint) {
      pending.delete(notification.identifier);
      return false;
    }
    return true;
  });

  await Promise.all(stale.map((notification) => dependencies.cancel(notification.identifier)));
  await Promise.all([...pending.values()].map(({ candidate }) => dependencies.schedule(candidate)));

  return {
    cancelled: stale.length,
    scheduled: pending.size,
    kept: managed.length - stale.length,
  };
}

export function getTaskNotificationFingerprint(candidate: TaskNotificationCandidateResponse) {
  const delivery = getTaskNotificationDelivery(candidate);
  return delivery
    ? JSON.stringify([
        delivery.date.getTime(),
        delivery.title,
        delivery.body,
        candidate.taskId,
        candidate.notifyAt ?? null,
      ])
    : '';
}

export async function syncUpcomingTaskNotifications(now = new Date()) {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return { cancelled: 0, scheduled: 0, kept: 0 };
  }

  const from = toApiLocalDate(now);
  const to = shiftLocalDate(from, NOTIFICATION_WINDOW_DAYS);
  if (!to) {
    return { cancelled: 0, scheduled: 0, kept: 0 };
  }

  const Notifications = await import('expo-notifications');
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    return { cancelled: 0, scheduled: 0, kept: 0 };
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
          fingerprint: notification.content.data?.fingerprint,
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
              fingerprint: getTaskNotificationFingerprint(candidate),
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
        fingerprint: notification.content.data?.fingerprint,
      }));
    },
    cancel: (identifier) => Notifications.cancelScheduledNotificationAsync(identifier),
  };
}
