import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { authApi, getAccessToken, subscribeAccessToken } from '@/services/api';
import type { AuthenticatedUserResponse } from '@/types';

export type AuthState =
  | { status: 'bootstrapping' }
  | { status: 'guest'; user: AuthenticatedUserResponse }
  | { status: 'registered'; user: AuthenticatedUserResponse }
  | { status: 'error'; error: Error };

type ResolveAuthStateOptions = {
  hasToken: boolean;
  isPending: boolean;
  user?: AuthenticatedUserResponse;
  error?: Error | null;
};

export function resolveAuthState({
  hasToken,
  isPending,
  user,
  error,
}: ResolveAuthStateOptions): AuthState {
  if (hasToken && (isPending || !user) && !error) {
    return { status: 'bootstrapping' };
  }

  if (error) {
    return { status: 'error', error };
  }

  if (!hasToken || !user) {
    return { status: 'error', error: new Error('인증 정보를 확인할 수 없어요.') };
  }

  return user.accountType === 'GUEST' ? { status: 'guest', user } : { status: 'registered', user };
}

export function useAuthState() {
  const [hasToken, setHasToken] = useState(() => Boolean(getAccessToken()));

  useEffect(() => subscribeAccessToken((token) => setHasToken(Boolean(token))), []);

  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: ({ signal }) => authApi.me(signal),
    enabled: hasToken,
    retry: false,
  });

  return resolveAuthState({
    hasToken,
    isPending: me.isPending,
    user: me.data,
    error: me.error,
  });
}
