import type { TaskNotificationCandidateResponse } from '@/types';

export type TaskNotificationDelivery = {
  title: string;
  body: string;
  date: Date;
};

export function getTaskNotificationDelivery(
  candidate: TaskNotificationCandidateResponse,
): TaskNotificationDelivery | null {
  const date = new Date(candidate.scheduledAt);
  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  if (candidate.task.allDay) {
    date.setHours(9, 0, 0, 0);
    return {
      title: candidate.task.title,
      body: '오늘 예정된 종일 일정이에요.',
      date,
    };
  }

  return {
    title: candidate.task.title,
    body: '일정을 시작할 시간이에요.',
    date,
  };
}
