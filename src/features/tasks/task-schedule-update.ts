import type { TaskResponse, TaskUpsertRequest } from '@/types';
import { parseApiLocalDateTime, toApiLocalDateTime } from '@/utils';

import { normalizeScheduleFormInput, type ScheduleFormInput } from './task-form-schedule';

export function getScheduleEndDayOffset(task: TaskResponse) {
  if (!task.startAt || !task.endAt) return 0;
  const start = Date.parse(`${task.startAt.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${task.endAt.slice(0, 10)}T00:00:00Z`);
  return Number.isFinite(end - start) ? Math.max(0, Math.round((end - start) / 86_400_000)) : 0;
}

/** PUT is a full replacement. Preserve unrelated fields and omit recurrence rule edits. */
export function buildTaskScheduleUpdate(task: TaskResponse, input: ScheduleFormInput) {
  const schedule = normalizeScheduleFormInput(input);
  if (!schedule.ok) return schedule;
  let notifyAt = null;
  if (task.notificationEnabled !== false && !schedule.allDay && task.notifyAt && task.startAt) {
    const previousStart = parseApiLocalDateTime(task.startAt);
    const previousNotify = parseApiLocalDateTime(task.notifyAt);
    const nextStart = parseApiLocalDateTime(schedule.startAt);
    if (previousStart && previousNotify && nextStart) {
      notifyAt = toApiLocalDateTime(
        new Date(nextStart.getTime() + previousNotify.getTime() - previousStart.getTime()),
      );
    }
  }
  const request: TaskUpsertRequest = {
    title: task.title,
    description: task.description,
    type: task.type,
    category: task.category,
    estimatedDurationMinutes: task.estimatedDurationMinutes,
    allDay: schedule.allDay,
    startAt: schedule.startAt,
    endAt: schedule.endAt,
    notificationEnabled: task.notificationEnabled ?? true,
    notifyAt,
    // linkedGoalId omission preserves the link, including recurrence-generated goal tasks.
    // recurrence omission preserves the series. Non-null rules are rejected by the PUT API.
  };
  return { ok: true as const, request };
}
