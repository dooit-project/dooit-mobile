import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';

import { motivationalLines } from './motivational-lines';
import { refreshStoredMotivation } from './motivation-preferences-store';
import { useMotivationPreferences } from './use-motivation-preferences';

export function useMotivationalLine(visitKey: string) {
  const { scope, state } = useMotivationPreferences();
  const refresh = useCallback(
    (manual: boolean) => {
      if (scope) void refreshStoredMotivation(scope, manual);
    },
    [scope],
  );

  useEffect(() => {
    if (state.ready && !state.loadError) refresh(false);
  }, [visitKey, state.ready, state.loadError, state.value.mode, refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') refresh(false);
    });
    return () => subscription.remove();
  }, [refresh]);

  const line =
    state.ready && !state.loadError && state.value.mode !== 'hidden'
      ? (motivationalLines.find((candidate) => candidate.id === state.value.rotation?.lineId) ??
        null)
      : null;
  return { line, showNext: () => refresh(true) };
}
