import { request } from '../api-client';
import { subscribeSessionExpired } from '../auth-session';
import {
  clearAccessToken,
  getAccessToken,
  resetAuthTokenStoreForTesting,
  setAccessToken,
} from '../auth-token-store';

jest.mock('@/config', () => ({
  env: { apiMode: 'real', apiUrl: 'https://api.example.com' },
  requireApiUrl: () => 'https://api.example.com',
}));

describe('api client authorization', () => {
  beforeEach(async () => {
    installLocalStorage();
    localStorage.clear();
    resetAuthTokenStoreForTesting();
    await clearAccessToken();
  });

  it('저장된 access token을 Authorization 헤더로 첨부한다', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          status: 'success',
          data: { ok: true },
          error: null,
          timestamp: '2026-07-14T10:00:00',
        }),
    });
    globalThis.fetch = fetchMock;

    await setAccessToken('access-token');

    await request('/api/v1/auth/me');

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer access-token');
  });

  it('401 응답을 받으면 access token을 삭제하고 세션 만료를 알린다', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          status: 'fail',
          data: null,
          error: { code: 401, message: '로그인이 필요해요.' },
          timestamp: '2026-07-14T10:00:00',
        }),
    });

    const listener = jest.fn();
    const unsubscribe = subscribeSessionExpired(listener);
    await setAccessToken('expired-token');

    await expect(request('/api/v1/auth/me')).rejects.toThrow('로그인이 필요해요.');

    expect(getAccessToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('access token 없이 받은 401은 첫 진입 세션 만료로 알리지 않는다', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          status: 'fail',
          data: null,
          error: { code: 401, message: '로그인이 필요해요.' },
          timestamp: '2026-07-14T10:00:00',
        }),
    });

    const listener = jest.fn();
    const unsubscribe = subscribeSessionExpired(listener);

    await expect(request('/api/v1/auth/me')).rejects.toThrow('로그인이 필요해요.');

    expect(getAccessToken()).toBeNull();
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('로그인 자격 증명 실패 11001은 기존 게스트 token을 유지한다', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          status: 'fail',
          data: null,
          error: { code: 11001, message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
          timestamp: '2026-08-10T10:00:00',
        }),
    });

    const listener = jest.fn();
    const unsubscribe = subscribeSessionExpired(listener);
    await setAccessToken('guest-access-token');

    await expect(
      request('/api/v1/auth/login', {
        method: 'POST',
        body: { email: 'user@example.com', password: 'wrong-password' },
      }),
    ).rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다.');

    expect(getAccessToken()).toBe('guest-access-token');
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('token 오류 11002는 기존 token을 삭제하고 세션 만료를 알린다', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          status: 'fail',
          data: null,
          error: { code: 11002, message: '인증이 필요합니다.' },
          timestamp: '2026-08-10T10:00:00',
        }),
    });

    const listener = jest.fn();
    const unsubscribe = subscribeSessionExpired(listener);
    await setAccessToken('expired-token');

    await expect(request('/api/v1/auth/me')).rejects.toThrow('인증이 필요합니다.');

    expect(getAccessToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('403 응답은 access token을 유지하고 세션 만료로 처리하지 않는다', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () =>
        JSON.stringify({
          status: 'fail',
          data: null,
          error: { code: 11003, message: '접근 권한이 없습니다.' },
          timestamp: '2026-07-14T10:00:00',
        }),
    });

    const listener = jest.fn();
    const unsubscribe = subscribeSessionExpired(listener);
    await setAccessToken('valid-token');

    await expect(request('/api/v1/tasks/999')).rejects.toThrow('접근 권한이 없습니다.');

    expect(getAccessToken()).toBe('valid-token');
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});

function installLocalStorage() {
  let storage: Record<string, string> = {};

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      clear: () => {
        storage = {};
      },
      getItem: (key: string) => storage[key] ?? null,
      removeItem: (key: string) => {
        delete storage[key];
      },
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
    },
  });
}
