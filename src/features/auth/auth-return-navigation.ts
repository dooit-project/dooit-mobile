import type { AuthState } from './use-auth-state';

type AuthReturnParams = {
  expired?: string;
  guestExpired?: string;
  registered?: string;
};

export function getLoginHeading(params: AuthReturnParams = {}) {
  return params.expired === '1' ? '다시 로그인해요' : '로그인해요';
}

export function shouldShowFirstUseReturn(
  authStatus: AuthState['status'],
  params: AuthReturnParams = {},
) {
  return (
    authStatus === 'error' &&
    params.expired !== '1' &&
    params.guestExpired !== '1' &&
    params.registered !== '1'
  );
}
