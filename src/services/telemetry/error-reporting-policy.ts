import { ApiClientError } from '@/services/api/api-error';

export const ERROR_LOG_FEATURES = [
  'auth',
  'today',
  'calendar',
  'search',
  'completed',
  'dday',
  'task-detail',
  'profile',
  'workspace',
  'notifications',
  'settings',
] as const;

export type ErrorLogFeature = (typeof ERROR_LOG_FEATURES)[number];
export type ErrorLogPlatform = 'ios' | 'android' | 'web';
export type ItemCountBucket = '0' | '1-10' | '11-50' | '51+';

export type ErrorLogInput = {
  feature: ErrorLogFeature;
  action: string;
  platform: ErrorLogPlatform;
  error?: unknown;
  retryCount?: number;
  itemCount?: number;
};

export type ErrorLogEvent = {
  feature: ErrorLogFeature;
  action: string;
  platform: ErrorLogPlatform;
  errorKind?: string;
  httpStatus?: number;
  apiCode?: number;
  retryCount?: number;
  itemCountBucket?: ItemCountBucket;
};

const SAFE_ACTION_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/;

function normalizeAction(action: string) {
  return SAFE_ACTION_PATTERN.test(action) ? action : 'unknown';
}

function normalizeRetryCount(retryCount: number | undefined) {
  if (retryCount === undefined || !Number.isFinite(retryCount)) {
    return undefined;
  }

  return Math.min(Math.max(Math.floor(retryCount), 0), 10);
}

export function getItemCountBucket(itemCount: number | undefined): ItemCountBucket | undefined {
  if (itemCount === undefined || !Number.isFinite(itemCount)) {
    return undefined;
  }

  const normalizedCount = Math.max(Math.floor(itemCount), 0);

  if (normalizedCount === 0) return '0';
  if (normalizedCount <= 10) return '1-10';
  if (normalizedCount <= 50) return '11-50';
  return '51+';
}

export function createErrorLogEvent(input: ErrorLogInput): ErrorLogEvent {
  const event: ErrorLogEvent = {
    feature: input.feature,
    action: normalizeAction(input.action),
    platform: input.platform,
  };

  if (input.error instanceof ApiClientError) {
    event.errorKind = input.error.kind;
    event.httpStatus = input.error.status;
    event.apiCode = input.error.code;
  } else if (input.error instanceof Error) {
    event.errorKind = 'unexpected';
  } else if (input.error !== undefined) {
    event.errorKind = 'unknown';
  }

  event.retryCount = normalizeRetryCount(input.retryCount);
  event.itemCountBucket = getItemCountBucket(input.itemCount);

  return event;
}
