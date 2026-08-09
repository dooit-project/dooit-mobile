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
  TaskQueryType,
  TaskResponse,
  TaskSearchDateField,
  TaskSearchDateSource,
  TaskSearchItem,
  TaskSearchPage,
  TaskSearchSort,
  TaskStatus,
  TaskType,
  TaskUpsertRequest,
  TokenResponse,
  TodayOrderDirection,
  UserResponse,
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
const DDAYS_PATH = '/api/v1/dday-goals';

let nextUserId = 2;
let nextTaskId = 100;
let nextGoalId = 10;
let currentUser: UserResponse | null = null;

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

function requireNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new ApiClientError('요청이 취소되었습니다.', { kind: 'cancelled' });
  }
}

function getDate(query?: MockQueryParams) {
  return String(query?.date ?? today) as LocalDateString;
}

function getTask(taskId: number) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new ApiClientError('Mock Task를 찾을 수 없습니다.', { kind: 'http', status: 404 });
  }

  return task;
}

function getGoal(goalId: number) {
  const goal = ddayGoals.find((item) => item.id === goalId);

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

  return user;
}

function createTokenResponse(user: UserResponse): TokenResponse {
  currentUser = user;

  return {
    tokenType: 'Bearer',
    accessToken: `mock-access-token-${user.accountType.toLowerCase()}-${user.id}`,
    expiresAt: `${today}T23:59:59`,
    user,
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
  task.updatedAt = now;

  return cloneTask(task);
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
  const orders = tasks
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

  const items: TaskSearchItem[] = tasks
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
  const todayTasks = tasks
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

      return tasks
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

      return tasks
        .filter(
          (task) =>
            task.status === 'TODAY' &&
            (task.plannedDate === date || doesScheduleOverlapDate(task, date)),
        )
        .sort(sortTodayTasks)
        .map(cloneTask) as T;
    }

    if (path === `${TASKS_PATH}/today/recommendations`) {
      const recommendations: TaskRecommendationResponse[] = tasks
        .filter((task) => task.status === 'INBOX' && !task.staleCarryOver)
        .slice(0, 3)
        .map((task) => ({
          task: cloneTask(task),
          reason: 'Mock mode 추천: 날짜 없이 남아 있어 오늘 가볍게 처리하기 좋아요.',
        }));

      return recommendations as T;
    }

    if (path === `${TASKS_PATH}/done`) {
      const date = getDate(options.query);

      return tasks
        .filter((task) => task.status === 'DONE' && task.plannedDate === date)
        .map(cloneTask) as T;
    }

    if (path === `${TASKS_PATH}/stale`) {
      return tasks.filter((task) => task.staleCarryOver).map(cloneTask) as T;
    }

    if (path === `${TASKS_PATH}/inbox`) {
      return tasks
        .filter((task) => task.status === 'INBOX' && !task.staleCarryOver)
        .map(cloneTask) as T;
    }

    if (path === DDAYS_PATH) {
      return ddayGoals.map(cloneGoal) as T;
    }

    const taskId = getTaskId(path);
    if (taskId && path === `${TASKS_PATH}/${taskId}`) {
      return cloneTask(getTask(taskId)) as T;
    }

    const goalId = getGoalId(path);
    if (goalId && path === `${DDAYS_PATH}/${goalId}`) {
      return cloneGoal(getGoal(goalId)) as T;
    }

    if (goalId && path === `${DDAYS_PATH}/${goalId}/tasks`) {
      return tasks.filter((task) => task.ddayGoalId === goalId).map(cloneTask) as T;
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

    if (path === `${AUTH_PATH}/register`) {
      const request = body as RegisterRequest;
      const isGuestPromotion = currentUser?.accountType === 'GUEST';
      const user = registerUser(request);

      return (isGuestPromotion ? createTokenResponse(user) : { ...user }) as T;
    }

    if (path === `${AUTH_PATH}/login`) {
      const request = body as LoginRequest;
      const user =
        getUser(request.email) ??
        createUser({
          email: request.email,
          displayName: request.email.split('@')[0] || 'Mock User',
          password: request.password,
        });

      return createTokenResponse(user) as T;
    }

    if (path === `${AUTH_PATH}/password-reset/request`) {
      return { accepted: true } as T;
    }

    if (path === `${AUTH_PATH}/password-reset/verify`) {
      return { valid: true, emailHint: 'm***@example.com' } as T;
    }

    if (path === `${AUTH_PATH}/password-reset/confirm`) {
      return null as T;
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
        status: 'INBOX',
      });

      nextTaskId += 1;
      tasks.unshift(task);

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

    throw new ApiClientError(`Mock API가 지원하지 않는 PUT 요청입니다. (${path})`, {
      kind: 'configuration',
    });
  },

  async patch<T>(path: string, _body?: unknown, options: MockApiOptions = {}) {
    requireNotAborted(options.signal);

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

    const taskId = getTaskId(path);
    if (taskId && path === `${TASKS_PATH}/${taskId}`) {
      const index = tasks.findIndex((task) => task.id === taskId);

      if (index >= 0) {
        tasks.splice(index, 1);
      }

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
