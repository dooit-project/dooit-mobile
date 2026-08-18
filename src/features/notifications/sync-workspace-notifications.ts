import { Platform } from 'react-native';

import { workspaceApi } from '@/features/workspaces/workspace-api';
import { getWorkspaceNotificationIdentifier } from '@/features/workspaces/workspace-notification-policy';
import { workspaceTaskApi } from '@/features/workspaces/workspace-task-api';
import { authApi } from '@/services/api';
import type { TaskNotificationCandidateResponse } from '@/types';
import { shiftLocalDate, toApiLocalDate } from '@/utils';

import { getTaskNotificationDelivery } from './task-notification-delivery';

const NOTIFICATION_SOURCE = 'todolab-workspace-task';
const NOTIFICATION_WINDOW_DAYS = 30;
export const MAX_SCHEDULED_WORKSPACE_NOTIFICATIONS = 50;

export type WorkspaceNotificationCandidate = {
  accountId: number;
  workspaceId: number;
  identifier: string;
  candidate: TaskNotificationCandidateResponse;
};

type ScheduledWorkspaceNotification = {
  identifier: string;
  source?: unknown;
  fingerprint?: unknown;
};

type ReconcileDependencies = {
  getScheduled: () => Promise<ScheduledWorkspaceNotification[]>;
  cancel: (identifier: string) => Promise<void>;
  schedule: (candidate: WorkspaceNotificationCandidate) => Promise<void>;
};

type CancelDependencies = Pick<ReconcileDependencies, 'getScheduled' | 'cancel'>;

export function createWorkspaceNotificationCandidate(
  accountId: number,
  workspaceId: number,
  candidate: TaskNotificationCandidateResponse,
): WorkspaceNotificationCandidate {
  return {
    accountId,
    workspaceId,
    identifier: getWorkspaceNotificationIdentifier({
      accountId,
      workspaceId,
      notificationKey: candidate.notificationKey,
    }),
    candidate,
  };
}

export function getWorkspaceNotificationFingerprint(item: WorkspaceNotificationCandidate) {
  const delivery = getTaskNotificationDelivery(item.candidate);
  return delivery
    ? JSON.stringify([
        delivery.date.getTime(),
        delivery.title,
        delivery.body,
        item.accountId,
        item.workspaceId,
        item.candidate.taskId,
      ])
    : '';
}

export async function reconcileWorkspaceNotifications(
  candidates: WorkspaceNotificationCandidate[],
  dependencies: ReconcileDependencies,
  now = new Date(),
) {
  const desired = new Map<string, { item: WorkspaceNotificationCandidate; fingerprint: string }>();

  candidates
    .map((item) => ({ item, delivery: getTaskNotificationDelivery(item.candidate) }))
    .filter(
      ({ item, delivery }) =>
        !item.candidate.suppressLocalNotification &&
        Boolean(delivery && delivery.date.getTime() > now.getTime()),
    )
    .sort(
      (left, right) =>
        left.delivery!.date.getTime() - right.delivery!.date.getTime() ||
        left.item.identifier.localeCompare(right.item.identifier),
    )
    .slice(0, MAX_SCHEDULED_WORKSPACE_NOTIFICATIONS)
    .forEach(({ item }) => {
      desired.set(item.identifier, {
        item,
        fingerprint: getWorkspaceNotificationFingerprint(item),
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
  await Promise.all([...pending.values()].map(({ item }) => dependencies.schedule(item)));

  return {
    cancelled: stale.length,
    scheduled: pending.size,
    kept: managed.length - stale.length,
  };
}

export async function cancelManagedWorkspaceNotifications(dependencies?: CancelDependencies) {
  if (!dependencies && Platform.OS !== 'android' && Platform.OS !== 'ios') return 0;

  const resolved = dependencies ?? (await createNativeCancelDependencies());
  const scheduled = await resolved.getScheduled();
  const managed = scheduled.filter((notification) => notification.source === NOTIFICATION_SOURCE);
  await Promise.all(managed.map((notification) => resolved.cancel(notification.identifier)));
  return managed.length;
}

export async function syncUpcomingWorkspaceNotifications(now = new Date()) {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return { cancelled: 0, scheduled: 0, kept: 0 };
  }

  const from = toApiLocalDate(now);
  const to = shiftLocalDate(from, NOTIFICATION_WINDOW_DAYS);
  if (!to) return { cancelled: 0, scheduled: 0, kept: 0 };

  const Notifications = await import('expo-notifications');
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) return { cancelled: 0, scheduled: 0, kept: 0 };

  const account = await authApi.me();
  if (account.accountType !== 'REGISTERED') {
    await cancelManagedWorkspaceNotifications();
    return { cancelled: 0, scheduled: 0, kept: 0 };
  }

  const workspaces = await workspaceApi.list();
  const candidates = (
    await Promise.all(
      workspaces.map(async (workspace) => {
        const items = await workspaceTaskApi.getNotificationCandidates(workspace.id, from, to);
        return items.map((candidate) =>
          createWorkspaceNotificationCandidate(account.id, workspace.id, candidate),
        );
      }),
    )
  ).flat();

  return reconcileWorkspaceNotifications(candidates, {
    getScheduled: async () => {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled.map((notification) => ({
        identifier: notification.identifier,
        source: notification.content.data?.source,
        fingerprint: notification.content.data?.fingerprint,
      }));
    },
    cancel: (identifier) => Notifications.cancelScheduledNotificationAsync(identifier),
    schedule: async (item) => {
      const delivery = getTaskNotificationDelivery(item.candidate);
      if (!delivery) return;

      await Notifications.scheduleNotificationAsync({
        identifier: item.identifier,
        content: {
          title: delivery.title,
          body: delivery.body,
          data: {
            source: NOTIFICATION_SOURCE,
            accountId: item.accountId,
            workspaceId: item.workspaceId,
            taskId: item.candidate.taskId,
            fingerprint: getWorkspaceNotificationFingerprint(item),
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: delivery.date,
          channelId: Platform.OS === 'android' ? 'tasks' : undefined,
        },
      });
    },
  });
}

async function createNativeCancelDependencies(): Promise<CancelDependencies> {
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
