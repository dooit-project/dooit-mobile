import type { TaskResponse } from '@/types';

export const TODAY_SCHEDULE_PREVIEW_COUNT = 2;
export const TODAY_COMPLETED_PREVIEW_COUNT = 3;

export function splitTodayTasks(tasks: TaskResponse[]) {
  const scheduleIds = new Set<number>();

  return {
    scheduleTasks: tasks.filter((task) => {
      if (task.type !== 'SCHEDULE' || scheduleIds.has(task.id)) {
        return false;
      }

      scheduleIds.add(task.id);
      return true;
    }),
    executionTasks: tasks.filter((task) => task.type !== 'SCHEDULE'),
  };
}

export function getTodaySchedulePreview(tasks: TaskResponse[]) {
  return tasks.slice(0, TODAY_SCHEDULE_PREVIEW_COUNT);
}

export function getTodayCompletedPreview(tasks: TaskResponse[]) {
  return sortTodayCompletedTasks(tasks).slice(0, TODAY_COMPLETED_PREVIEW_COUNT);
}

export function sortTodayCompletedTasks(tasks: TaskResponse[]) {
  return [...tasks].sort((left, right) =>
    (right.completedAt ?? '').localeCompare(left.completedAt ?? ''),
  );
}
