import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';

import { getMillisecondsUntilNextAppDate, toApiLocalDate } from '@/utils/date-time';

const listeners = new Set<() => void>();
let stopClock: (() => void) | null = null;

function startClock() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const isActive = () =>
    AppState.currentState !== 'background' &&
    AppState.currentState !== 'inactive' &&
    !(Platform.OS === 'web' && typeof document !== 'undefined' && document.hidden);
  const refresh = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    for (const listener of listeners) listener();
    if (isActive()) {
      // A little grace avoids firing just before the clock crosses midnight.
      timer = setTimeout(refresh, getMillisecondsUntilNextAppDate() + 25);
    }
  };
  const appState = AppState.addEventListener('change', refresh);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
  }
  refresh();
  return () => {
    if (timer !== undefined) clearTimeout(timer);
    appState.remove();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    }
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stopClock) stopClock = startClock();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      stopClock?.();
      stopClock = null;
    }
  };
}

const getToday = () => toApiLocalDate();

/** One clock shared by mounted screens, using the API's Asia/Seoul date. */
export function useAppToday() {
  return useSyncExternalStore(subscribe, getToday, getToday);
}
