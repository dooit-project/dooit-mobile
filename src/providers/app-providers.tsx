import type { PropsWithChildren } from 'react';

import { AuthTokenBootstrap } from './auth-token-bootstrap';
import { NotificationSyncProvider } from './notification-sync-provider';
import { QueryProvider } from './query-provider';
import { SessionExpiryRedirect } from './session-expiry-redirect';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <SessionExpiryRedirect>
        <AuthTokenBootstrap>
          <NotificationSyncProvider>{children}</NotificationSyncProvider>
        </AuthTokenBootstrap>
      </SessionExpiryRedirect>
    </QueryProvider>
  );
}
