import type { LocalDateString, LocalDateTimeString } from './date-time';

/** New Goal IDs belong to /goals, independently of legacy /dday-goals IDs. */
export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'ACHIEVED' | 'ARCHIVED';
export type GoalFuturePlanPolicy = 'PAUSE_FUTURE' | 'KEEP_FUTURE';
export type GoalTaskCreateRequest = { title: string; date: LocalDateString };
export type GoalTaskLinkRequest = { goalId: number };

export const goalLimits = { title: 120, desiredOutcome: 500, motivationText: 500 } as const;

export type GoalCreateRequest = {
  title: string;
  desiredOutcome?: string | null;
  motivationText?: string | null;
  targetDate?: LocalDateString | null;
  linkedDdayGoalId?: number | null;
};

/** PATCH replaces content: omitted optional fields are cleared, not preserved. */
export type GoalUpdateRequest = GoalCreateRequest & {
  effectiveFromDate?: LocalDateString | null;
};

export type GoalStatusRequest = {
  status: GoalStatus;
  /** Omission defaults to PAUSE_FUTURE. Reactivation does not resume plans. */
  futurePlanPolicy?: GoalFuturePlanPolicy | null;
};

export type GoalFuturePlanPolicyRequest = {
  futurePlanPolicy?: GoalFuturePlanPolicy | null;
};

export type GoalResponse = {
  id: number;
  title: string;
  desiredOutcome: string | null;
  motivationText: string | null;
  targetDate: LocalDateString | null;
  status: GoalStatus;
  currentVersion: number;
  linkedDdayGoalId: number | null;
  achievedAt: LocalDateTimeString | null;
  archivedAt: LocalDateTimeString | null;
  createdAt: LocalDateTimeString;
  updatedAt: LocalDateTimeString | null;
};
