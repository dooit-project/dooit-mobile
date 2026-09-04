import type { LocalDateString, LocalDateTimeString } from './date-time';

export type DailyPlanStatus = 'DRAFT' | 'CONFIRMED' | 'CLOSED';

export type DailyPlanRequest = {
  focusTaskIds: number[];
  status: DailyPlanStatus;
};

export type DailyPlanResponse = {
  date: LocalDateString;
  status: DailyPlanStatus;
  focusTaskIds: number[];
  confirmedAt: LocalDateTimeString | null;
  closedAt: LocalDateTimeString | null;
  updatedAt: LocalDateTimeString | null;
};

export type DailyPlanSummaryResponse = {
  date: LocalDateString;
  status: DailyPlanStatus;
  plannedFocusCount: number;
  completedCount: number;
  movedToOtherDateCount: number;
  movedToInboxCount: number;
  undecidedCount: number;
};
