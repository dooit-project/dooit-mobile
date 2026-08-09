import { authApi, getAccessToken, isTokenResponse, setAccessToken } from '@/services/api';
import { apiClient } from '@/services/api/api-client';

jest.mock('@/services/api/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const getMock = apiClient.get as jest.Mock;
const postMock = apiClient.post as jest.Mock;

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

describe('Auth API', () => {
  beforeEach(() => {
    installLocalStorage();
    getMock.mockReset();
    postMock.mockReset();
    localStorage.clear();
  });

  it('게스트 계정을 생성하고 access token을 저장한다', async () => {
    postMock.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'guest-access-token',
      expiresAt: '2026-08-09T10:00:00',
      user: {
        id: 10,
        accountType: 'GUEST',
        email: null,
        displayName: null,
        role: 'USER',
        timeZone: 'Asia/Seoul',
        createdAt: '2026-07-09T10:00:00',
        updatedAt: null,
      },
    });

    const response = await authApi.guest();

    expect(postMock).toHaveBeenCalledWith('/api/v1/auth/guest', undefined, {
      signal: undefined,
    });
    expect(response.user.accountType).toBe('GUEST');
    expect(getAccessToken()).toBe('guest-access-token');
  });

  it('회원가입 API를 호출한다', async () => {
    postMock.mockResolvedValue({ id: 1 });
    const request = {
      email: 'user@example.com',
      password: 'password123',
      displayName: 'User',
    };

    await authApi.register(request);

    expect(postMock).toHaveBeenCalledWith('/api/v1/auth/register', request, {
      signal: undefined,
    });
  });

  it('회원가입 실패 시 기존 게스트 access token을 유지한다', async () => {
    await setAccessToken('guest-access-token');
    postMock.mockRejectedValue(new Error('register failed'));

    await expect(
      authApi.register({
        email: 'user@example.com',
        password: 'password123',
        displayName: 'User',
      }),
    ).rejects.toThrow('register failed');

    expect(getAccessToken()).toBe('guest-access-token');
  });

  it('게스트 회원가입 승격 응답이면 정식 access token을 저장한다', async () => {
    await setAccessToken('guest-access-token');
    postMock.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'registered-access-token',
      expiresAt: '2026-09-09T10:00:00',
      user: {
        id: 10,
        accountType: 'REGISTERED',
        email: 'user@example.com',
        displayName: 'User',
        role: 'USER',
        timeZone: 'Asia/Seoul',
        createdAt: '2026-08-09T10:00:00',
        updatedAt: '2026-08-09T10:00:00',
      },
    });

    const response = await authApi.register({
      email: 'user@example.com',
      password: 'password123',
      displayName: 'User',
    });

    expect(isTokenResponse(response)).toBe(true);
    expect(getAccessToken()).toBe('registered-access-token');
  });

  it('로그인 성공 시 access token을 저장한다', async () => {
    postMock.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'access-token',
      expiresAt: '2026-07-14T10:00:00',
      user: {
        id: 1,
        accountType: 'REGISTERED',
        email: 'user@example.com',
        displayName: 'User',
        role: 'USER',
        timeZone: 'Asia/Seoul',
        createdAt: '2026-07-14T09:00:00',
        updatedAt: null,
      },
    });
    const request = { email: 'user@example.com', password: 'password123' };

    await authApi.login(request);

    expect(postMock).toHaveBeenCalledWith('/api/v1/auth/login', request, {
      signal: undefined,
    });
    expect(getAccessToken()).toBe('access-token');
  });

  it('로그인 실패 시 기존 게스트 access token을 유지한다', async () => {
    await setAccessToken('guest-access-token');
    postMock.mockRejectedValue(new Error('login failed'));

    await expect(
      authApi.login({ email: 'user@example.com', password: 'wrong-password' }),
    ).rejects.toThrow('login failed');

    expect(getAccessToken()).toBe('guest-access-token');
  });

  it('로그아웃 후 새 게스트 계정으로 전환한다', async () => {
    await setAccessToken('registered-access-token');
    postMock.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'new-guest-access-token',
      expiresAt: '2026-09-09T10:00:00',
      user: {
        id: 20,
        accountType: 'GUEST',
        email: null,
        displayName: null,
        role: 'USER',
        timeZone: 'Asia/Seoul',
        createdAt: '2026-08-09T10:00:00',
        updatedAt: null,
      },
    });

    const response = await authApi.logoutToGuest();

    expect(postMock).toHaveBeenCalledWith('/api/v1/auth/guest', undefined, {
      signal: undefined,
    });
    expect(response.user.accountType).toBe('GUEST');
    expect(getAccessToken()).toBe('new-guest-access-token');
  });

  it('로그아웃 후 게스트 발급 실패 시 정식 access token을 남기지 않는다', async () => {
    await setAccessToken('registered-access-token');
    postMock.mockRejectedValue(new Error('guest creation failed'));

    await expect(authApi.logoutToGuest()).rejects.toThrow('guest creation failed');

    expect(getAccessToken()).toBeNull();
  });

  it('내 정보 API를 호출한다', async () => {
    getMock.mockResolvedValue({ id: 1, email: 'user@example.com', role: 'USER' });

    await authApi.me();

    expect(getMock).toHaveBeenCalledWith('/api/v1/auth/me', { signal: undefined });
  });

  it('비밀번호 재설정 메일 요청 API를 호출한다', async () => {
    postMock.mockResolvedValue({ accepted: true });
    const request = { email: 'user@example.com' };

    await authApi.requestPasswordReset(request);

    expect(postMock).toHaveBeenCalledWith('/api/v1/auth/password-reset/request', request, {
      signal: undefined,
    });
  });

  it('비밀번호 재설정 token 검증 API를 호출한다', async () => {
    postMock.mockResolvedValue({ valid: true, emailHint: 'u***@example.com' });
    const request = { token: 'reset-token' };

    await authApi.verifyPasswordResetToken(request);

    expect(postMock).toHaveBeenCalledWith('/api/v1/auth/password-reset/verify', request, {
      signal: undefined,
    });
  });

  it('새 비밀번호 저장 API를 호출한다', async () => {
    postMock.mockResolvedValue(null);
    const request = { token: 'reset-token', newPassword: 'new-password123' };

    await authApi.confirmPasswordReset(request);

    expect(postMock).toHaveBeenCalledWith('/api/v1/auth/password-reset/confirm', request, {
      signal: undefined,
    });
  });
});
