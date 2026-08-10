import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';

import { Button, InlineNotice, Screen } from '@/components/ui';
import { FirstUseOverview } from '@/features/auth';
import {
  authApi,
  initializeAccessToken,
  initializeAuthAccountType,
  subscribeAccessToken,
} from '@/services/api';
import { completeOnboarding } from '@/services/preferences';
import { spacing } from '@/theme';
import type { AuthenticatedUserResponse } from '@/types';

import { queryClient } from './query-provider';

type BootstrapDependencies = {
  initializeToken: () => Promise<string | null>;
  initializeAccountType?: () => Promise<unknown>;
  getCurrentUser: () => ReturnType<typeof authApi.me>;
  refreshGuest?: () => ReturnType<typeof authApi.refreshGuest>;
  cacheUser: (user: AuthenticatedUserResponse) => void;
};

export type AuthBootstrapStatus =
  | 'loading'
  | 'first-use'
  | 'starting-guest'
  | 'ready'
  | 'session-error';

const PUBLIC_AUTH_PATHS = ['/start', '/login', '/register', '/password-reset'];
const GUEST_FOREGROUND_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1_000;

export function shouldRefreshGuestOnAppActive(
  user: AuthenticatedUserResponse | undefined,
  lastAttemptAt: number,
  now: number,
) {
  return (
    user?.accountType === 'GUEST' && now - lastAttemptAt >= GUEST_FOREGROUND_REFRESH_INTERVAL_MS
  );
}

export async function refreshActiveGuestSession(
  dependencies = {
    getCachedUser: () => queryClient.getQueryData<AuthenticatedUserResponse>(['auth', 'me']),
    refreshGuest: () => authApi.refreshGuest(),
    cacheUser: defaultDependencies.cacheUser,
  },
) {
  const user = dependencies.getCachedUser();
  if (user?.accountType !== 'GUEST') {
    return false;
  }

  try {
    const refreshedSession = await dependencies.refreshGuest();
    dependencies.cacheUser(refreshedSession.user);
    return true;
  } catch {
    return false;
  }
}

export function shouldRenderAppRoutes(status: AuthBootstrapStatus, pathname: string) {
  if (status === 'ready') {
    return true;
  }

  return status !== 'loading' && PUBLIC_AUTH_PATHS.includes(pathname);
}

const defaultDependencies: BootstrapDependencies = {
  initializeToken: initializeAccessToken,
  initializeAccountType: initializeAuthAccountType,
  getCurrentUser: () => authApi.me(),
  refreshGuest: () => authApi.refreshGuest(),
  cacheUser: (user) => queryClient.setQueryData(['auth', 'me'], user),
};

export async function bootstrapAuthSession(dependencies = defaultDependencies) {
  const token = await dependencies.initializeToken();
  if (!token) {
    return 'first-use' as const;
  }

  await dependencies.initializeAccountType?.();

  const user = await dependencies.getCurrentUser();

  if (user.accountType === 'GUEST' && dependencies.refreshGuest) {
    try {
      const refreshedSession = await dependencies.refreshGuest();
      dependencies.cacheUser(refreshedSession.user);
      return 'ready' as const;
    } catch {
      // /auth/me로 확인한 기존 게스트 세션을 유지하고 다음 앱 시작 때 다시 시도한다.
    }
  }

  dependencies.cacheUser(user);
  return 'ready' as const;
}

export async function createGuestSession(
  dependencies = {
    createGuest: () => authApi.guest(),
    cacheUser: defaultDependencies.cacheUser,
    completeFirstUse: completeOnboarding,
  },
) {
  const response = await dependencies.createGuest();
  dependencies.cacheUser(response.user);
  await dependencies.completeFirstUse();
  return response.user;
}

export function AuthTokenBootstrap({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthBootstrapStatus>('loading');
  const [guestErrorMessage, setGuestErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const lastGuestRefreshAttemptAt = useRef(0);

  useEffect(() => {
    let mounted = true;

    bootstrapAuthSession()
      .then((nextStatus) => {
        if (mounted) {
          setStatus(nextStatus);
        }
      })
      .catch(() => {
        if (mounted) {
          setStatus('session-error');
        }
      });

    return () => {
      mounted = false;
    };
  }, [retryKey]);

  useEffect(
    () =>
      subscribeAccessToken((token) => {
        if (!token) {
          return;
        }

        void authApi
          .me()
          .then((user) => {
            defaultDependencies.cacheUser(user);
            setStatus('ready');
          })
          .catch(() => undefined);
      }),
    [],
  );

  useEffect(() => {
    lastGuestRefreshAttemptAt.current = Date.now();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        return;
      }

      const now = Date.now();
      const user = queryClient.getQueryData<AuthenticatedUserResponse>(['auth', 'me']);
      if (!shouldRefreshGuestOnAppActive(user, lastGuestRefreshAttemptAt.current, now)) {
        return;
      }

      lastGuestRefreshAttemptAt.current = now;
      void refreshActiveGuestSession();
    });

    return () => subscription.remove();
  }, []);

  if (shouldRenderAppRoutes(status, pathname)) {
    return children;
  }

  if (status === 'loading') {
    return null;
  }

  if (status === 'session-error') {
    return (
      <Screen contentContainerStyle={styles.errorScreen}>
        <InlineNotice
          tone="danger"
          title="저장된 계정을 확인하지 못했어요"
          message="현재 데이터를 보호하기 위해 새 게스트를 만들지 않았어요. 네트워크 연결을 확인하고 다시 시도해 주세요."
          action={
            <Button
              size="compact"
              variant="ghost"
              onPress={() => {
                setStatus('loading');
                setRetryKey((current) => current + 1);
              }}
            >
              다시 시도
            </Button>
          }
        />
      </Screen>
    );
  }

  if (status === 'first-use' || status === 'starting-guest') {
    return (
      <FirstUseOverview
        errorMessage={guestErrorMessage}
        isStartingGuest={status === 'starting-guest'}
        onStartGuest={() => {
          setGuestErrorMessage(null);
          setStatus('starting-guest');
          void createGuestSession()
            .then(() => setStatus('ready'))
            .catch(() => {
              setGuestErrorMessage(
                '인터넷 연결을 확인하고 다시 시도하거나, 기존 계정으로 로그인해 주세요.',
              );
              setStatus('first-use');
            });
        }}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  errorScreen: {
    justifyContent: 'center',
    paddingVertical: spacing[8],
  },
});
