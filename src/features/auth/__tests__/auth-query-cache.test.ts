import { QueryClient } from '@tanstack/react-query';

import type { AuthenticatedUserResponse } from '@/types';

import { replaceUserQueryCache } from '../auth-query-cache';

const registeredUser: AuthenticatedUserResponse = {
  id: 20,
  accountType: 'REGISTERED',
  email: 'user@example.com',
  displayName: 'User',
  role: 'USER',
};

describe('replaceUserQueryCache', () => {
  it('계정 전환 시 사용자 데이터 cache를 제거하고 새 인증 사용자만 저장한다', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['auth', 'me'], { id: 10, accountType: 'GUEST' });
    queryClient.setQueryData(['tasks', 'today', '2026-08-11'], [{ id: 1 }]);
    queryClient.setQueryData(['dday-goals'], [{ id: 2 }]);

    await replaceUserQueryCache(queryClient, registeredUser);

    expect(queryClient.getQueryData(['auth', 'me'])).toEqual(registeredUser);
    expect(queryClient.getQueryData(['tasks', 'today', '2026-08-11'])).toBeUndefined();
    expect(queryClient.getQueryData(['dday-goals'])).toBeUndefined();

    queryClient.clear();
  });
});
