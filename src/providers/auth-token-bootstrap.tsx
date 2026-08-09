import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, InlineNotice, Screen } from '@/components/ui';
import { authApi, initializeAccessToken } from '@/services/api';
import { spacing } from '@/theme';
import type { AuthenticatedUserResponse } from '@/types';

import { queryClient } from './query-provider';

type BootstrapDependencies = {
  initializeToken: () => Promise<string | null>;
  createGuest: () => ReturnType<typeof authApi.guest>;
  getCurrentUser: () => ReturnType<typeof authApi.me>;
  cacheUser: (user: AuthenticatedUserResponse) => void;
};

const defaultDependencies: BootstrapDependencies = {
  initializeToken: initializeAccessToken,
  createGuest: () => authApi.guest(),
  getCurrentUser: () => authApi.me(),
  cacheUser: (user) => queryClient.setQueryData(['auth', 'me'], user),
};

export async function bootstrapAuthSession(dependencies = defaultDependencies) {
  const token = await dependencies.initializeToken();
  const user = token
    ? await dependencies.getCurrentUser()
    : (await dependencies.createGuest()).user;

  dependencies.cacheUser(user);
}

export function AuthTokenBootstrap({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    bootstrapAuthSession()
      .then(() => {
        if (mounted) {
          setStatus('ready');
        }
      })
      .catch(() => {
        if (mounted) {
          setStatus('error');
        }
      });

    return () => {
      mounted = false;
    };
  }, [retryKey]);

  if (status === 'loading') {
    return null;
  }

  if (status === 'error') {
    return (
      <Screen contentContainerStyle={styles.errorScreen}>
        <InlineNotice
          tone="danger"
          title="ToDoLab을 시작하지 못했어요"
          message="게스트 계정 또는 저장된 계정을 확인할 수 없어요. 네트워크 연결을 확인하고 다시 시도해 주세요."
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

  return children;
}

const styles = StyleSheet.create({
  errorScreen: {
    justifyContent: 'center',
    paddingVertical: spacing[8],
  },
});
