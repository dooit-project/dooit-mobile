import type { GoalPlanOccurrenceResponse } from '@/types';
import { APP_TIME_ZONE, toApiLocalDateTime } from '@/utils';

import type { GoalOccurrenceChange } from '@/features/goals/goal-occurrence-change';

/** An explicit user selection is required; the linked Task title is not evidence of a variant. */
export function createTodayGoalPracticeChange(
  occurrence: GoalPlanOccurrenceResponse,
  variant: 'STANDARD' | 'MINIMUM',
  practicedAt: Date,
): GoalOccurrenceChange {
  if (occurrence.status !== 'PENDING') {
    throw new Error('이미 기록된 행동은 먼저 기록을 취소해 주세요.');
  }
  return {
    type: 'result',
    occurrence: { id: occurrence.id, occurrenceVersion: occurrence.occurrenceVersion },
    request: {
      actionVariant: variant,
      practicedAt: toApiLocalDateTime(practicedAt),
      practicedTimeZone: APP_TIME_ZONE,
      nextActionPatchKind: 'KEEP',
    },
  };
}

/** Unknown historical results must never be promoted to a known amount. */
export function getRecordedGoalPracticeText(occurrence: GoalPlanOccurrenceResponse) {
  if (occurrence.status !== 'PRACTICED' || !occurrence.result) return null;
  if (occurrence.result.actionVariant === 'STANDARD') return occurrence.snapshotStandardActionText;
  if (occurrence.result.actionVariant === 'MINIMUM') return occurrence.snapshotMinimumActionText;
  return null;
}
