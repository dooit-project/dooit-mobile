import { useRouter } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';

import { getAuthAccountType, subscribeSessionExpired } from '@/services/api';
import type { AccountType, AuthenticatedUserResponse } from '@/types';

import { queryClient } from './query-provider';

export function getSessionExpiryParams(
  user: AuthenticatedUserResponse | undefined,
  persistedAccountType: AccountType | null = null,
) {
  return (user?.accountType ?? persistedAccountType) === 'GUEST'
    ? { guestExpired: '1' as const }
    : { expired: '1' as const };
}

export function SessionExpiryRedirect({ children }: PropsWithChildren) {
  const router = useRouter();

  useEffect(
    () =>
      subscribeSessionExpired(() => {
        const user = queryClient.getQueryData<AuthenticatedUserResponse>(['auth', 'me']);
        queryClient.clear();
        router.replace({
          pathname: '/login',
          params: getSessionExpiryParams(user, getAuthAccountType()),
        });
      }),
    [router],
  );

  return children;
}
