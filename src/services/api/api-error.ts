export type ApiErrorKind =
  | 'configuration'
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'http'
  | 'api'
  | 'invalid-response';

type ApiClientErrorOptions = {
  kind: ApiErrorKind;
  status?: number;
  code?: number;
  retryAfterSeconds?: number;
  cause?: unknown;
};

export class ApiClientError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: number;
  readonly retryAt?: number;

  constructor(message: string, options: ApiClientErrorOptions) {
    super(message, { cause: options.cause });
    this.name = 'ApiClientError';
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code;
    if (options.retryAfterSeconds !== undefined) {
      const retryAt = Date.now() + options.retryAfterSeconds * 1000;
      if (Number.isSafeInteger(retryAt) && options.retryAfterSeconds >= 0) this.retryAt = retryAt;
    }
  }
}

/** Missing, hidden or invalid headers stay unknown; no invented cooldown. */
export function parseRetryAfterSeconds(value: string | null, now = Date.now()): number | undefined {
  if (!value?.trim()) return undefined;
  const normalized = value.trim();
  if (/^\d+$/.test(normalized)) {
    const seconds = Number(normalized);
    return Number.isSafeInteger(seconds) && Number.isSafeInteger(now + seconds * 1000)
      ? seconds
      : undefined;
  }
  // Retry-After may also be an HTTP date. Exclude numeric/negative values Date.parse accepts loosely.
  if (!/^[A-Za-z]{3}, /.test(normalized)) return undefined;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? Math.max(0, Math.ceil((timestamp - now) / 1000)) : undefined;
}

export function getUserFacingApiErrorMessage(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return error instanceof Error
      ? error.message
      : '알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
  }

  switch (error.kind) {
    case 'network':
      return '서버에 연결할 수 없어요. 네트워크 상태를 확인해 주세요.';
    case 'timeout':
      return '응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.';
    case 'configuration':
      return 'API 연결 설정을 확인해 주세요.';
    case 'invalid-response':
      return '서버 응답을 읽을 수 없어요. 잠시 후 다시 시도해 주세요.';
    case 'cancelled':
      return '요청이 취소되었어요.';
    case 'http':
      if (error.status === 403) {
        return '접근 권한이 없어요.';
      }

      if ((error.status ?? 0) >= 500) {
        return '서버가 잠시 불안정해요. 잠시 후 다시 시도해 주세요.';
      }

      return error.message;
    case 'api':
      return error.message;
  }
}
