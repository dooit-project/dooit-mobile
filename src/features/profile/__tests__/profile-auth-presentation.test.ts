import type { AuthState } from '@/features/auth';

import { getProfileAuthPresentation } from '../profile-auth-presentation';

const guestState: AuthState = {
  status: 'guest',
  user: {
    id: 1,
    accountType: 'GUEST',
    email: null,
    displayName: null,
    role: 'USER',
  },
};

const registeredState: AuthState = {
  status: 'registered',
  user: {
    id: 2,
    accountType: 'REGISTERED',
    email: 'user@example.com',
    displayName: 'User',
    role: 'USER',
  },
};

describe('getProfileAuthPresentation', () => {
  it('게스트에게 로그인 동선과 복구 제한 안내를 제공한다', () => {
    expect(getProfileAuthPresentation(guestState)).toEqual({
      title: '게스트로 사용 중',
      description: '로그인하면 지금까지 작성한 내용을 계정에 연결할 수 있어요.',
      actionLabel: '로그인',
      showGuestRecoveryWarning: true,
    });
  });

  it('정식 회원에게 이메일과 로그아웃 동선을 제공한다', () => {
    expect(getProfileAuthPresentation(registeredState)).toEqual({
      title: 'user@example.com',
      description: '목표와 기록, 개인 설정을 관리하세요.',
      actionLabel: '로그아웃',
      showGuestRecoveryWarning: false,
    });
  });

  it('인증 오류 메시지를 프로필에 전달한다', () => {
    const error = new Error('인증 정보를 확인할 수 없어요.');

    expect(getProfileAuthPresentation({ status: 'error', error })).toEqual({
      title: '계정 정보를 확인하지 못했어요',
      description: error.message,
      actionLabel: '로그인',
      showGuestRecoveryWarning: false,
    });
  });
});
