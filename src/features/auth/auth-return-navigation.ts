import type { AuthState } from './use-auth-state';

export function shouldShowFirstUseReturn(
  authStatus: AuthState['status'],
  params: { expired?: string; guestExpired?: string; registered?: string } = {},
) {
  return (
    authStatus === 'error' &&
    params.expired !== '1' &&
    params.guestExpired !== '1' &&
    params.registered !== '1'
  );
}
