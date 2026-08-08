import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';

import { authApi, initializeAccessToken } from '@/services/api';

import { queryClient } from './query-provider';

export function AuthTokenBootstrap({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    initializeAccessToken()
      .then(async (token) => {
        if (!token) {
          const guestSession = await authApi.guest();
          queryClient.setQueryData(['auth', 'me'], guestSession.user);
          return;
        }

        const user = await authApi.me();
        queryClient.setQueryData(['auth', 'me'], user);
      })
      .catch(() => {
        // 401은 API client가 token 삭제와 로그인 유도를 처리한다.
        // 네트워크 오류는 저장된 token을 유지하고 다음 사용자 동작에서 다시 확인한다.
      })
      .finally(() => {
        if (mounted) {
          setReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return children;
}
