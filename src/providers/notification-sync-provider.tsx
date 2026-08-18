import type { PropsWithChildren } from 'react';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { AppState, Platform } from 'react-native';

import {
  cancelManagedTaskNotifications,
  cancelManagedWorkspaceNotifications,
  initializeTaskNotificationResponses,
  subscribeTaskNotificationSync,
  syncUpcomingTaskNotifications,
  syncUpcomingWorkspaceNotifications,
} from '@/features/notifications';
import { getAccessToken, subscribeAccessToken } from '@/services/api';

type NotificationSync = () => Promise<unknown>;

export function createNotificationSyncRunner(sync: NotificationSync) {
  let inFlight: Promise<void> | null = null;

  return () => {
    if (inFlight) {
      return inFlight;
    }

    inFlight = sync()
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  };
}

export function NotificationSyncProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const runSync = useMemo(
    () =>
      createNotificationSyncRunner(async () => {
        await Promise.all([syncUpcomingTaskNotifications(), syncUpcomingWorkspaceNotifications()]);
      }),
    [],
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    void runSync();
    const unsubscribeTaskChanges = subscribeTaskNotificationSync(() => {
      void runSync();
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void runSync();
      }
    });

    return () => {
      unsubscribeTaskChanges();
      subscription.remove();
    };
  }, [runSync]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let currentToken = getAccessToken();
    return subscribeAccessToken((nextToken) => {
      if (nextToken === currentToken) {
        return;
      }

      const hadPreviousAccount = Boolean(currentToken);
      currentToken = nextToken;

      if (hadPreviousAccount) {
        void Promise.all([cancelManagedTaskNotifications(), cancelManagedWorkspaceNotifications()])
          .catch(() => undefined)
          .then(() => {
            if (nextToken) {
              return runSync();
            }
          });
      } else if (nextToken) {
        void runSync();
      }
    });
  }, [runSync]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void initializeTaskNotificationResponses(
      (taskId) => {
        router.push({ pathname: '/tasks/[taskId]', params: { taskId: String(taskId) } } as Href);
      },
      (workspaceId) => {
        router.push({
          pathname: '/workspaces/[workspaceId]',
          params: { workspaceId: String(workspaceId) },
        } as Href);
      },
    )
      .then((nextCleanup) => {
        if (disposed) {
          nextCleanup();
        } else {
          cleanup = nextCleanup;
        }
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [router]);

  return children;
}
