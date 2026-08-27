import type { LocalDateTimeString, TaskResponse } from '@/types';
import { parseApiLocalDateTime, toApiLocalDateTime } from '@/utils';

export type TaskNotificationTiming = 'OFF' | 'AT_START' | '5' | '10' | '15' | '30' | '60';

export const taskNotificationTimingOptions: {
  value: TaskNotificationTiming;
  label: string;
}[] = [
  { value: 'OFF', label: '알림 끄기' },
  { value: 'AT_START', label: '시작 시각' },
  { value: '5', label: '5분 전' },
  { value: '10', label: '10분 전' },
  { value: '15', label: '15분 전' },
  { value: '30', label: '30분 전' },
  { value: '60', label: '1시간 전' },
];

export function getInitialTaskNotificationTiming(
  task?: Pick<TaskResponse, 'notificationEnabled' | 'notifyAt' | 'startAt'>,
): TaskNotificationTiming {
  if (task?.notificationEnabled === false) return 'OFF';
  if (!task?.notifyAt || !task.startAt) return 'AT_START';

  const start = parseApiLocalDateTime(task.startAt);
  const notify = parseApiLocalDateTime(task.notifyAt);
  if (!start || !notify) return 'AT_START';

  const minutes = Math.round((start.getTime() - notify.getTime()) / 60_000);
  const value = String(minutes) as TaskNotificationTiming;
  return taskNotificationTimingOptions.some((option) => option.value === value)
    ? value
    : 'AT_START';
}

export function buildTaskNotificationFields(
  timing: TaskNotificationTiming,
  startAt: LocalDateTimeString,
  allDay: boolean,
) {
  if (timing === 'OFF') {
    return { notificationEnabled: false, notifyAt: null } as const;
  }

  if (timing === 'AT_START' || allDay) {
    return { notificationEnabled: true, notifyAt: null } as const;
  }

  const start = parseApiLocalDateTime(startAt);
  if (!start) {
    return { notificationEnabled: true, notifyAt: null } as const;
  }

  start.setMinutes(start.getMinutes() - Number(timing));
  return {
    notificationEnabled: true,
    notifyAt: toApiLocalDateTime(start),
  } as const;
}
