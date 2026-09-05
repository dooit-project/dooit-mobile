import type { TaskResponse } from '@/types';

export const MAX_ESTIMATED_DURATION_MINUTES = 1440;
export const MIN_ESTIMATED_DURATION_MINUTES = 5;

export function parseEstimatedDurationMinutes(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return { ok: true as const, value: null };
  }

  if (!/^\d+$/.test(normalized)) {
    return { ok: false as const };
  }

  const minutes = Number(normalized);
  if (minutes < MIN_ESTIMATED_DURATION_MINUTES || minutes > MAX_ESTIMATED_DURATION_MINUTES) {
    return { ok: false as const };
  }

  return { ok: true as const, value: minutes };
}

export function getTotalEstimatedDurationMinutes(tasks: TaskResponse[]) {
  return tasks.reduce((total, task) => {
    const minutes = task.estimatedDurationMinutes;
    return total + (minutes && minutes > 0 ? minutes : 0);
  }, 0);
}

export function formatEstimatedDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}분`;
  if (remainingMinutes === 0) return `${hours}시간`;
  return `${hours}시간 ${remainingMinutes}분`;
}
