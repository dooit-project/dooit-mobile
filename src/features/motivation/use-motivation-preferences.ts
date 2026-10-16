import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { env } from '@/config';
import { useAuthState } from '@/features/auth/use-auth-state';

import {
  getMotivationSnapshot,
  initializeMotivation,
  pendingMotivationSnapshot,
  subscribeMotivation,
} from './motivation-preferences-store';

export function useMotivationPreferences() {
  const auth = useAuthState();
  const scope =
    auth.status === 'guest' || auth.status === 'registered'
      ? JSON.stringify([env.apiMode, env.apiUrl ?? null, auth.user.id])
      : null;
  const subscribe = useCallback(
    (listener: () => void) => (scope ? subscribeMotivation(scope, listener) : () => {}),
    [scope],
  );
  const snapshot = useCallback(
    () => (scope ? getMotivationSnapshot(scope) : pendingMotivationSnapshot),
    [scope],
  );
  const state = useSyncExternalStore(subscribe, snapshot, () => pendingMotivationSnapshot);
  useEffect(() => {
    if (scope) void initializeMotivation(scope);
  }, [scope]);
  return { scope, state, accountError: auth.status === 'error' ? auth.error.message : null };
}
