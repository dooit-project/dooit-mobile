import { ApiClientError } from './api-error';
import { getAccessToken } from './auth-token-store';

import type {
  AuthenticatedUserResponse,
  DdayGoalRequest,
  DdayGoalResponse,
  DdayGoalTaskRequest,
  DeferReason,
  LoginRequest,
  LocalDateString,
  RegisterRequest,
  TaskRecommendationResponse,
  TaskNotificationCandidateResponse,
  TaskQueryType,
  TaskQuickCaptureRequest,
  TaskQuickCaptureResponse,
  TaskResponse,
  TaskSearchDateField,
  TaskSearchDateSource,
  TaskSearchItem,
  TaskSearchPage,
  TaskSearchSort,
  TaskStatus,
  TaskTemplateCreateTaskRequest,
  TaskTemplateRequest,
  TaskTemplateResponse,
  TaskType,
  TaskUpsertRequest,
  TokenResponse,
  TodayOrderDirection,
  UserResponse,
  WorkspaceInviteRequest,
  WorkspaceInvitationResponse,
  WorkspaceMemberResponse,
  WorkspaceMemberUpdateRequest,
  WorkspaceRequest,
  WorkspaceResponse,
} from '@/types';
import { deferReasonLabels } from '@/types';
import { doesScheduleOverlapDate, shiftLocalDate, toApiLocalDate } from '@/utils';

type MockQueryValue = string | number | boolean | null | undefined;
type MockQueryParams = Record<string, MockQueryValue>;
type MockApiOptions = {
  query?: MockQueryParams;
  signal?: AbortSignal;
};

const now = '2026-06-30T09:00:00';
const today = toApiLocalDate();
const AUTH_PATH = '/api/v1/auth';
const TASKS_PATH = '/api/v1/tasks';
const TASK_TEMPLATES_PATH = '/api/v1/task-templates';
const DDAYS_PATH = '/api/v1/dday-goals';
const WORKSPACES_PATH = '/api/v1/workspaces';
const WORKSPACE_INVITATIONS_PATH = '/api/v1/workspace-invitations';
const recommendedTaskIds = new Set([6]);

let nextUserId = 3;
let nextTaskId = 100;
let nextTemplateId = 1;
let nextGoalId = 10;
let nextWorkspaceId = 1;
let nextWorkspaceMemberId = 1;
let currentUser: UserResponse | null = null;
const taskIdsByUser = new Map<number, Set<number>>();
const goalIdsByUser = new Map<number, Set<number>>();
const taskTemplates: TaskTemplateResponse[] = [];
const workspaces: WorkspaceResponse[] = [];
const workspaceMembers: WorkspaceMemberResponse[] = [];
const workspaceTasks = new Map<number, TaskResponse[]>();
const workspaceDdayGoals = new Map<number, DdayGoalResponse[]>();

const users: UserResponse[] = [
  {
    id: 1,
    accountType: 'REGISTERED',
    email: 'demo@todolab.app',
    displayName: 'Demo User',
    role: 'USER',
    timeZone: 'Asia/Seoul',
    createdAt: now,
    updatedAt: null,
  },
  {
    id: 2,
    accountType: 'REGISTERED',
    email: 'member@todolab.app',
    displayName: 'Mock Member',
    role: 'USER',
    timeZone: 'Asia/Seoul',
    createdAt: now,
    updatedAt: null,
  },
];

const ddayGoals: DdayGoalResponse[] = [
  {
    id: 1,
    title: 'MVP 데모',
    targetDate: '2026-07-15',
    daysLeft: 15,
    createdAt: now,
  },
  {
    id: 2,
    title: '앱스토어 제출',
    targetDate: '2026-08-01',
    daysLeft: 32,
    createdAt: now,
  },
];

const tasks: TaskResponse[] = [
  createTask({
    id: 1,
    title: 'Today 화면 첫 viewport 확인',
    description: 'compact header 적용 뒤 실행 목록이 바로 보이는지 확인',
    status: 'TODAY',
    plannedDate: today,
    todayOrder: 1,
    ddayGoalId: 1,
    ddayGoalTitle: 'MVP 데모',
    ddayGoalTargetDate: '2026-07-15',
    ddayDaysLeft: 15,
  }),
  createTask({
    id: 2,
    title: '빠른 기록 composer 축소안 정리',
    category: 'UI/UX',
    status: 'TODAY',
    plannedDate: today,
    todayOrder: 2,
  }),
  createTask({
    id: 3,
    title: '백엔드 연동 smoke test 체크리스트',
    category: 'API',
    status: 'TODAY',
    plannedDate: today,
    todayOrder: 3,
  }),
  createTask({
    id: 4,
    type: 'SCHEDULE',
    title: '백엔드 계약 확인 미팅',
    category: '일정',
    status: 'TODAY',
    plannedDate: today,
    startAt: `${today}T14:00:00`,
    endAt: `${today}T14:30:00`,
    todayOrder: null,
  }),
  createTask({
    id: 11,
    type: 'SCHEDULE',
    title: '여러 날에 걸친 일정 UX 점검',
    category: '일정',
    status: 'TODAY',
    plannedDate: shiftLocalDate(today, -1) ?? today,
    startAt: `${shiftLocalDate(today, -1) ?? today}T09:00:00`,
    endAt: `${shiftLocalDate(today, 1) ?? today}T18:00:00`,
    todayOrder: null,
  }),
  createTask({
    id: 5,
    title: '지난주 미완료 정리',
    category: '정리',
    status: 'INBOX',
    plannedDate: '2026-06-28',
    carryOverCount: 2,
    staleCarryOver: true,
    deferReason: 'TOO_BIG',
    deferReasonLabel: deferReasonLabels.TOO_BIG,
  }),
  createTask({
    id: 6,
    title: '검색 필터 UX 문구 다듬기',
    category: '검색',
    status: 'INBOX',
    plannedDate: null,
  }),
  createTask({
    id: 7,
    title: 'D-Day 연결 Task 흐름 검증',
    category: 'D-Day',
    status: 'DONE',
    plannedDate: today,
    completedAt: `${today}T10:30:00`,
    ddayGoalId: 1,
    ddayGoalTitle: 'MVP 데모',
    ddayGoalTargetDate: '2026-07-15',
    ddayDaysLeft: 15,
  }),
  createTask({
    id: 8,
    title: '설정 화면 항목 우선순위 스케치',
    category: 'More',
    status: 'DONE',
    plannedDate: today,
    completedAt: `${today}T11:10:00`,
  }),
];

function createTask(
  overrides: Partial<TaskResponse> & { id: number; title: string },
): TaskResponse {
  return {
    id: overrides.id,
    type: overrides.type ?? 'TODO',
    title: overrides.title,
    description: overrides.description ?? null,
    startAt: overrides.startAt ?? null,
    endAt: overrides.endAt ?? null,
    allDay: overrides.allDay ?? false,
    unscheduled: overrides.plannedDate === null,
    category: overrides.category ?? null,
    status: overrides.status ?? 'INBOX',
    plannedDate: overrides.plannedDate ?? null,
    targetDate: overrides.targetDate ?? null,
    todayOrder: overrides.todayOrder ?? null,
    completedAt: overrides.completedAt ?? null,
    carryOverCount: overrides.carryOverCount ?? 0,
    staleCarryOver: overrides.staleCarryOver ?? false,
    deferReason: overrides.deferReason ?? null,
    deferReasonLabel: overrides.deferReasonLabel ?? null,
    ddayGoalId: overrides.ddayGoalId ?? null,
    ddayGoalTitle: overrides.ddayGoalTitle ?? null,
    ddayGoalTargetDate: overrides.ddayGoalTargetDate ?? null,
    ddayDaysLeft: overrides.ddayDaysLeft ?? null,
    recurrenceSeriesId: overrides.recurrenceSeriesId ?? null,
    recurrenceRule: overrides.recurrenceRule ?? null,
    recurrenceTimeZone: overrides.recurrenceTimeZone ?? null,
    recurrenceStartAt: overrides.recurrenceStartAt ?? null,
    recurrenceUntil: overrides.recurrenceUntil ?? null,
    recurrenceCount: overrides.recurrenceCount ?? null,
    occurrenceDate: overrides.occurrenceDate ?? null,
    originalOccurrenceDate: overrides.originalOccurrenceDate ?? null,
    recurrenceException: overrides.recurrenceException ?? null,
    recurrence: overrides.recurrence ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? null,
  };
}

function cloneTask(task: TaskResponse): TaskResponse {
  return { ...task };
}

function cloneGoal(goal: DdayGoalResponse): DdayGoalResponse {
  return { ...goal, daysLeft: getDaysLeft(goal.targetDate) };
}

const quickCaptureWeekdays = [
  { pattern: '일(?:요일)?', code: 'SU', day: 0 },
  { pattern: '월(?:요일)?', code: 'MO', day: 1 },
  { pattern: '화(?:요일)?', code: 'TU', day: 2 },
  { pattern: '수(?:요일)?', code: 'WE', day: 3 },
  { pattern: '목(?:요일)?', code: 'TH', day: 4 },
  { pattern: '금(?:요일)?', code: 'FR', day: 5 },
  { pattern: '토(?:요일)?', code: 'SA', day: 6 },
] as const;

function parseMockQuickCapture(request: TaskQuickCaptureRequest) {
  const originalText = request.text.trim();
  const referenceDate = request.referenceDate ?? today;
  let parsedDate: LocalDateString | null = null;
  let parsedTime: string | null = null;
  let recurrenceFrequency: TaskQuickCaptureResponse['parsedRecurrenceFrequency'] = null;
  let parsedByDays: string[] = [];
  let title = originalText;

  const relativeDateMatch = originalText.match(/오늘|내일|모레/);
  if (relativeDateMatch) {
    const offset = relativeDateMatch[0] === '오늘' ? 0 : relativeDateMatch[0] === '내일' ? 1 : 2;
    parsedDate = shiftLocalDate(referenceDate, offset);
    title = title.replace(relativeDateMatch[0], ' ');
  }

  const explicitDateMatch = originalText.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (explicitDateMatch) {
    parsedDate = explicitDateMatch[1] as LocalDateString;
    title = title.replace(explicitDateMatch[0], ' ');
  }

  const timeMatch = originalText.match(/(오전|오후)?\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  if (timeMatch) {
    const meridiem = timeMatch[1];
    let hour = Number(timeMatch[2]);
    const minute = Number(timeMatch[3] ?? 0);

    if (meridiem === '오전' && hour === 12) hour = 0;
    if (meridiem === '오후' && hour < 12) hour += 12;
    if (!meridiem && hour >= 1 && hour <= 7) hour += 12;

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      parsedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
      parsedDate ??= referenceDate;
      title = title.replace(timeMatch[0], ' ');
    }
  }

  for (const weekday of quickCaptureWeekdays) {
    const weeklyMatch = originalText.match(new RegExp(`매주\\s*${weekday.pattern}`));
    if (!weeklyMatch) continue;

    recurrenceFrequency = 'WEEKLY';
    parsedByDays = [weekday.code];
    parsedDate = getNextMockWeekday(referenceDate, weekday.day);
    title = title.replace(weeklyMatch[0], ' ');
    break;
  }

  const parsed = parsedDate !== null || parsedTime !== null || recurrenceFrequency !== null;
  const normalizedTitle = title.replace(/\s+/g, ' ').trim() || originalText;

  return {
    originalText,
    title: normalizedTitle.slice(0, 30),
    description: originalText.length > 30 ? originalText : null,
    parsed,
    parsedDate,
    parsedTime,
    recurrenceFrequency,
    parsedByDays,
  };
}

function getNextMockWeekday(referenceDate: LocalDateString, targetDay: number) {
  const [year, month, day] = referenceDate.split('-').map(Number);
  const referenceDay = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
  const offset = (targetDay - referenceDay + 7) % 7;
  return shiftLocalDate(referenceDate, offset) ?? referenceDate;
}

function getMockQuickCaptureEndAt(date: LocalDateString, time: string | null) {
  if (!time) {
    const nextDate = shiftLocalDate(date, 1);
    return nextDate ? `${nextDate}T00:00:00` : null;
  }

  const hour = Number(time.slice(0, 2));
  if (hour < 23) {
    return `${date}T${String(hour + 1).padStart(2, '0')}${time.slice(2)}`;
  }

  const nextDate = shiftLocalDate(date, 1);
  return nextDate ? `${nextDate}T00${time.slice(2)}` : null;
}

function getOwnedIds(store: Map<number, Set<number>>) {
  if (!currentUser || currentUser.id === 1) {
    return null;
  }

  let ownedIds = store.get(currentUser.id);
  if (!ownedIds) {
    ownedIds = new Set();
    store.set(currentUser.id, ownedIds);
  }

  return ownedIds;
}

function getVisibleTasks() {
  const ownedIds = getOwnedIds(taskIdsByUser);
  return ownedIds ? tasks.filter((task) => ownedIds.has(task.id)) : tasks;
}

function getVisibleGoals() {
  const ownedIds = getOwnedIds(goalIdsByUser);
  return ownedIds ? ddayGoals.filter((goal) => ownedIds.has(goal.id)) : ddayGoals;
}

function rememberTask(taskId: number) {
  getOwnedIds(taskIdsByUser)?.add(taskId);
}

function rememberGoal(goalId: number) {
  getOwnedIds(goalIdsByUser)?.add(goalId);
}

function transferOwnership(sourceUserId: number, targetUserId: number) {
  const transferIds = (store: Map<number, Set<number>>) => {
    const sourceIds = store.get(sourceUserId);
    if (!sourceIds || sourceIds.size === 0) {
      return;
    }

    const targetIds = store.get(targetUserId) ?? new Set<number>();
    sourceIds.forEach((id) => targetIds.add(id));
    store.set(targetUserId, targetIds);
  };

  transferIds(taskIdsByUser);
  transferIds(goalIdsByUser);
}

function requireNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new ApiClientError('요청이 취소되었습니다.', { kind: 'cancelled' });
  }
}

function getDate(query?: MockQueryParams) {
  return String(query?.date ?? today) as LocalDateString;
}

function getTask(taskId: number) {
  const task = getVisibleTasks().find((item) => item.id === taskId);

  if (!task) {
    throw new ApiClientError('Mock Task를 찾을 수 없습니다.', { kind: 'http', status: 404 });
  }

  return task;
}

function getGoal(goalId: number) {
  const goal = getVisibleGoals().find((item) => item.id === goalId);

  if (!goal) {
    throw new ApiClientError('Mock D-Day 목표를 찾을 수 없습니다.', { kind: 'http', status: 404 });
  }

  return goal;
}

function getUser(email: string) {
  return users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

function createUser(request: RegisterRequest) {
  const user: UserResponse = {
    id: nextUserId,
    accountType: 'REGISTERED',
    email: request.email,
    displayName: request.displayName,
    role: 'USER',
    timeZone: 'Asia/Seoul',
    createdAt: now,
    updatedAt: null,
  };

  nextUserId += 1;
  users.push(user);
  taskIdsByUser.set(user.id, new Set());
  goalIdsByUser.set(user.id, new Set());

  return user;
}

function registerUser(request: RegisterRequest) {
  const existingUser = getUser(request.email);
  if (existingUser) {
    return existingUser;
  }

  if (currentUser?.accountType === 'GUEST') {
    currentUser.accountType = 'REGISTERED';
    currentUser.email = request.email;
    currentUser.displayName = request.displayName;
    currentUser.updatedAt = now;
    return currentUser;
  }

  return createUser(request);
}

function createGuestUser() {
  const user: UserResponse = {
    id: nextUserId,
    accountType: 'GUEST',
    email: null,
    displayName: null,
    role: 'USER',
    timeZone: 'Asia/Seoul',
    createdAt: now,
    updatedAt: null,
  };

  nextUserId += 1;
  users.push(user);
  taskIdsByUser.set(user.id, new Set());
  goalIdsByUser.set(user.id, new Set());

  return user;
}

function createTokenResponse(user: UserResponse): TokenResponse {
  currentUser = user;

  return {
    tokenType: 'Bearer',
    accessToken: `mock-access-token-${user.accountType.toLowerCase()}-${user.id}`,
    expiresAt: `${today}T23:59:59`,
    user,
    mergeResult: null,
  };
}

export function restoreGuestUserFromAccessToken(token: string | null) {
  const match = token?.match(/^mock-access-token-guest-(\d+)$/);
  if (!match) {
    return null;
  }

  const id = Number(match[1]);
  const existingUser = users.find((user) => user.id === id);
  if (existingUser?.accountType === 'GUEST') {
    return existingUser;
  }

  const user: UserResponse = {
    id,
    accountType: 'GUEST',
    email: null,
    displayName: null,
    role: 'USER',
    timeZone: 'Asia/Seoul',
    createdAt: now,
    updatedAt: null,
  };
  users.push(user);
  taskIdsByUser.set(user.id, new Set());
  goalIdsByUser.set(user.id, new Set());
  nextUserId = Math.max(nextUserId, id + 1);

  return user;
}

function getTaskId(path: string) {
  const match = path.match(/^\/api\/v1\/tasks\/(\d+)/);

  return match ? Number(match[1]) : null;
}

function getGoalId(path: string) {
  const match = path.match(/^\/api\/v1\/dday-goals\/(\d+)/);

  return match ? Number(match[1]) : null;
}

function getDaysLeft(targetDate: LocalDateString) {
  const todayTime = new Date(`${today}T00:00:00`).getTime();
  const targetTime = new Date(`${targetDate}T00:00:00`).getTime();

  return Math.ceil((targetTime - todayTime) / 86_400_000);
}

function applyTaskRequest(task: TaskResponse, request: TaskUpsertRequest) {
  task.title = request.title;
  task.description = request.description ?? null;
  task.category = request.category ?? null;
  task.type = request.type ?? 'TODO';
  task.allDay = request.allDay;
  task.startAt = request.startAt ?? null;
  task.endAt = request.endAt ?? null;
  applyTaskRecurrence(task, request);
  task.updatedAt = now;

  return cloneTask(task);
}

function applyTaskRecurrence(task: TaskResponse, request: TaskUpsertRequest) {
  const recurrence = request.recurrence;

  if (!recurrence || !request.startAt) {
    task.recurrenceSeriesId = null;
    task.recurrenceRule = null;
    task.recurrenceTimeZone = null;
    task.recurrenceStartAt = null;
    task.recurrenceUntil = null;
    task.recurrenceCount = null;
    task.occurrenceDate = null;
    task.originalOccurrenceDate = null;
    task.recurrenceException = null;
    task.recurrence = null;
    return;
  }

  const recurrenceRule = recurrence.recurrenceRule ?? `FREQ=${recurrence.frequency}`;
  const timeZone = recurrence.timeZone ?? 'Asia/Seoul';

  task.recurrenceSeriesId = task.id;
  task.recurrenceRule = recurrenceRule;
  task.recurrenceTimeZone = timeZone;
  task.recurrenceStartAt = request.startAt;
  task.recurrenceUntil = recurrence.recurrenceUntil ?? null;
  task.recurrenceCount = recurrence.recurrenceCount ?? null;
  task.occurrenceDate = request.startAt.slice(0, 10) as LocalDateString;
  task.originalOccurrenceDate = task.occurrenceDate;
  task.recurrenceException = null;
  task.recurrence = {
    id: task.id,
    frequency: recurrence.frequency,
    interval: recurrence.interval ?? 1,
    recurrenceRule,
    timeZone,
    recurrenceStartAt: request.startAt,
    recurrenceUntil: recurrence.recurrenceUntil ?? null,
    recurrenceCount: recurrence.recurrenceCount ?? null,
  };
}

function setTaskStatus(task: TaskResponse, status: TaskStatus, date?: LocalDateString) {
  task.status = status;
  task.plannedDate = status === 'INBOX' ? null : (date ?? task.plannedDate);
  task.unscheduled = task.plannedDate === null;
  task.completedAt = status === 'DONE' ? `${date ?? today}T12:00:00` : null;
  task.todayOrder = status === 'TODAY' ? getNextTodayOrder(date ?? today) : null;
  task.updatedAt = now;

  return cloneTask(task);
}

function getNextTodayOrder(date: LocalDateString) {
  const orders = getVisibleTasks()
    .filter((task) => task.status === 'TODAY' && task.plannedDate === date)
    .map((task) => task.todayOrder ?? 0);

  return Math.max(0, ...orders) + 1;
}

function getTaskRange(type: TaskQueryType, date: LocalDateString) {
  if (type === 'DAY') return [date];

  if (type === 'WEEK') {
    const [year, month, day] = date.split('-').map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
    const monday = shiftLocalDate(date, -((weekday + 6) % 7)) ?? date;
    return Array.from({ length: 7 }, (_, index) => shiftLocalDate(monday, index) ?? monday);
  }

  const month = date.slice(0, 7);
  return Array.from({ length: 31 }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`)
    .filter((value) => !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime()))
    .map((value) => value as LocalDateString);
}

function splitQueryList<T extends string>(value: MockQueryValue): T[] {
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean) as T[];
}

function parseBooleanQuery(value: MockQueryValue) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return String(value) === 'true';
}

function getTaskSearchDate(
  task: TaskResponse,
  dateField?: TaskSearchDateField,
): { relevantDate: LocalDateString; dateSource: TaskSearchDateSource } | null {
  if (dateField === 'PLANNED') {
    if (!task.plannedDate) return null;

    return {
      relevantDate: task.plannedDate,
      dateSource: 'TARGET_DATE',
    };
  }

  if (dateField === 'TARGET') {
    if (!task.targetDate) return null;

    return {
      relevantDate: task.targetDate,
      dateSource: 'TARGET_DATE',
    };
  }

  if (dateField === 'START') {
    if (!task.startAt) return null;

    return {
      relevantDate: task.startAt.slice(0, 10) as LocalDateString,
      dateSource: 'START_AT',
    };
  }

  if (dateField === 'COMPLETED') {
    if (!task.completedAt) return null;

    return {
      relevantDate: task.completedAt.slice(0, 10) as LocalDateString,
      dateSource: 'COMPLETED_AT',
    };
  }

  if (dateField === 'CREATED') {
    return {
      relevantDate: task.createdAt.slice(0, 10) as LocalDateString,
      dateSource: 'CREATED_AT',
    };
  }

  if (dateField === 'UPDATED') {
    return {
      relevantDate: (task.updatedAt ?? task.createdAt).slice(0, 10) as LocalDateString,
      dateSource: task.updatedAt ? 'UPDATED_AT' : 'CREATED_AT',
    };
  }

  if (task.status === 'DONE' && task.completedAt) {
    return {
      relevantDate: task.completedAt.slice(0, 10) as LocalDateString,
      dateSource: 'COMPLETED_AT',
    };
  }

  if (task.startAt) {
    return { relevantDate: task.startAt.slice(0, 10) as LocalDateString, dateSource: 'START_AT' };
  }

  if (task.targetDate) {
    return { relevantDate: task.targetDate, dateSource: 'TARGET_DATE' };
  }

  if (task.plannedDate) {
    return { relevantDate: task.plannedDate, dateSource: 'TARGET_DATE' };
  }

  return { relevantDate: task.createdAt.slice(0, 10) as LocalDateString, dateSource: 'CREATED_AT' };
}

function searchTasks(query?: MockQueryParams): TaskSearchPage {
  const keyword = String(query?.q ?? '')
    .trim()
    .toLocaleLowerCase();
  const statuses = splitQueryList<TaskStatus>(query?.statuses);
  const taskTypes = splitQueryList<TaskType>(query?.taskTypes);
  const dateField = query?.dateField ? (String(query.dateField) as TaskSearchDateField) : undefined;
  const dateFrom = query?.dateFrom ? String(query.dateFrom) : null;
  const dateTo = query?.dateTo ? String(query.dateTo) : null;
  const sort = String(query?.sort ?? 'RELEVANT_DATE_DESC') as TaskSearchSort;
  const limit = Math.min(Math.max(Number(query?.limit ?? 20), 1), 50);
  const offset = Math.max(Number(query?.cursor ?? 0), 0);
  const hasDday = parseBooleanQuery(query?.hasDday);
  const allDay = parseBooleanQuery(query?.allDay);

  const items: TaskSearchItem[] = getVisibleTasks()
    .filter((task) => {
      const text = `${task.title} ${task.description ?? ''}`.toLocaleLowerCase();

      if (keyword && !text.includes(keyword)) return false;
      if (statuses.length > 0 && !statuses.includes(task.status)) return false;
      if (taskTypes.length > 0 && !taskTypes.includes(task.type)) return false;
      if (query?.category && task.category !== String(query.category)) return false;
      if (query?.ddayGoalId && task.ddayGoalId !== Number(query.ddayGoalId)) return false;
      if (hasDday !== null && Boolean(task.ddayGoalId) !== hasDday) {
        return false;
      }

      if (allDay !== null && task.allDay !== allDay) return false;

      const searchDate = getTaskSearchDate(task, dateField);

      if (!searchDate) return false;

      if (dateFrom && searchDate.relevantDate < dateFrom) return false;
      if (dateTo && searchDate.relevantDate > dateTo) return false;

      return true;
    })
    .map((task) => {
      const searchDate = getTaskSearchDate(task, dateField);

      if (!searchDate) {
        throw new ApiClientError('Mock 검색 날짜를 계산할 수 없습니다.', { kind: 'configuration' });
      }

      return {
        task: cloneTask(task),
        ...searchDate,
      };
    })
    .sort((left, right) => {
      if (sort === 'RELEVANT_DATE_ASC' || sort === 'CREATED_AT_ASC' || sort === 'UPDATED_AT_ASC') {
        return left.relevantDate.localeCompare(right.relevantDate) || left.task.id - right.task.id;
      }

      return right.relevantDate.localeCompare(left.relevantDate) || right.task.id - left.task.id;
    });

  return {
    items: items.slice(offset, offset + limit),
    nextCursor: items.length > offset + limit ? String(offset + limit) : null,
    limit,
  };
}

function sortTodayTasks(left: TaskResponse, right: TaskResponse) {
  if (left.type === 'SCHEDULE' && right.type !== 'SCHEDULE') {
    return -1;
  }

  if (left.type !== 'SCHEDULE' && right.type === 'SCHEDULE') {
    return 1;
  }

  return (left.todayOrder ?? 999) - (right.todayOrder ?? 999);
}

function reorderToday(taskId: number, date: LocalDateString, direction: TodayOrderDirection) {
  const todayTasks = getVisibleTasks()
    .filter(
      (task) => task.status === 'TODAY' && task.plannedDate === date && task.type !== 'SCHEDULE',
    )
    .sort((left, right) => (left.todayOrder ?? 999) - (right.todayOrder ?? 999));
  const index = todayTasks.findIndex((task) => task.id === taskId);

  if (index < 0) {
    return cloneTask(getTask(taskId));
  }

  const targetIndex = direction === 'UP' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= todayTasks.length) {
    return cloneTask(todayTasks[index]);
  }

  const currentOrder = todayTasks[index].todayOrder;
  todayTasks[index].todayOrder = todayTasks[targetIndex].todayOrder;
  todayTasks[targetIndex].todayOrder = currentOrder;

  return cloneTask(todayTasks[targetIndex]);
}

function connectGoal(task: TaskResponse, goalId: number) {
  const goal = getGoal(goalId);

  task.ddayGoalId = goal.id;
  task.ddayGoalTitle = goal.title;
  task.ddayGoalTargetDate = goal.targetDate;
  task.ddayDaysLeft = getDaysLeft(goal.targetDate);
  task.updatedAt = now;

  return cloneTask(task);
}

function disconnectGoal(task: TaskResponse) {
  task.ddayGoalId = null;
  task.ddayGoalTitle = null;
  task.ddayGoalTargetDate = null;
  task.ddayDaysLeft = null;
  task.updatedAt = now;

  return cloneTask(task);
}

function getTemplateId(path: string) {
  const match = path.match(/^\/api\/v1\/task-templates\/(\d+)(?:\/tasks)?$/);
  return match ? Number(match[1]) : null;
}

function getTemplate(templateId: number) {
  const template = taskTemplates.find((item) => item.id === templateId);
  if (!template) {
    throw new ApiClientError('Task 템플릿을 찾을 수 없습니다.', {
      kind: 'http',
      status: 404,
    });
  }
  return template;
}

function applyTemplateRequest(
  template: TaskTemplateResponse,
  request: TaskTemplateRequest,
): TaskTemplateResponse {
  template.title = request.title;
  template.description = request.description ?? null;
  template.type = request.type ?? 'TODO';
  template.category = request.category ?? null;
  template.allDay = request.allDay;
  template.defaultStartTime = request.defaultStartTime ?? null;
  template.defaultDurationMinutes = request.defaultDurationMinutes ?? null;
  template.recurrenceFrequency = request.recurrenceFrequency ?? null;
  template.recurrenceInterval = request.recurrenceInterval ?? 1;
  template.recurrenceByDays = [...(request.recurrenceByDays ?? [])];
  template.updatedAt = now;
  return { ...template, recurrenceByDays: [...template.recurrenceByDays] };
}

function getWorkspacePathIds(path: string) {
  const match = path.match(/^\/api\/v1\/workspaces\/(\d+)(?:\/(members|tasks)(?:\/(\d+))?)?$/);
  return match
    ? {
        workspaceId: Number(match[1]),
        memberId: match[2] === 'members' && match[3] ? Number(match[3]) : null,
        taskId: match[2] === 'tasks' && match[3] ? Number(match[3]) : null,
      }
    : null;
}

function getWorkspaceDdayPathIds(path: string) {
  const match = path.match(/^\/api\/v1\/workspaces\/(\d+)\/dday-goals(?:\/(\d+)(?:\/(tasks))?)?$/);
  return match
    ? {
        workspaceId: Number(match[1]),
        goalId: match[2] ? Number(match[2]) : null,
        tasks: match[3] === 'tasks',
      }
    : null;
}

function getWorkspaceTaskDdayPathIds(path: string) {
  const match = path.match(/^\/api\/v1\/workspaces\/(\d+)\/tasks\/(\d+)\/dday-goal$/);
  return match ? { workspaceId: Number(match[1]), taskId: Number(match[2]) } : null;
}

function getWorkspaceNotificationCandidatesId(path: string) {
  const match = path.match(/^\/api\/v1\/workspaces\/(\d+)\/tasks\/notification-candidates$/);
  return match ? Number(match[1]) : null;
}

function getMockActor() {
  return currentUser ?? users[0];
}

function getWorkspace(workspaceId: number) {
  const workspace = workspaces.find((item) => item.id === workspaceId);
  if (!workspace) {
    throw new ApiClientError('Workspace를 찾을 수 없습니다.', { kind: 'http', status: 404 });
  }
  return workspace;
}

function cloneWorkspaceMember(member: WorkspaceMemberResponse) {
  return { ...member };
}

function getWorkspaceTasks(workspaceId: number) {
  getWorkspace(workspaceId);
  const stored = workspaceTasks.get(workspaceId) ?? [];
  workspaceTasks.set(workspaceId, stored);
  return stored;
}

function getWorkspaceTask(workspaceId: number, taskId: number) {
  const task = getWorkspaceTasks(workspaceId).find((item) => item.id === taskId);
  if (!task) {
    throw new ApiClientError('Workspace Task를 찾을 수 없습니다.', {
      kind: 'http',
      status: 404,
    });
  }
  return task;
}

function getWorkspaceDdayGoals(workspaceId: number) {
  getWorkspace(workspaceId);
  const stored = workspaceDdayGoals.get(workspaceId) ?? [];
  workspaceDdayGoals.set(workspaceId, stored);
  return stored;
}

function getWorkspaceDdayGoal(workspaceId: number, goalId: number) {
  const goal = getWorkspaceDdayGoals(workspaceId).find((item) => item.id === goalId);
  if (!goal) {
    throw new ApiClientError('Workspace D-Day를 찾을 수 없습니다.', {
      kind: 'http',
      status: 404,
    });
  }
  return goal;
}

export const mockApiClient = {
  async get<T>(path: string, options: MockApiOptions = {}) {
    requireNotAborted(options.signal);

    if (path === `${AUTH_PATH}/me`) {
      const user = currentUser ?? restoreGuestUserFromAccessToken(getAccessToken()) ?? users[0];
      currentUser = user;
      const response: AuthenticatedUserResponse = {
        id: user.id,
        accountType: user.accountType,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      };

      return response as T;
    }

    if (path === TASKS_PATH) {
      const date = getDate(options.query);
      const type = String(options.query?.type ?? 'DAY') as TaskQueryType;
      const range = getTaskRange(type, date);

      return getVisibleTasks()
        .filter(
          (task) =>
            task.type === 'SCHEDULE' &&
            range.some((rangeDate) => doesScheduleOverlapDate(task, rangeDate)),
        )
        .map(cloneTask) as T;
    }

    if (path === `${TASKS_PATH}/search`) {
      return searchTasks(options.query) as T;
    }

    if (path === `${TASKS_PATH}/today`) {
      const date = getDate(options.query);

      return getVisibleTasks()
        .filter(
          (task) =>
            task.status === 'TODAY' &&
            (task.plannedDate === date || doesScheduleOverlapDate(task, date)),
        )
        .sort(sortTodayTasks)
        .map(cloneTask) as T;
    }

    if (path === `${TASKS_PATH}/today/recommendations`) {
      const recommendations: TaskRecommendationResponse[] = getVisibleTasks()
        .filter(
          (task) =>
            task.status === 'INBOX' && !task.staleCarryOver && recommendedTaskIds.has(task.id),
        )
        .map((task) => ({
          task: cloneTask(task),
          reason: 'Mock mode 추천: 날짜 없이 남아 있어 오늘 가볍게 처리하기 좋아요.',
        }));

      return recommendations as T;
    }

    if (path === `${TASKS_PATH}/notification-candidates`) {
      const from = String(options.query?.from ?? today);
      const to = String(options.query?.to ?? today);
      const candidates: TaskNotificationCandidateResponse[] = getVisibleTasks()
        .filter(
          (task) =>
            task.status === 'TODAY' &&
            !task.completedAt &&
            Boolean(task.startAt) &&
            task.recurrenceException !== 'SKIPPED' &&
            task.startAt!.slice(0, 10) >= from &&
            task.startAt!.slice(0, 10) <= to,
        )
        .map((task) => ({
          notificationKey:
            task.recurrenceSeriesId && task.occurrenceDate
              ? `recurrence:${task.recurrenceSeriesId}:${task.occurrenceDate}`
              : `task:${task.id}`,
          taskId: task.id,
          scheduledAt: task.startAt!,
          recurrenceSeriesId: task.recurrenceSeriesId ?? null,
          occurrenceDate: task.occurrenceDate ?? null,
          suppressLocalNotification: false,
          task: cloneTask(task),
        }));

      return candidates as T;
    }

    if (path === `${TASKS_PATH}/done`) {
      const date = getDate(options.query);

      return getVisibleTasks()
        .filter((task) => task.status === 'DONE' && task.plannedDate === date)
        .map(cloneTask) as T;
    }

    if (path === `${TASKS_PATH}/stale`) {
      return getVisibleTasks()
        .filter((task) => task.staleCarryOver)
        .map(cloneTask) as T;
    }

    if (path === `${TASKS_PATH}/inbox`) {
      return getVisibleTasks()
        .filter((task) => task.status === 'INBOX' && !task.staleCarryOver)
        .map(cloneTask) as T;
    }

    if (path === TASK_TEMPLATES_PATH) {
      return taskTemplates.map((template) => ({
        ...template,
        recurrenceByDays: [...template.recurrenceByDays],
      })) as T;
    }

    if (path === DDAYS_PATH) {
      return getVisibleGoals().map(cloneGoal) as T;
    }

    if (path === WORKSPACES_PATH) {
      const actorId = getMockActor().id;
      const visibleIds = new Set(
        workspaceMembers
          .filter((member) => member.userId === actorId && member.status === 'ACTIVE')
          .map((member) => member.workspaceId),
      );
      return workspaces
        .filter((workspace) => visibleIds.has(workspace.id))
        .map((item) => ({ ...item })) as T;
    }

    if (path === WORKSPACE_INVITATIONS_PATH) {
      const actor = getMockActor();
      if (actor.accountType === 'GUEST') {
        throw new ApiClientError('게스트 계정은 Workspace 초대를 조회할 수 없습니다.', {
          kind: 'http',
          status: 403,
        });
      }
      return workspaceMembers
        .filter((member) => member.userId === actor.id && member.status === 'PENDING')
        .map(
          (membership): WorkspaceInvitationResponse => ({
            workspace: { ...getWorkspace(membership.workspaceId) },
            membership: cloneWorkspaceMember(membership),
            invitedAt: membership.createdAt,
          }),
        ) as T;
    }

    const workspaceNotificationCandidatesId = getWorkspaceNotificationCandidatesId(path);
    if (workspaceNotificationCandidatesId) {
      const from = String(options.query?.from ?? today);
      const to = String(options.query?.to ?? today);
      return getWorkspaceTasks(workspaceNotificationCandidatesId)
        .filter(
          (task) =>
            !task.completedAt &&
            Boolean(task.startAt) &&
            task.recurrenceException !== 'SKIPPED' &&
            task.startAt!.slice(0, 10) >= from &&
            task.startAt!.slice(0, 10) <= to,
        )
        .map((task) => ({
          notificationKey:
            task.recurrenceSeriesId && task.occurrenceDate
              ? `recurrence:${task.recurrenceSeriesId}:${task.occurrenceDate}`
              : `task:${task.id}`,
          taskId: task.id,
          scheduledAt: task.startAt!,
          recurrenceSeriesId: task.recurrenceSeriesId ?? null,
          occurrenceDate: task.occurrenceDate ?? null,
          suppressLocalNotification: false,
          task: cloneTask(task),
        })) as T;
    }

    const workspacePath = getWorkspacePathIds(path);
    if (workspacePath && path === `${WORKSPACES_PATH}/${workspacePath.workspaceId}`) {
      return { ...getWorkspace(workspacePath.workspaceId) } as T;
    }
    if (workspacePath && path === `${WORKSPACES_PATH}/${workspacePath.workspaceId}/members`) {
      getWorkspace(workspacePath.workspaceId);
      return workspaceMembers
        .filter(
          (member) =>
            member.workspaceId === workspacePath.workspaceId && member.status === 'ACTIVE',
        )
        .map(cloneWorkspaceMember) as T;
    }
    if (workspacePath && path === `${WORKSPACES_PATH}/${workspacePath.workspaceId}/tasks`) {
      const type = String(options.query?.type ?? 'DAY') as TaskQueryType;
      const date = String(options.query?.date ?? today) as LocalDateString;
      const range = getTaskRange(type, date);
      const taskType = options.query?.taskType ? String(options.query.taskType) : null;
      return getWorkspaceTasks(workspacePath.workspaceId)
        .filter((task) => !taskType || task.type === taskType)
        .filter((task) =>
          task.type === 'SCHEDULE'
            ? range.some((item) => doesScheduleOverlapDate(task, item))
            : range.includes(
                task.plannedDate ??
                  task.targetDate ??
                  (task.startAt?.slice(0, 10) as LocalDateString),
              ),
        )
        .map(cloneTask) as T;
    }
    if (workspacePath?.taskId) {
      return cloneTask(getWorkspaceTask(workspacePath.workspaceId, workspacePath.taskId)) as T;
    }

    const workspaceDdayPath = getWorkspaceDdayPathIds(path);
    if (workspaceDdayPath && workspaceDdayPath.goalId === null) {
      return getWorkspaceDdayGoals(workspaceDdayPath.workspaceId).map(cloneGoal) as T;
    }
    if (workspaceDdayPath?.goalId && workspaceDdayPath.tasks) {
      getWorkspaceDdayGoal(workspaceDdayPath.workspaceId, workspaceDdayPath.goalId);
      return getWorkspaceTasks(workspaceDdayPath.workspaceId)
        .filter((task) => task.ddayGoalId === workspaceDdayPath.goalId)
        .map(cloneTask) as T;
    }
    if (workspaceDdayPath?.goalId) {
      return cloneGoal(
        getWorkspaceDdayGoal(workspaceDdayPath.workspaceId, workspaceDdayPath.goalId),
      ) as T;
    }

    const taskId = getTaskId(path);
    if (taskId && path === `${TASKS_PATH}/${taskId}`) {
      return cloneTask(getTask(taskId)) as T;
    }

    const templateId = getTemplateId(path);
    if (templateId && path === `${TASK_TEMPLATES_PATH}/${templateId}`) {
      const template = getTemplate(templateId);
      return { ...template, recurrenceByDays: [...template.recurrenceByDays] } as T;
    }

    const goalId = getGoalId(path);
    if (goalId && path === `${DDAYS_PATH}/${goalId}`) {
      return cloneGoal(getGoal(goalId)) as T;
    }

    if (goalId && path === `${DDAYS_PATH}/${goalId}/tasks`) {
      return getVisibleTasks()
        .filter((task) => task.ddayGoalId === goalId)
        .map(cloneTask) as T;
    }

    throw new ApiClientError(`Mock API가 지원하지 않는 GET 요청입니다. (${path})`, {
      kind: 'configuration',
    });
  },

  async post<T>(path: string, body?: unknown, options: MockApiOptions = {}) {
    requireNotAborted(options.signal);

    if (path === `${AUTH_PATH}/guest`) {
      return createTokenResponse(createGuestUser()) as T;
    }

    if (path === `${AUTH_PATH}/guest/refresh`) {
      if (currentUser?.accountType !== 'GUEST') {
        throw new ApiClientError('게스트 계정만 token을 갱신할 수 있습니다.', {
          kind: 'http',
          status: 403,
        });
      }

      return createTokenResponse(currentUser) as T;
    }

    if (path === `${AUTH_PATH}/register`) {
      const request = body as RegisterRequest;
      const isGuestPromotion = currentUser?.accountType === 'GUEST';
      const user = registerUser(request);

      return (isGuestPromotion ? createTokenResponse(user) : { ...user }) as T;
    }

    if (path === `${AUTH_PATH}/login`) {
      const request = body as LoginRequest;
      const guestUserId = currentUser?.accountType === 'GUEST' ? currentUser.id : null;
      const user =
        getUser(request.email) ??
        createUser({
          email: request.email,
          displayName: request.email.split('@')[0] || 'Mock User',
          password: request.password,
        });

      if (guestUserId && guestUserId !== user.id) {
        transferOwnership(guestUserId, user.id);
      }

      return createTokenResponse(user) as T;
    }

    if (path === `${AUTH_PATH}/password-reset/request`) {
      return { requested: true, ttlSeconds: 1800 } as T;
    }

    if (path === `${AUTH_PATH}/password-reset/verify`) {
      return { valid: true, maskedEmail: 'm***@example.com' } as T;
    }

    if (path === `${AUTH_PATH}/password-reset/confirm`) {
      return null as T;
    }

    if (path === WORKSPACES_PATH) {
      const request = body as WorkspaceRequest;
      const actor = getMockActor();
      const workspace: WorkspaceResponse = {
        id: nextWorkspaceId++,
        name: request.name,
        description: request.description ?? null,
        createdByUserId: actor.id,
        createdAt: now,
        updatedAt: null,
      };
      workspaces.push(workspace);
      workspaceMembers.push({
        id: nextWorkspaceMemberId++,
        workspaceId: workspace.id,
        userId: actor.id,
        email: actor.email ?? '',
        displayName: actor.displayName ?? '',
        role: 'OWNER',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: null,
      });
      return { ...workspace } as T;
    }

    const workspacePath = getWorkspacePathIds(path);
    if (workspacePath && path === `${WORKSPACES_PATH}/${workspacePath.workspaceId}/members`) {
      getWorkspace(workspacePath.workspaceId);
      const request = body as WorkspaceInviteRequest;
      const user = users.find((item) => item.email === request.email);
      if (!user)
        throw new ApiClientError('등록 사용자를 찾을 수 없습니다.', { kind: 'http', status: 404 });
      const member: WorkspaceMemberResponse = {
        id: nextWorkspaceMemberId++,
        workspaceId: workspacePath.workspaceId,
        userId: user.id,
        email: user.email ?? '',
        displayName: user.displayName ?? '',
        role: request.role ?? 'VIEWER',
        status: 'PENDING',
        createdAt: now,
        updatedAt: null,
      };
      workspaceMembers.push(member);
      return cloneWorkspaceMember(member) as T;
    }
    if (workspacePath && path === `${WORKSPACES_PATH}/${workspacePath.workspaceId}/tasks`) {
      const request = body as TaskUpsertRequest;
      const task = createTask({
        id: nextTaskId++,
        title: request.title,
        description: request.description ?? null,
        type: request.type ?? 'TODO',
        startAt: request.startAt ?? null,
        endAt: request.endAt ?? null,
        allDay: request.allDay,
        category: request.category ?? null,
        status: 'TODAY',
        plannedDate: (request.startAt?.slice(0, 10) as LocalDateString | undefined) ?? today,
      });
      getWorkspaceTasks(workspacePath.workspaceId).unshift(task);
      return cloneTask(task) as T;
    }

    const workspaceDdayPath = getWorkspaceDdayPathIds(path);
    if (workspaceDdayPath && workspaceDdayPath.goalId === null) {
      const request = body as DdayGoalRequest;
      const goal: DdayGoalResponse = {
        id: nextGoalId++,
        title: request.title,
        targetDate: request.targetDate,
        daysLeft: getDaysLeft(request.targetDate),
        createdAt: now,
      };
      getWorkspaceDdayGoals(workspaceDdayPath.workspaceId).unshift(goal);
      return cloneGoal(goal) as T;
    }

    if (path === TASKS_PATH) {
      const request = body as TaskUpsertRequest;
      const task = createTask({
        id: nextTaskId,
        title: request.title,
        description: request.description ?? null,
        type: request.type ?? 'TODO',
        startAt: request.startAt ?? null,
        endAt: request.endAt ?? null,
        allDay: request.allDay,
        category: request.category ?? null,
        status: request.type === 'SCHEDULE' ? 'TODAY' : 'INBOX',
      });
      applyTaskRecurrence(task, request);

      nextTaskId += 1;
      tasks.unshift(task);
      rememberTask(task.id);

      return cloneTask(task) as T;
    }

    if (path === `${TASKS_PATH}/quick-capture`) {
      const request = body as TaskQuickCaptureRequest;
      const parsed = parseMockQuickCapture(request);
      const startAt = parsed.parsedDate
        ? `${parsed.parsedDate}T${parsed.parsedTime ?? '00:00:00'}`
        : null;
      const endAt = parsed.parsedDate
        ? getMockQuickCaptureEndAt(parsed.parsedDate, parsed.parsedTime)
        : null;
      const task = createTask({
        id: nextTaskId,
        title: parsed.title,
        description: parsed.description,
        type: parsed.parsed ? 'SCHEDULE' : 'TODO',
        startAt,
        endAt,
        allDay: parsed.parsed && !parsed.parsedTime,
        category: request.defaultCategory ?? null,
        status: parsed.parsed ? 'TODAY' : 'INBOX',
      });

      nextTaskId += 1;
      tasks.unshift(task);
      rememberTask(task.id);

      return {
        task: cloneTask(task),
        parsed: parsed.parsed,
        originalText: parsed.originalText,
        parsedDate: parsed.parsedDate,
        parsedTime: parsed.parsedTime,
        parsedType: parsed.parsed ? 'SCHEDULE' : 'TODO',
        parsedRecurrenceFrequency: parsed.recurrenceFrequency,
        parsedByDays: parsed.parsedByDays,
        timeZone: request.timeZone ?? 'Asia/Seoul',
      } satisfies TaskQuickCaptureResponse as T;
    }

    if (path === TASK_TEMPLATES_PATH) {
      const request = body as TaskTemplateRequest;
      const template = applyTemplateRequest(
        {
          id: nextTemplateId,
          title: request.title,
          description: null,
          type: 'TODO',
          category: null,
          allDay: false,
          defaultStartTime: null,
          defaultDurationMinutes: null,
          recurrenceFrequency: null,
          recurrenceInterval: 1,
          recurrenceByDays: [],
          createdAt: now,
          updatedAt: null,
        },
        request,
      );
      template.updatedAt = null;
      nextTemplateId += 1;
      taskTemplates.push(template);
      return { ...template, recurrenceByDays: [...template.recurrenceByDays] } as T;
    }

    const templateId = getTemplateId(path);
    if (templateId && path === `${TASK_TEMPLATES_PATH}/${templateId}/tasks`) {
      const template = getTemplate(templateId);
      const request = body as TaskTemplateCreateTaskRequest;
      const targetDate = request.targetDate ?? null;
      const isSchedule = template.type === 'SCHEDULE';
      const startAt =
        isSchedule && targetDate
          ? `${targetDate}T${template.allDay ? '00:00:00' : (template.defaultStartTime ?? '09:00:00')}`
          : null;
      const task = createTask({
        id: nextTaskId,
        title: request.title ?? template.title,
        description: request.description ?? template.description,
        type: template.type,
        category: request.category ?? template.category,
        allDay: template.allDay,
        startAt,
        endAt: null,
        status: isSchedule ? 'TODAY' : 'INBOX',
        plannedDate: isSchedule ? targetDate : null,
        targetDate: isSchedule ? targetDate : null,
      });
      nextTaskId += 1;
      tasks.unshift(task);
      rememberTask(task.id);
      return cloneTask(task) as T;
    }

    if (path === DDAYS_PATH) {
      const request = body as DdayGoalRequest;
      const goal: DdayGoalResponse = {
        id: nextGoalId,
        title: request.title,
        targetDate: request.targetDate,
        daysLeft: getDaysLeft(request.targetDate),
        createdAt: now,
      };

      nextGoalId += 1;
      ddayGoals.unshift(goal);
      rememberGoal(goal.id);

      return cloneGoal(goal) as T;
    }

    const goalId = getGoalId(path);
    if (goalId && path === `${DDAYS_PATH}/${goalId}/tasks`) {
      const goal = getGoal(goalId);
      const request = body as DdayGoalTaskRequest;
      const task = createTask({
        id: nextTaskId,
        title: request.title,
        type: 'TODO',
        allDay: false,
        startAt: null,
        endAt: null,
        status: 'TODAY',
        plannedDate: request.date,
        targetDate: request.date,
        todayOrder: getNextTodayOrder(request.date),
        ddayGoalId: goal.id,
        ddayGoalTitle: goal.title,
        ddayGoalTargetDate: goal.targetDate,
        ddayDaysLeft: getDaysLeft(goal.targetDate),
      });

      nextTaskId += 1;
      tasks.unshift(task);
      rememberTask(task.id);

      return cloneTask(task) as T;
    }

    throw new ApiClientError(`Mock API가 지원하지 않는 POST 요청입니다. (${path})`, {
      kind: 'configuration',
    });
  },

  async put<T>(path: string, body?: unknown, options: MockApiOptions = {}) {
    requireNotAborted(options.signal);

    const taskId = getTaskId(path);
    if (taskId && path === `${TASKS_PATH}/${taskId}`) {
      return applyTaskRequest(getTask(taskId), body as TaskUpsertRequest) as T;
    }

    const templateId = getTemplateId(path);
    if (templateId && path === `${TASK_TEMPLATES_PATH}/${templateId}`) {
      return applyTemplateRequest(getTemplate(templateId), body as TaskTemplateRequest) as T;
    }

    const workspacePath = getWorkspacePathIds(path);
    if (workspacePath?.taskId) {
      return applyTaskRequest(
        getWorkspaceTask(workspacePath.workspaceId, workspacePath.taskId),
        body as TaskUpsertRequest,
      ) as T;
    }
    if (workspacePath && path === `${WORKSPACES_PATH}/${workspacePath.workspaceId}`) {
      const workspace = getWorkspace(workspacePath.workspaceId);
      const request = body as WorkspaceRequest;
      workspace.name = request.name;
      workspace.description = request.description ?? null;
      workspace.updatedAt = now;
      return { ...workspace } as T;
    }

    throw new ApiClientError(`Mock API가 지원하지 않는 PUT 요청입니다. (${path})`, {
      kind: 'configuration',
    });
  },

  async patch<T>(path: string, _body?: unknown, options: MockApiOptions = {}) {
    requireNotAborted(options.signal);

    const workspaceTaskDdayPath = getWorkspaceTaskDdayPathIds(path);
    if (workspaceTaskDdayPath) {
      const task = getWorkspaceTask(
        workspaceTaskDdayPath.workspaceId,
        workspaceTaskDdayPath.taskId,
      );
      const goal = getWorkspaceDdayGoal(
        workspaceTaskDdayPath.workspaceId,
        Number(options.query?.ddayGoalId),
      );
      task.ddayGoalId = goal.id;
      task.ddayGoalTitle = goal.title;
      task.ddayGoalTargetDate = goal.targetDate;
      task.ddayDaysLeft = goal.daysLeft;
      task.updatedAt = now;
      return cloneTask(task) as T;
    }

    const workspacePath = getWorkspacePathIds(path);
    if (workspacePath?.memberId) {
      const member = workspaceMembers.find(
        (item) =>
          item.id === workspacePath.memberId && item.workspaceId === workspacePath.workspaceId,
      );
      if (!member)
        throw new ApiClientError('Workspace 멤버를 찾을 수 없습니다.', {
          kind: 'http',
          status: 404,
        });
      const request = _body as WorkspaceMemberUpdateRequest;
      if (request.role) member.role = request.role;
      if (request.status) member.status = request.status;
      member.updatedAt = now;
      return cloneWorkspaceMember(member) as T;
    }

    const taskId = getTaskId(path);
    if (!taskId) {
      throw new ApiClientError(`Mock API가 지원하지 않는 PATCH 요청입니다. (${path})`, {
        kind: 'configuration',
      });
    }

    const task = getTask(taskId);
    const date = getDate(options.query);

    if (path === `${TASKS_PATH}/${taskId}/done`) {
      return setTaskStatus(task, 'DONE', date) as T;
    }

    if (path === `${TASKS_PATH}/${taskId}/today`) {
      return setTaskStatus(task, 'TODAY', date) as T;
    }

    if (path === `${TASKS_PATH}/${taskId}/inbox`) {
      return setTaskStatus(task, 'INBOX') as T;
    }

    if (path === `${TASKS_PATH}/${taskId}/today-order`) {
      return reorderToday(
        taskId,
        date,
        String(options.query?.direction ?? 'DOWN') as TodayOrderDirection,
      ) as T;
    }

    if (path === `${TASKS_PATH}/${taskId}/defer-reason`) {
      const reason = String(options.query?.reason) as DeferReason;
      task.deferReason = reason;
      task.deferReasonLabel = deferReasonLabels[reason] ?? null;
      task.updatedAt = now;

      return cloneTask(task) as T;
    }

    if (path === `${TASKS_PATH}/${taskId}/dday-goal`) {
      return connectGoal(task, Number(options.query?.ddayGoalId)) as T;
    }

    if (path === `${TASKS_PATH}/${taskId}/done/cancel`) {
      return setTaskStatus(task, 'TODAY', date) as T;
    }

    throw new ApiClientError(`Mock API가 지원하지 않는 PATCH 요청입니다. (${path})`, {
      kind: 'configuration',
    });
  },

  async delete<T>(path: string, options: MockApiOptions = {}) {
    requireNotAborted(options.signal);

    const workspaceTaskDdayPath = getWorkspaceTaskDdayPathIds(path);
    if (workspaceTaskDdayPath) {
      const task = getWorkspaceTask(
        workspaceTaskDdayPath.workspaceId,
        workspaceTaskDdayPath.taskId,
      );
      task.ddayGoalId = null;
      task.ddayGoalTitle = null;
      task.ddayGoalTargetDate = null;
      task.ddayDaysLeft = null;
      task.updatedAt = now;
      return cloneTask(task) as T;
    }

    const workspacePath = getWorkspacePathIds(path);
    if (workspacePath?.memberId) {
      const member = workspaceMembers.find(
        (item) =>
          item.id === workspacePath.memberId && item.workspaceId === workspacePath.workspaceId,
      );
      if (!member)
        throw new ApiClientError('Workspace 멤버를 찾을 수 없습니다.', {
          kind: 'http',
          status: 404,
        });
      member.status = 'REMOVED';
      member.updatedAt = now;
      return null as T;
    }
    if (workspacePath && path === `${WORKSPACES_PATH}/${workspacePath.workspaceId}`) {
      getWorkspace(workspacePath.workspaceId);
      workspaces.splice(
        workspaces.findIndex((item) => item.id === workspacePath.workspaceId),
        1,
      );
      workspaceTasks.delete(workspacePath.workspaceId);
      workspaceDdayGoals.delete(workspacePath.workspaceId);
      return null as T;
    }
    if (workspacePath?.taskId) {
      const stored = getWorkspaceTasks(workspacePath.workspaceId);
      const index = stored.findIndex((task) => task.id === workspacePath.taskId);
      if (index < 0) getWorkspaceTask(workspacePath.workspaceId, workspacePath.taskId);
      stored.splice(index, 1);
      return null as T;
    }

    const workspaceDdayPath = getWorkspaceDdayPathIds(path);
    if (workspaceDdayPath?.goalId && !workspaceDdayPath.tasks) {
      const stored = getWorkspaceDdayGoals(workspaceDdayPath.workspaceId);
      const index = stored.findIndex((goal) => goal.id === workspaceDdayPath.goalId);
      if (index < 0) {
        getWorkspaceDdayGoal(workspaceDdayPath.workspaceId, workspaceDdayPath.goalId);
      }
      stored.splice(index, 1);
      getWorkspaceTasks(workspaceDdayPath.workspaceId).forEach((task) => {
        if (task.ddayGoalId === workspaceDdayPath.goalId) {
          task.ddayGoalId = null;
          task.ddayGoalTitle = null;
          task.ddayGoalTargetDate = null;
          task.ddayDaysLeft = null;
        }
      });
      return null as T;
    }

    const taskId = getTaskId(path);
    if (taskId && path === `${TASKS_PATH}/${taskId}`) {
      getTask(taskId);
      const index = tasks.findIndex((task) => task.id === taskId);

      if (index >= 0) {
        tasks.splice(index, 1);
      }

      return null as T;
    }

    const templateId = getTemplateId(path);
    if (templateId && path === `${TASK_TEMPLATES_PATH}/${templateId}`) {
      getTemplate(templateId);
      const index = taskTemplates.findIndex((template) => template.id === templateId);
      taskTemplates.splice(index, 1);
      return null as T;
    }

    if (taskId && path === `${TASKS_PATH}/${taskId}/defer-reason`) {
      const task = getTask(taskId);

      task.deferReason = null;
      task.deferReasonLabel = null;
      task.updatedAt = now;

      return cloneTask(task) as T;
    }

    if (taskId && path === `${TASKS_PATH}/${taskId}/dday-goal`) {
      return disconnectGoal(getTask(taskId)) as T;
    }

    const goalId = getGoalId(path);
    if (goalId && path === `${DDAYS_PATH}/${goalId}`) {
      getGoal(goalId);
      const index = ddayGoals.findIndex((goal) => goal.id === goalId);

      if (index >= 0) {
        ddayGoals.splice(index, 1);
      }

      tasks.forEach((task) => {
        if (task.ddayGoalId === goalId) {
          disconnectGoal(task);
        }
      });

      return null as T;
    }

    throw new ApiClientError(`Mock API가 지원하지 않는 DELETE 요청입니다. (${path})`, {
      kind: 'configuration',
    });
  },
};
