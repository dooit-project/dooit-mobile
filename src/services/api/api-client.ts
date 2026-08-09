import { env, requireApiUrl } from '@/config';

import { ApiClientError } from './api-error';
import { notifySessionExpired } from './auth-session';
import { clearAccessToken, getAccessToken } from './auth-token-store';
import { mockApiClient } from './mock-api-client';

const DEFAULT_TIMEOUT_MS = 10_000;

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
};

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

export async function request<T>(path: string, options: ApiRequestOptions = {}) {
  const {
    method = 'GET',
    query,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers: customHeaders,
    signal: externalSignal,
    ...requestOptions
  } = options;
  const controller = new AbortController();
  const headers = new Headers(customHeaders);
  let timedOut = false;

  headers.set('Accept', 'application/json');
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
        void clearAccessToken();
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
