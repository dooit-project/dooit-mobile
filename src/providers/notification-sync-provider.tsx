import type { PropsWithChildren } from 'react';
import { useEffect, useMemo } from 'react';
import { AppState, Platform } from 'react-native';

import { syncUpcomingTaskNotifications } from '@/features/notifications';

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
  const runSync = useMemo(() => createNotificationSyncRunner(syncUpcomingTaskNotifications), []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    void runSync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void runSync();
      }
    });

    return () => subscription.remove();
  }, [runSync]);

  return children;
}
