import { useRouter } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';

import { subscribeSessionExpired } from '@/services/api';
import type { AuthenticatedUserResponse } from '@/types';

import { queryClient } from './query-provider';

export function getSessionExpiryParams(user: AuthenticatedUserResponse | undefined) {
  return user?.accountType === 'GUEST' ? { guestExpired: '1' as const } : { expired: '1' as const };
}

export function SessionExpiryRedirect({ children }: PropsWithChildren) {
  const router = useRouter();

  useEffect(
    () =>
      subscribeSessionExpired(() => {
        const user = queryClient.getQueryData<AuthenticatedUserResponse>(['auth', 'me']);
        queryClient.clear();
        router.replace({ pathname: '/login', params: getSessionExpiryParams(user) });
      }),
    [router],
  );

  return children;
}
