import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';

import { Button, InlineNotice, Screen } from '@/components/ui';
import { FirstUseOverview } from '@/features/auth';
import { authApi, initializeAccessToken, subscribeAccessToken } from '@/services/api';
import { completeOnboarding } from '@/services/preferences';
import { spacing } from '@/theme';
import type { AuthenticatedUserResponse } from '@/types';

import { queryClient } from './query-provider';

type BootstrapDependencies = {
  initializeToken: () => Promise<string | null>;
  getCurrentUser: () => ReturnType<typeof authApi.me>;
  cacheUser: (user: AuthenticatedUserResponse) => void;
};

export type AuthBootstrapStatus =
  | 'loading'
  | 'first-use'
  | 'starting-guest'
  | 'ready'
  | 'session-error';

const PUBLIC_AUTH_PATHS = ['/login', '/register', '/password-reset'];

export function shouldRenderAppRoutes(status: AuthBootstrapStatus, pathname: string) {
  if (status === 'ready') {
    return true;
  }

  return status !== 'loading' && PUBLIC_AUTH_PATHS.includes(pathname);
}

const defaultDependencies: BootstrapDependencies = {
  initializeToken: initializeAccessToken,
  getCurrentUser: () => authApi.me(),
  cacheUser: (user) => queryClient.setQueryData(['auth', 'me'], user),
};

export async function bootstrapAuthSession(dependencies = defaultDependencies) {
  const token = await dependencies.initializeToken();
  if (!token) {
    return 'first-use' as const;
  }

  const user = await dependencies.getCurrentUser();

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
