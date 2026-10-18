import { request } from '../api-client';
import { ApiClientError } from '../api-error';

jest.mock('@/config', () => ({
  env: { apiMode: 'real' },
  requireApiUrl: () => 'https://api.example.com',
}));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'test-key') }));

describe('AI rate limit transport', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });
  it.each([
    ['120', 120000],
    [null, undefined],
  ] as const)('keeps Retry-After %s and does not retry 429', async (header, delay) => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-18T00:00:00Z'));
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers(header ? { 'Retry-After': header } : {}),
      text: async () =>
        JSON.stringify({ status: 'fail', error: { code: 70010, message: 'rate limit' } }),
    });
    globalThis.fetch = fetchMock;
    const failure = await request('/api/v1/goals/draft', {
      method: 'POST',
      body: { description: '원하는 방향' },
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ApiClientError);
    expect(failure).toMatchObject({ status: 429, code: 70010 });
    expect((failure as ApiClientError).retryAt).toBe(
      delay === undefined ? undefined : Date.now() + delay,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
