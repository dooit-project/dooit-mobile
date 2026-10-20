import type { GoalPlanOccurrenceResponse, GoalPracticeResultRequest } from '@/types';

import { goalOccurrenceApi } from './goal-occurrence-api';

type Occurrence = Pick<GoalPlanOccurrenceResponse, 'id' | 'occurrenceVersion'>;
type WithoutVersion<T> = T extends unknown ? Omit<T, 'occurrenceVersion'> : never;
export type GoalOccurrenceChange =
  | {
      type: 'result';
      occurrence: Occurrence;
      request: WithoutVersion<GoalPracticeResultRequest>;
    }
  | { type: 'cancel-result' | 'rest' | 'cancel-rest'; occurrence: Occurrence };

/** Use the version the user saw. Never retry a stale version or infer a result variant. */
export async function changeGoalOccurrence(change: GoalOccurrenceChange) {
  const { id, occurrenceVersion } = change.occurrence;
  if (change.type === 'result')
    return goalOccurrenceApi.saveResult(id, { ...change.request, occurrenceVersion });
  if (change.type === 'cancel-result')
    return goalOccurrenceApi.cancelResult(id, { occurrenceVersion });
  if (change.type === 'rest') return goalOccurrenceApi.rest(id, { occurrenceVersion });
  return goalOccurrenceApi.cancelRest(id, { occurrenceVersion });
}
