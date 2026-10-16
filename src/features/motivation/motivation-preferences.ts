import { isLocalDateString, toApiLocalDate } from '@/utils';

import { motivationalLines } from './motivational-lines';

export type MotivationMode = 'standard' | 'daily' | 'hidden';
export type MotivationRotation = {
  lineId: string;
  shownAt: number;
  day: string;
  recentIds: string[];
};
export type MotivationPreferences = { mode: MotivationMode; rotation: MotivationRotation | null };

const lineIds = new Set(motivationalLines.map((line) => line.id));
const REFRESH_AFTER_MS = 4 * 60 * 60 * 1000;

export function normalizeMotivationPreferences(value: unknown): MotivationPreferences {
  const candidate: Partial<MotivationPreferences> =
    value && typeof value === 'object' ? (value as Partial<MotivationPreferences>) : {};
  const mode =
    candidate.mode === 'daily' || candidate.mode === 'hidden' ? candidate.mode : 'standard';
  const rotation = candidate.rotation;
  if (
    !rotation ||
    !lineIds.has(rotation.lineId) ||
    !Number.isFinite(rotation.shownAt) ||
    rotation.shownAt < 0 ||
    typeof rotation.day !== 'string' ||
    !isLocalDateString(rotation.day)
  ) {
    return { mode, rotation: null };
  }
  return {
    mode,
    rotation: {
      lineId: rotation.lineId,
      shownAt: rotation.shownAt,
      day: rotation.day,
      recentIds: Array.isArray(rotation.recentIds)
        ? rotation.recentIds.filter((id) => lineIds.has(id)).slice(-7)
        : [rotation.lineId],
    },
  };
}

export function refreshMotivationPreferences(
  current: MotivationPreferences,
  manual: boolean,
  now = new Date(),
): MotivationPreferences {
  if (current.mode === 'hidden') return current;
  const day = toApiLocalDate(now);
  const previous = current.rotation;
  if (
    previous &&
    !manual &&
    previous.day === day &&
    (current.mode === 'daily' || now.getTime() - previous.shownAt < REFRESH_AFTER_MS)
  )
    return current;

  const dayNumber = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000,
  );
  let index = dayNumber % motivationalLines.length;
  if (previous) {
    const currentIndex = motivationalLines.findIndex((line) => line.id === previous.lineId);
    const recent = new Set([...previous.recentIds, previous.lineId]);
    index = (currentIndex + 1) % motivationalLines.length;
    for (let offset = 1; offset <= motivationalLines.length; offset += 1) {
      const candidate = (currentIndex + offset) % motivationalLines.length;
      if (!recent.has(motivationalLines[candidate].id)) {
        index = candidate;
        break;
      }
    }
  }
  const lineId = motivationalLines[index].id;
  return {
    ...current,
    rotation: {
      lineId,
      day,
      shownAt: now.getTime(),
      recentIds: [...(previous?.recentIds ?? []), lineId].slice(-7),
    },
  };
}
