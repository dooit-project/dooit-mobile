import type { LocalDateString, LocalDateTimeString } from './date-time';

export type GoalPlanStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type GoalScheduleDay = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
export type GoalOccurrenceStatus = 'PENDING' | 'PRACTICED' | 'RESTED';
export type GoalActionVariant = 'STANDARD' | 'MINIMUM' | 'UNKNOWN';
export type GoalNextActionPatchKind = 'KEEP' | 'CLEAR' | 'REPLACE';
export type GoalPracticeDifficulty =
  | 'NO_TIME'
  | 'UNCLEAR_FIRST_ACTION'
  | 'TOO_HEAVY'
  | 'FORGOT'
  | 'OTHER';

export const goalPlanLimits = {
  name: 120,
  triggerText: 200,
  actionText: 500,
  targetAmount: 100,
  nextAction: 300,
  accomplishedNote: 1000,
  estimatedMinutes: 1440,
  occurrenceRangeDays: 31,
} as const;

export type GoalPlanActionRequest = {
  text: string;
  targetAmount?: string | null;
  estimatedMinutes?: number | null;
};
export type GoalPlanActionResponse = {
  text: string;
  targetAmount: string | null;
  estimatedMinutes: number | null;
};
export type GoalPlanScheduleRequest = {
  startDate: LocalDateString;
  days: GoalScheduleDay[];
  /** IANA zone; omission defaults to Asia/Seoul. */
  timeZone?: string | null;
  /** LocalTime, for example 20:30:00. No notification if omitted. */
  notifyAtTime?: string | null;
};
export type GoalPlanScheduleResponse = {
  startDate: LocalDateString;
  days: GoalScheduleDay[];
  timeZone: string;
  notifyAtTime: string | null;
};
export type GoalPlanCreateRequest = {
  goalId?: number | null;
  name: string;
  triggerText?: string | null;
  schedule: GoalPlanScheduleRequest;
  standardAction: GoalPlanActionRequest;
  minimumAction: GoalPlanActionRequest;
  nextAction?: string | null;
};
/** Full content replacement, including null/omitted goalId becoming independent. */
export type GoalPlanUpdateRequest = GoalPlanCreateRequest & {
  effectiveFromDate?: LocalDateString | null;
};
export type GoalPlanStatusRequest = { status: GoalPlanStatus };
export type GoalPlanListQuery = { goalId?: number; independentOnly?: boolean };
export type GoalPlanResponse = {
  id: number;
  goalId: number | null;
  status: GoalPlanStatus;
  currentVersion: number;
  name: string;
  triggerText: string | null;
  schedule: GoalPlanScheduleResponse;
  standardAction: GoalPlanActionResponse;
  minimumAction: GoalPlanActionResponse;
  nextAction: string | null;
  archivedAt: LocalDateTimeString | null;
  createdAt: LocalDateTimeString;
  updatedAt: LocalDateTimeString | null;
};

/** Inclusive 1–31 days. GET materializes occurrences and may synchronize linked Tasks. */
export type GoalOccurrenceListQuery = {
  from: LocalDateString;
  to: LocalDateString;
  goalId?: number;
};
export type GoalOccurrenceVersionQuery = { occurrenceVersion?: number };

type GoalNextActionPatch =
  | { nextActionPatchKind?: 'KEEP' | 'CLEAR' | null; nextAction?: null }
  | { nextActionPatchKind: 'REPLACE'; nextAction: string };

export type GoalPracticeResultRequest = GoalNextActionPatch & {
  actionVariant: GoalActionVariant;
  practicedAt: LocalDateTimeString;
  practicedTimeZone?: string | null;
  accomplishedNote?: string | null;
  difficulties?: GoalPracticeDifficulty[] | null;
  occurrenceVersion?: number | null;
};
export type GoalPracticeResultResponse = {
  occurrenceId: number;
  actionVariant: GoalActionVariant;
  practicedAt: LocalDateTimeString;
  practicedTimeZone: string;
  accomplishedNote: string | null;
  difficulties: GoalPracticeDifficulty[];
  nextActionPatchKind: GoalNextActionPatchKind;
  nextAction: string | null;
  createdAt: LocalDateTimeString;
  updatedAt: LocalDateTimeString | null;
  occurrenceVersion: number;
};
export type GoalPlanOccurrenceResponse = {
  id: number;
  goalId: number | null;
  goalVersion: number | null;
  planId: number;
  planVersion: number;
  serviceDate: LocalDateString;
  timeZone: string;
  status: GoalOccurrenceStatus;
  linkedTaskId: number | null;
  notificationKey: string;
  /** Local wall-clock in occurrence.timeZone, not necessarily the API's usual Seoul zone. */
  scheduledNotificationAt: LocalDateTimeString | null;
  snapshotGoalTitle: string | null;
  snapshotPlanName: string;
  snapshotTriggerText: string | null;
  snapshotStandardActionText: string;
  snapshotMinimumActionText: string;
  snapshotNextAction: string | null;
  occurrenceVersion: number;
  result: GoalPracticeResultResponse | null;
};
