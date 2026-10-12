import type { AuthenticatedUserResponse } from '@/types';

import { getSessionExpiryParams } from '../session-expiry-redirect';

const user: AuthenticatedUserResponse = {
  id: 1,
  accountType: 'GUEST',
  email: null,
  displayName: null,
  role: 'USER',
};

describe('getSessionExpiryParams', () => {
  it('게스트와 정식 회원의 만료 안내를 구분한다', () => {
    expect(getSessionExpiryParams(user)).toEqual({ guestExpired: '1' });
    expect(getSessionExpiryParams({ ...user, accountType: 'REGISTERED' })).toEqual({
      expired: '1',
    });
  });

  it('등록 계정의 기존 이메일을 만료 로그인 화면에 전달한다', () => {
    expect(
      getSessionExpiryParams({
        ...user,
        accountType: 'REGISTERED',
        email: 'user@example.com',
      }),
    ).toEqual({ email: 'user@example.com', expired: '1' });

    expect(getSessionExpiryParams(undefined, 'REGISTERED', 'saved@example.com')).toEqual({
      email: 'saved@example.com',
      expired: '1',
    });
  });

  it('사용자 유형을 알 수 없으면 일반 만료 안내를 사용한다', () => {
    expect(getSessionExpiryParams(undefined)).toEqual({ expired: '1' });
  });

  it('cold start cache가 비어 있어도 저장된 게스트 유형으로 구분한다', () => {
    expect(getSessionExpiryParams(undefined, 'GUEST')).toEqual({ guestExpired: '1' });
  });
});
