import type { LocalDateString, LocalDateTimeString } from './date-time';

export type TaskType = 'SCHEDULE' | 'TODO' | 'IDEA';
export type TaskStatus = 'INBOX' | 'TODAY' | 'DONE';
export type TaskQueryType = 'DAY' | 'WEEK' | 'MONTH';
export type TaskSearchDateField =
  | 'PLANNED'
  | 'START'
  | 'TARGET'
  | 'COMPLETED'
  | 'CREATED'
  | 'UPDATED';
export type TaskSearchSort =
  | 'RELEVANT_DATE_ASC'
  | 'RELEVANT_DATE_DESC'
  | 'CREATED_AT_ASC'
  | 'CREATED_AT_DESC'
  | 'UPDATED_AT_ASC'
  | 'UPDATED_AT_DESC';
export type TaskSearchDateSource =
  | 'TARGET_DATE'
  | 'START_AT'
  | 'COMPLETED_AT'
  | 'CREATED_AT'
  | 'UPDATED_AT'
  | 'NONE';
export type TodayOrderDirection = 'UP' | 'DOWN';
export type RecurrenceEditScope = 'THIS' | 'THIS_AND_FUTURE' | 'ALL';
export type RecurrenceException = 'SKIPPED' | 'MOVED' | 'MODIFIED';
export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type DeferReason =
  | 'TOO_BIG'
  | 'NOT_NEEDED_NOW'
  | 'AVOIDING'
  | 'NO_DEADLINE'
  | 'WAITING_OTHER'
  | 'ETC';

export const deferReasonLabels: Record<DeferReason, string> = {
  TOO_BIG: '너무 큼',
  NOT_NEEDED_NOW: '지금 필요 없음',
  AVOIDING: '하기 싫음',
  NO_DEADLINE: '마감 없음',
  WAITING_OTHER: '다른 사람 대기',
  ETC: '기타',
};

export const taskLimits = {
  title: 30,
  description: 300,
  category: 30,
} as const;

export type TaskUpsertRequest = {
  title: string;
  description?: string | null;
  type?: TaskType | null;
  startAt?: LocalDateTimeString | null;
  endAt?: LocalDateTimeString | null;
  category?: string | null;
  allDay: boolean;
  recurrence?: TaskRecurrenceRequest | null;
};

export type TaskQuickCaptureRequest = {
  text: string;
  referenceDate?: LocalDateString | null;
  timeZone?: string | null;
  defaultCategory?: string | null;
};

export type TaskQuickCaptureResponse = {
  task: TaskResponse;
  parsed: boolean;
  originalText: string;
  parsedDate: LocalDateString | null;
  parsedTime: string | null;
  parsedType: TaskType;
  parsedRecurrenceFrequency: RecurrenceFrequency | null;
  parsedByDays: string[];
  timeZone: string;
};

export type TaskTemplateRequest = {
  title: string;
  description?: string | null;
  type?: TaskType | null;
  category?: string | null;
  allDay: boolean;
  defaultStartTime?: string | null;
  defaultDurationMinutes?: number | null;
  recurrenceFrequency?: RecurrenceFrequency | null;
  recurrenceInterval?: number | null;
  recurrenceByDays?: string[] | null;
};

export type TaskTemplateCreateTaskRequest = {
  targetDate?: LocalDateString | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;
};

export type TaskTemplateResponse = {
  id: number;
  title: string;
  description: string | null;
  type: TaskType;
  category: string | null;
  allDay: boolean;
  defaultStartTime: string | null;
  defaultDurationMinutes: number | null;
  recurrenceFrequency: RecurrenceFrequency | null;
  recurrenceInterval: number;
  recurrenceByDays: string[];
  createdAt: LocalDateTimeString;
  updatedAt: LocalDateTimeString | null;
};

export type TaskRecurrenceRequest = {
  frequency: RecurrenceFrequency;
  interval?: number | null;
  recurrenceRule?: string | null;
  timeZone?: string | null;
  recurrenceUntil?: LocalDateString | null;
  recurrenceCount?: number | null;
  byDays?: string[] | null;
  byMonthDays?: number[] | null;
};

export type TaskRecurrenceResponse = {
  id: number;
  frequency: RecurrenceFrequency;
  interval: number;
  recurrenceRule: string;
  timeZone: string;
  recurrenceStartAt: LocalDateTimeString;
  recurrenceUntil: LocalDateString | null;
  recurrenceCount: number | null;
};

export type TaskResponse = {
  id: number;
  type: TaskType;
  title: string;
  description: string | null;
  startAt: LocalDateTimeString | null;
  endAt: LocalDateTimeString | null;
  allDay: boolean;
  unscheduled: boolean;
  category: string | null;
  status: TaskStatus;
  plannedDate: LocalDateString | null;
  targetDate: LocalDateString | null;
  todayOrder: number | null;
  completedAt: LocalDateTimeString | null;
  carryOverCount: number;
  staleCarryOver: boolean;
  deferReason: DeferReason | null;
  deferReasonLabel: string | null;
  ddayGoalId: number | null;
  ddayGoalTitle: string | null;
  ddayGoalTargetDate: LocalDateString | null;
  ddayDaysLeft: number | null;
  recurrenceSeriesId?: number | null;
  recurrenceRule?: string | null;
  recurrenceTimeZone?: string | null;
  recurrenceStartAt?: LocalDateTimeString | null;
  recurrenceUntil?: LocalDateString | null;
  recurrenceCount?: number | null;
  occurrenceDate?: LocalDateString | null;
  originalOccurrenceDate?: LocalDateString | null;
  recurrenceException?: RecurrenceException | null;
  recurrence?: TaskRecurrenceResponse | null;
  createdAt: LocalDateTimeString;
  updatedAt: LocalDateTimeString | null;
};

export type TaskRecommendationResponse = {
  task: TaskResponse;
  reason: string;
};

export type TaskNotificationCandidateResponse = {
  notificationKey: string;
  taskId: number;
  scheduledAt: LocalDateTimeString;
  recurrenceSeriesId: number | null;
  occurrenceDate: LocalDateString | null;
  suppressLocalNotification: boolean;
  task: TaskResponse;
};

export type TaskCategoryGroupResponse = {
  category: string;
  tasks: TaskResponse[];
};

export type TaskListQuery = {
  type: TaskQueryType;
  taskType?: TaskType;
  date: LocalDateString;
};

export type TaskSearchQuery = {
  q?: string;
  statuses?: TaskStatus[];
  taskTypes?: TaskType[];
  category?: string;
  ddayGoalId?: number;
  hasDday?: boolean;
  allDay?: boolean;
  dateField?: TaskSearchDateField;
  dateFrom?: LocalDateString;
  dateTo?: LocalDateString;
  sort?: TaskSearchSort;
  cursor?: string;
  limit?: number;
};

export type TaskSearchItem = {
  task: TaskResponse;
  relevantDate: LocalDateString;
  dateSource: TaskSearchDateSource;
};

export type TaskSearchPage = {
  items: TaskSearchItem[];
  nextCursor: string | null;
  limit?: number;
};

export type TaskDateQuery = {
  date: LocalDateString;
};

export type CompleteTaskQuery = {
  completedAt?: LocalDateTimeString;
};

export type ReorderTodayQuery = TaskDateQuery & {
  direction: TodayOrderDirection;
};

export type SetDeferReasonQuery = {
  reason: DeferReason;
};

export type ConnectDdayGoalQuery = {
  ddayGoalId: number;
};
