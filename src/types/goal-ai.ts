import type { LocalDateString } from './date-time';
import type {
  GoalPlanActionRequest,
  GoalPlanScheduleRequest,
  GoalPlanScheduleResponse,
} from './goal-plan';
import type { GoalJourneyItem, GoalJourneyRange, GoalJourneySummary } from './goal-journey';

/** Unsaved suggestions only. Persist through separate Goal/Plan APIs after user review. */
export type GoalDraftRequest = { description: string; targetDate?: LocalDateString | null };
export type GoalDraftResponse = {
  title: string;
  desiredOutcome: string | null;
  motivationText: string | null;
  targetDate: LocalDateString | null;
};
export type GoalPlanDraftRequest = { description: string; schedule: GoalPlanScheduleRequest };
export type GoalPlanDraftResponse = {
  goalId: number;
  goalVersion: number;
  name: string;
  triggerText: string | null;
  schedule: GoalPlanScheduleRequest;
  standardAction: GoalPlanActionRequest;
  minimumAction: GoalPlanActionRequest;
  nextAction: string | null;
};
export type GoalAdjustmentDraftRequest = { planId: number; description: string };
export type GoalAdjustmentDraftResponse = Omit<GoalPlanDraftResponse, 'schedule'> & {
  planId: number;
  planVersion: number;
  schedule: GoalPlanScheduleResponse;
};
/** Inclusive 1–366 days. Raw journeyVersion from the matching real journey query. */
export type GoalJourneySummaryRequest = {
  from: LocalDateString;
  to: LocalDateString;
  timeZone?: string | null;
  expectedJourneyVersion?: string | null;
};
export type GoalJourneySummaryResponse = {
  goalId: number;
  range: GoalJourneyRange;
  journeyVersion: string;
  summary: GoalJourneySummary;
  overview: string;
  highlights: GoalJourneyItem[];
  evidenceCount: number;
  evidenceTruncated: boolean;
};
