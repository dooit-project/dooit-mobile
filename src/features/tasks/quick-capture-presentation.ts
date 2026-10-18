import type { LocalDateString, TaskQuickCaptureResponse } from '@/types';
import { formatDateLabel, isLocalDateString, isLocalDateTimeString, toApiLocalDate } from '@/utils';

import { getRecurrenceLabel } from './recurrence-presentation';

const taskObjects = { TODO: '할 일을', SCHEDULE: '일정을', IDEA: '아이디어를' } as const;

/** Parser metadata describes an interpretation; only task describes what was saved. */
export function getQuickCaptureResultMessage(
  response: TaskQuickCaptureResponse,
  today: LocalDateString = toApiLocalDate(),
) {
  const { task } = response;
  if (task.status === 'DONE') return `${taskObjects[task.type]} 완료 기록에 저장했어요.`;
  if (task.status === 'INBOX') return `${taskObjects[task.type]} 기록함에 저장했어요.`;
  if (task.type === 'IDEA') return '아이디어로 저장했어요.';

  const startAt = task.startAt && isLocalDateTimeString(task.startAt) ? task.startAt : null;
  const savedDate =
    task.type === 'SCHEDULE' && startAt
      ? startAt.slice(0, 10)
      : task.plannedDate && isLocalDateString(task.plannedDate)
        ? task.plannedDate
        : null;
  const dateLabel = savedDate
    ? formatDateLabel(savedDate, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  if (task.type === 'TODO') {
    if (savedDate === today) return '오늘 할 일에 저장했어요.';
    return dateLabel ? `${dateLabel} 할 일로 저장했어요.` : '할 일로 저장했어요.';
  }

  const parts = [
    dateLabel,
    task.allDay ? '종일' : startAt?.slice(11, 16),
    getRecurrenceLabel(task),
  ].filter(Boolean);
  return parts.length ? `${parts.join(' · ')} 일정으로 저장했어요.` : '일정으로 저장했어요.';
}
