import * as Crypto from 'expo-crypto';

import { env, requireApiUrl } from '@/config';
import type { TokenResponse } from '@/types';
import { parseApiLocalDateTime } from '@/utils';

import { ApiClientError } from './api-error';
import { notifySessionExpired } from './auth-session';
import {
  clearSessionCredential,
  getAccessToken,
  getAccessTokenExpiresAt,
  getAuthAccountType,
  getRefreshToken,
  setAuthAccountType,
  setSessionCredential,
} from './auth-token-store';
import { mockApiClient } from './mock-api-client';

const DEFAULT_TIMEOUT_MS = 10_000;
const PROACTIVE_REFRESH_WINDOW_MS = 2 * 60 * 1_000;
const AUTH_PATH = '/api/v1/auth';
const IDEMPOTENT_CREATE_PATHS = [
  /^\/api\/v1\/auth\/guest$/,
  /^\/api\/v1\/tasks$/,
  /^\/api\/v1\/tasks\/\d+\/checklist-items$/,
  /^\/api\/v1\/tasks\/quick-capture$/,
  /^\/api\/v1\/task-templates$/,
  /^\/api\/v1\/task-templates\/\d+\/tasks$/,
  /^\/api\/v1\/dday-goals$/,
  /^\/api\/v1\/dday-goals\/\d+\/tasks$/,
  /^\/api\/v1\/workspaces$/,
  /^\/api\/v1\/workspaces\/\d+\/members$/,
  /^\/api\/v1\/workspaces\/\d+\/tasks$/,
  /^\/api\/v1\/workspaces\/\d+\/dday-goals$/,
];

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiEnvelope<T> = {
  status: 'success' | 'fail';
  data?: T;
  error?: {
    code: number;
    message: string;
  };
  timestamp: string;
};

type ApiRequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  method?: HttpMethod;
  query?: QueryParams;
  body?: unknown;
  timeoutMs?: number;
  skipAuthRefresh?: boolean;
  retriedAfterRefresh?: boolean;
  idempotencyKey?: string;
  retriedAfterTimeout?: boolean;
};

let refreshPromise: Promise<TokenResponse> | null = null;

function createIdempotencyKey() {
  return Crypto.randomUUID();
}

export function supportsIdempotency(path: string, method: HttpMethod = 'POST') {
  return method === 'POST' && IDEMPOTENT_CREATE_PATHS.some((pattern) => pattern.test(path));
}

function canRefreshRequest(path: string) {
  return ![
    `${AUTH_PATH}/guest`,
    `${AUTH_PATH}/guest/refresh`,
    `${AUTH_PATH}/refresh`,
    `${AUTH_PATH}/register`,
    `${AUTH_PATH}/login`,
    `${AUTH_PATH}/logout`,
  ].includes(path);
}

function shouldRefreshAccessToken(now = Date.now()) {
  const refreshToken = getRefreshToken();
  const expiresAt = getAccessTokenExpiresAt();
  if (!refreshToken || !expiresAt) {
    return false;
  }

  const expiration = parseApiLocalDateTime(expiresAt);
  return expiration ? expiration.getTime() - now <= PROACTIVE_REFRESH_WINDOW_MS : false;
}

async function refreshSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiClientError('세션을 갱신할 수 없습니다.', { kind: 'api' });
  }

  const path =
    getAuthAccountType() === 'GUEST' ? `${AUTH_PATH}/guest/refresh` : `${AUTH_PATH}/refresh`;
  refreshPromise = request<TokenResponse>(path, {
    method: 'POST',
    body: { refreshToken },
    skipAuthRefresh: true,
  })
    .then(async (response) => {
      await setSessionCredential({
        accessToken: response.accessToken,
        accessTokenExpiresAt: response.expiresAt,
        refreshToken: response.refreshToken,
        refreshTokenExpiresAt: response.refreshExpiresAt,
      });
      await setAuthAccountType(response.user.accountType);
      return response;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function buildUrl(path: string, query?: QueryParams) {
  let baseUrl: string;

  try {
    baseUrl = requireApiUrl();
  } catch (error) {
    throw new ApiClientError(error instanceof Error ? error.message : 'API 주소를 확인해 주세요.', {
      kind: 'configuration',
      cause: error,
    });
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const search = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      search.set(key, String(value));
    }
  });

  const queryString = search.toString();

  return `${baseUrl}${normalizedPath}${queryString ? `?${queryString}` : ''}`;
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    (value.status === 'success' || value.status === 'fail')
  );
}

async function readBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return { value: null, parseError: undefined };
  }

  try {
    return { value: JSON.parse(text) as unknown, parseError: undefined };
  } catch (error) {
    return { value: null, parseError: error };
  }
}

export async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    query,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers: customHeaders,
    signal: externalSignal,
    skipAuthRefresh = false,
    retriedAfterRefresh = false,
    idempotencyKey: requestedIdempotencyKey,
    retriedAfterTimeout = false,
    ...requestOptions
  } = options;
  const idempotencyKey =
    requestedIdempotencyKey ??
    (supportsIdempotency(path, method) ? createIdempotencyKey() : undefined);

  if (!skipAuthRefresh && canRefreshRequest(path) && shouldRefreshAccessToken()) {
    try {
      await refreshSession();
    } catch {
      // 네트워크 오류일 수 있으므로 기존 access token으로 원 요청을 계속한다.
    }
  }

  const controller = new AbortController();
  const headers = new Headers(customHeaders);
  let timedOut = false;

  headers.set('Accept', 'application/json');
  if (idempotencyKey) {
    headers.set('Idempotency-Key', idempotencyKey);
  }
  const accessToken = getAccessToken();
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const cancelFromExternalSignal = () => controller.abort();
  if (externalSignal?.aborted) {
    controller.abort();
  } else {
    externalSignal?.addEventListener('abort', cancelFromExternalSignal, { once: true });
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(buildUrl(path, query), {
      ...requestOptions,
      method,
      headers,
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const { value: responseBody, parseError } = await readBody(response);
    const envelope = isApiEnvelope(responseBody) ? responseBody : null;

    if (!response.ok) {
      const isCredentialFailure = response.status === 401 && envelope?.error?.code === 11001;
      if (response.status === 401 && accessToken && !isCredentialFailure) {
        if (
          !skipAuthRefresh &&
          !retriedAfterRefresh &&
          canRefreshRequest(path) &&
          getRefreshToken()
        ) {
          try {
            await refreshSession();
            return request<T>(path, { ...options, retriedAfterRefresh: true });
          } catch {
            // refresh 실패가 확정되면 아래에서 세션을 종료한다.
          }
        }

        await clearSessionCredential();
        notifySessionExpired();
      }

      throw new ApiClientError(
        envelope?.error?.message ?? `요청에 실패했습니다. (HTTP ${response.status})`,
        {
          kind: 'http',
          status: response.status,
          code: envelope?.error?.code,
        },
      );
    }

    if (parseError) {
      throw new ApiClientError('서버 응답을 읽을 수 없습니다.', {
        kind: 'invalid-response',
        status: response.status,
        cause: parseError,
      });
    }

    if (!envelope) {
      if (response.status === 204) {
        return null as T;
      }

      throw new ApiClientError('올바르지 않은 서버 응답입니다.', {
        kind: 'invalid-response',
        status: response.status,
      });
    }

    if (envelope.status !== 'success') {
      throw new ApiClientError(envelope.error?.message ?? '요청 처리에 실패했습니다.', {
        kind: 'api',
        status: response.status,
        code: envelope.error?.code,
      });
    }

    return envelope.data as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (timedOut) {
      if (idempotencyKey && !retriedAfterTimeout) {
        return request<T>(path, {
          ...options,
          idempotencyKey,
          retriedAfterTimeout: true,
        });
      }

      throw new ApiClientError('요청 시간이 초과되었습니다. 다시 시도해 주세요.', {
        kind: 'timeout',
        cause: error,
      });
    }

    if (externalSignal?.aborted) {
      throw new ApiClientError('요청이 취소되었습니다.', {
        kind: 'cancelled',
        cause: error,
      });
    }

    throw new ApiClientError('서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.', {
      kind: 'network',
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', cancelFromExternalSignal);
  }
}

const realApiClient = {
  get<T>(path: string, options?: Omit<ApiRequestOptions, 'body' | 'method'>) {
    return request<T>(path, { ...options, method: 'GET' });
  },
  post<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body' | 'method'>) {
    return request<T>(path, { ...options, method: 'POST', body });
  },
  put<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body' | 'method'>) {
    return request<T>(path, { ...options, method: 'PUT', body });
  },
  patch<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body' | 'method'>) {
    return request<T>(path, { ...options, method: 'PATCH', body });
  },
  delete<T>(path: string, options?: Omit<ApiRequestOptions, 'body' | 'method'>) {
    return request<T>(path, { ...options, method: 'DELETE' });
  },
};

export const apiClient = env.apiMode === 'mock' ? mockApiClient : realApiClient;
