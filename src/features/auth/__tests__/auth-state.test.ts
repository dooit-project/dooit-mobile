import type { AuthenticatedUserResponse } from '@/types';

import { resolveAuthState } from '../use-auth-state';

const guest: AuthenticatedUserResponse = {
  id: 1,
  accountType: 'GUEST',
  email: null,
  displayName: null,
  role: 'USER',
};

const registered: AuthenticatedUserResponse = {
  id: 2,
  accountType: 'REGISTERED',
  email: 'user@example.com',
  displayName: 'User',
  role: 'USER',
};

describe('resolveAuthState', () => {
  it('사용자 정보를 확인하는 동안 bootstrapping 상태를 반환한다', () => {
    expect(resolveAuthState({ hasToken: true, isPending: true })).toEqual({
      status: 'bootstrapping',
    });
  });

  it('게스트와 정식 사용자를 구분한다', () => {
    expect(resolveAuthState({ hasToken: true, isPending: false, user: guest })).toEqual({
      status: 'guest',
      user: guest,
    });
    expect(resolveAuthState({ hasToken: true, isPending: false, user: registered })).toEqual({
      status: 'registered',
      user: registered,
    });
  });

  it('token 또는 사용자 정보가 없으면 error 상태를 반환한다', () => {
    expect(resolveAuthState({ hasToken: false, isPending: false }).status).toBe('error');
  });
});
