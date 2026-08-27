import { request, supportsIdempotency } from '../api-client';

jest.mock('@/config', () => ({
  env: { apiMode: 'real', apiUrl: 'https://api.example.com' },
  requireApiUrl: () => 'https://api.example.com',
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => '9d01851c-3a42-44d5-bf10-461481d86543'),
}));

describe('api client idempotency', () => {
  it.each([
    '/api/v1/auth/guest',
    '/api/v1/tasks',
    '/api/v1/tasks/quick-capture',
    '/api/v1/task-templates',
    '/api/v1/task-templates/7/tasks',
    '/api/v1/dday-goals',
    '/api/v1/dday-goals/8/tasks',
    '/api/v1/workspaces',
    '/api/v1/workspaces/3/members',
    '/api/v1/workspaces/3/tasks',
    '/api/v1/workspaces/3/dday-goals',
  ])('%s 생성 POST를 멱등성 대상으로 분류한다', (path) => {
    expect(supportsIdempotency(path)).toBe(true);
  });

  it.each(['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/tasks/3'])(
    '%s 요청은 멱등성 대상에서 제외한다',
    (path) => {
      expect(supportsIdempotency(path)).toBe(false);
    },
  );

  it('대상 생성 요청에 UUID v4 key를 첨부한다', async () => {
    const fetchMock = jest.fn().mockResolvedValue(apiSuccess({ id: 1 }));
    globalThis.fetch = fetchMock;

    await request('/api/v1/tasks', { method: 'POST', body: { title: '할 일' } });

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('Idempotency-Key')).toBe('9d01851c-3a42-44d5-bf10-461481d86543');
  });

  it('timeout 뒤 같은 key로 한 번 재시도한다', async () => {
    const keys: string[] = [];
    const fetchMock = jest
      .fn()
      .mockImplementationOnce((_url: string, options: RequestInit) => {
        keys.push(new Headers(options.headers).get('Idempotency-Key') ?? '');
        return new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        });
      })
      .mockImplementationOnce((_url: string, options: RequestInit) => {
        keys.push(new Headers(options.headers).get('Idempotency-Key') ?? '');
        return Promise.resolve(apiSuccess({ id: 1 }));
      });
    globalThis.fetch = fetchMock;

    await expect(
      request('/api/v1/tasks', {
        method: 'POST',
        body: { title: '할 일' },
        timeoutMs: 1,
      }),
    ).resolves.toEqual({ id: 1 });

    expect(keys).toEqual([
      '9d01851c-3a42-44d5-bf10-461481d86543',
      '9d01851c-3a42-44d5-bf10-461481d86543',
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

function apiSuccess(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify({ status: 'success', data, error: null, timestamp: '2026-08-27T10:00:00' }),
  };
}
