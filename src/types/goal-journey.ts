import type { LocalDateString, LocalDateTimeString } from './date-time';
import type { GoalActionVariant, GoalPracticeDifficulty } from './goal-plan';

export const goalDirectLogLimits = { title: 120, note: 1000, idempotencyKey: 160 } as const;

/** PATCH also replaces all four fields. Omitted timezone defaults to Asia/Seoul. */
export type GoalDirectLogRequest = {
  practicedDate: LocalDateString;
  practicedTimeZone?: string | null;
  title: string;
  note?: string | null;
};
export type GoalDirectLogResponse = {
  id: number;
  goalId: number;
  goalVersion: number;
  practicedDate: LocalDateString;
  practicedTimeZone: string;
  title: string;
  note: string | null;
  createdAt: LocalDateTimeString;
  updatedAt: LocalDateTimeString | null;
  canceledAt: LocalDateTimeString | null;
};
export type GoalJourneySourceType = 'PLAN_OCCURRENCE' | 'TASK_COMPLETION' | 'DIRECT_LOG';
/** Unlike occurrence queries, journey ranges are not limited to 31 days. */
export type GoalJourneyQuery = {
  from: LocalDateString;
  to: LocalDateString;
  timeZone?: string;
  cursor?: string;
  /** 1–100; default 50. */
  limit?: number;
};
export type GoalJourneyRange = { from: LocalDateString; to: LocalDateString; timeZone: string };
/** Counts cover the entire requested range, independently of the current page. */
export type GoalJourneySummary = {
  practiceOccurrenceCount: number;
  oneOffCompletionCount: number;
  directLogCount: number;
  practiceDateCount: number;
  standardCount: number;
  minimumCount: number;
  unknownCount: number;
  restCount: number;
  noRecordOccurrenceCount: number;
};
export type GoalJourneyItem = {
  sourceType: GoalJourneySourceType;
  sourceId: number;
  practicedDate: LocalDateString;
  goalId: number | null;
  goalVersion: number | null;
  planId: number | null;
  planVersion: number | null;
  title: string;
  actionText: string | null;
  actionVariant: GoalActionVariant;
  note: string | null;
  taskId: number | null;
  serviceDate: LocalDateString | null;
  practicedAt: LocalDateTimeString | null;
  practicedTimeZone: string;
  snapshotGoalTitle: string | null;
  nextAction: string | null;
  difficulties: GoalPracticeDifficulty[];
};
export type GoalJourneyResponse = {
  goalId: number;
  range: GoalJourneyRange;
  summary: GoalJourneySummary;
  items: GoalJourneyItem[];
  nextCursor: string | null;
  /** Opaque server value; cursor source changes return 409/70008. */
  journeyVersion: string;
};
