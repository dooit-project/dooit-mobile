import type { AuthenticatedUserResponse, TaskResponse, TokenResponse, UserResponse } from '@/types';

import { mockApiClient, restoreGuestUserFromAccessToken } from '../mock-api-client';

describe('Mock auth API', () => {
  it('저장된 mock 게스트 token에서 같은 게스트 사용자를 복원한다', () => {
    const restored = restoreGuestUserFromAccessToken('mock-access-token-guest-42');

    expect(restored).toMatchObject({
      id: 42,
      accountType: 'GUEST',
      email: null,
      displayName: null,
    });
  });

  it('게스트 계정과 token을 발급한다', async () => {
    const response = await mockApiClient.post<TokenResponse>('/api/v1/auth/guest');
    const me = await mockApiClient.get<AuthenticatedUserResponse>('/api/v1/auth/me');

    expect(response.tokenType).toBe('Bearer');
    expect(response.user.accountType).toBe('GUEST');
    expect(response.user.email).toBeNull();
    expect(me.accountType).toBe('GUEST');
  });

  it('게스트 token 갱신 시 같은 사용자 id를 유지한다', async () => {
    const guest = await mockApiClient.post<TokenResponse>('/api/v1/auth/guest');
    const refreshed = await mockApiClient.post<TokenResponse>('/api/v1/auth/guest/refresh');

    expect(refreshed.user.id).toBe(guest.user.id);
    expect(refreshed.user.accountType).toBe('GUEST');
  });

  it('회원가입 응답을 반환한다', async () => {
    await mockApiClient.post<TokenResponse>('/api/v1/auth/login', {
      email: 'demo@todolab.app',
      password: 'password123',
    });
    const response = await mockApiClient.post<UserResponse>('/api/v1/auth/register', {
      email: 'mock-register@example.com',
      password: 'password123',
      displayName: 'Mock Register',
    });

    expect(response.email).toBe('mock-register@example.com');
    expect(response.accountType).toBe('REGISTERED');
    expect(response.displayName).toBe('Mock Register');
    expect(response.role).toBe('USER');
    expect(response.updatedAt).toBeNull();
  });

  it('게스트 회원가입은 같은 사용자 id를 정식 계정으로 승격한다', async () => {
    const guest = await mockApiClient.post<TokenResponse>('/api/v1/auth/guest');
    const promoted = await mockApiClient.post<TokenResponse>('/api/v1/auth/register', {
      email: 'promoted-guest@example.com',
      password: 'password123',
      displayName: 'Promoted Guest',
    });
    const me = await mockApiClient.get<AuthenticatedUserResponse>('/api/v1/auth/me');

    expect(promoted.user.id).toBe(guest.user.id);
    expect(promoted.user.accountType).toBe('REGISTERED');
    expect(promoted.accessToken).toContain('mock-access-token-registered');
    expect(me.accountType).toBe('REGISTERED');
    expect(me.email).toBe('promoted-guest@example.com');
  });

  it('신규 게스트는 샘플 데이터 없이 시작하고 작성한 데이터는 로그인 후에도 유지한다', async () => {
    await mockApiClient.post<TokenResponse>('/api/v1/auth/guest');
    const beforeLogin = await mockApiClient.get<TaskResponse[]>('/api/v1/tasks/today', {
      query: { date: '2026-08-09' },
    });
    const created = await mockApiClient.post<TaskResponse>('/api/v1/tasks', {
      title: '게스트가 처음 만든 할 일',
      type: 'TODO',
      allDay: false,
    });
    const login = await mockApiClient.post<TokenResponse>('/api/v1/auth/login', {
      email: 'demo@todolab.app',
      password: 'password123',
    });
    const afterLogin = await mockApiClient.get<TaskResponse[]>('/api/v1/tasks/inbox');

    expect(login.user.accountType).toBe('REGISTERED');
    expect(login.user.email).toBe('demo@todolab.app');
    expect(beforeLogin).toEqual([]);
    expect(afterLogin.map((task) => task.id)).toContain(created.id);
  });

  it('로그인 후 내 정보 응답을 반환한다', async () => {
    const login = await mockApiClient.post<TokenResponse>('/api/v1/auth/login', {
      email: 'mock-login@example.com',
      password: 'password123',
    });
    const me = await mockApiClient.get<AuthenticatedUserResponse>('/api/v1/auth/me');

    expect(login.tokenType).toBe('Bearer');
    expect(login.accessToken).toContain('mock-access-token');
    expect(login.user.accountType).toBe('REGISTERED');
    expect(me.email).toBe('mock-login@example.com');
  });
});
