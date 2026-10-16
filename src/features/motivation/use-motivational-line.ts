import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { motivationalLines } from './motivational-lines';

const REFRESH_AFTER_MS = 4 * 60 * 60 * 1000;
const RECENT_LIMIT = 7;
type Rotation = { index: number; shownAt: number; day: string; recent: number[] };

function getLocalDay(now: Date) {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function initialRotation(): Rotation {
  const now = new Date();
  const dayNumber = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000,
  );
  const index = dayNumber % motivationalLines.length;
  return { index, shownAt: now.getTime(), day: getLocalDay(now), recent: [index] };
}

export function useMotivationalLine(visitKey: string) {
  const [rotation, setRotation] = useState(initialRotation);
  const refresh = useCallback((manual: boolean) => {
    const now = new Date();
    setRotation((current) => {
      if (
        !manual &&
        current.day === getLocalDay(now) &&
        now.getTime() - current.shownAt < REFRESH_AFTER_MS
      )
        return current;
      const recent = new Set(current.recent);
      let index = (current.index + 1) % motivationalLines.length;
      for (let offset = 1; offset <= motivationalLines.length; offset += 1) {
        const candidate = (current.index + offset) % motivationalLines.length;
        if (!recent.has(candidate)) {
          index = candidate;
          break;
        }
      }
      return {
        index,
        shownAt: now.getTime(),
        day: getLocalDay(now),
        recent: [...current.recent, index].slice(-RECENT_LIMIT),
      };
    });
  }, []);

  useEffect(() => {
    refresh(false);
  }, [visitKey, refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh(false);
    });
    return () => subscription.remove();
  }, [refresh]);

  return { line: motivationalLines[rotation.index], showNext: () => refresh(true) };
}
