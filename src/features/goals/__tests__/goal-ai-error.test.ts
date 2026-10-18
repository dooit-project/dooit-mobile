import { ApiClientError, parseRetryAfterSeconds } from '@/services/api/api-error';

import { getGoalAiFailure } from '../goal-ai-error';

describe('Goal AI fallback state', () => {
  it('separates disabled AI from generic outages and preserves manual/raw-record alternatives', () => {
    const error = new ApiClientError('provider detail', { kind: 'http', status: 503, code: 70009 });
    expect(getGoalAiFailure(error)).toEqual({
      kind: 'unavailable',
      message: '지금은 AI 제안을 사용할 수 없어요. 직접 작성할 수 있어요.',
    });
    expect(getGoalAiFailure(error, 'journey-summary')).toEqual({
      kind: 'unavailable',
      message: '지금은 AI 제안을 사용할 수 없어요. 기록은 그대로 볼 수 있어요.',
    });
    expect(
      getGoalAiFailure(new ApiClientError('generic outage', { kind: 'http', status: 503 })).kind,
    ).toBe('error');
  });
  it('retains a fixed server cooldown and leaves an absent hint unknown', () => {
    const now = Date.now();
    const error = new ApiClientError('rate limit', {
      kind: 'http',
      status: 429,
      code: 70010,
      retryAfterSeconds: 60,
    });
    const state = getGoalAiFailure(error);
    expect(state).toMatchObject({ kind: 'rate-limited', retryAt: error.retryAt });
    expect(error.retryAt).toBeGreaterThanOrEqual(now + 60000);
    expect(getGoalAiFailure(error)).toEqual(state);
    expect(
      getGoalAiFailure(new ApiClientError('limit', { kind: 'http', status: 429, code: 70010 })),
    ).toMatchObject({ kind: 'rate-limited', retryAt: null });
    expect(
      getGoalAiFailure(new ApiClientError('another limit', { kind: 'http', status: 429 })).kind,
    ).toBe('error');
  });
  it('keeps cancellation quiet and distinguishes stale evidence from AI availability', () => {
    expect(getGoalAiFailure(new ApiClientError('cancelled', { kind: 'cancelled' }))).toEqual({
      kind: 'cancelled',
    });
    expect(
      getGoalAiFailure(new ApiClientError('changed', { kind: 'http', status: 409, code: 70008 }))
        .kind,
    ).toBe('journey-changed');
  });
  it('parses Retry-After without inventing values for hidden or malformed headers', () => {
    const now = Date.parse('2026-10-18T00:00:00Z');
    expect(parseRetryAfterSeconds('120', now)).toBe(120);
    expect(parseRetryAfterSeconds('0', now)).toBe(0);
    expect(parseRetryAfterSeconds('Sun, 18 Oct 2026 00:01:00 GMT', now)).toBe(60);
    expect(parseRetryAfterSeconds('Sun, 18 Oct 2026 00:00:00 GMT', now + 1000)).toBe(0);
    for (const input of [null, '', '-1', '1.5', 'later', '999999999999999999999']) {
      expect(parseRetryAfterSeconds(input, now)).toBeUndefined();
    }
  });
});
