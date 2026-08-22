import type { TaskQuickCaptureResponse } from '@/types';
import { formatDateLabel } from '@/utils';

const recurrenceLabels = {
  DAILY: '매일 반복',
  WEEKLY: '매주 반복',
  MONTHLY: '매월 반복',
  YEARLY: '매년 반복',
} as const;

export function getQuickCaptureResultMessage(response: TaskQuickCaptureResponse) {
  if (response.task.status === 'TODAY') {
    return '오늘 할 일에 저장했어요.';
  }

  if (!response.parsed) {
    return '날짜 정보 없이 기록함에 저장했어요.';
  }

  const parts = [
    response.parsedDate
      ? formatDateLabel(response.parsedDate, { year: 'numeric', month: 'long', day: 'numeric' })
      : null,
    response.parsedTime ? response.parsedTime.slice(0, 5) : null,
    response.parsedRecurrenceFrequency
      ? recurrenceLabels[response.parsedRecurrenceFrequency]
      : null,
  ].filter(Boolean);

  return parts.length > 0
    ? `${parts.join(' · ')} 일정으로 저장했어요.`
    : '입력한 내용을 일정으로 저장했어요.';
}
