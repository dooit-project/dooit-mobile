import type { AuthState } from '@/features/auth';

export type ProfileAuthPresentation = {
  title: string;
  description: string;
  actionLabel: '로그인' | '로그아웃';
  showGuestRecoveryWarning: boolean;
};

export function getProfileAuthPresentation(authState: AuthState): ProfileAuthPresentation {
  switch (authState.status) {
    case 'registered':
      return {
        title: authState.user.email ?? authState.user.displayName ?? '나의 플래너',
        description: '목표와 기록, 개인 설정을 관리하세요.',
        actionLabel: '로그아웃',
        showGuestRecoveryWarning: false,
      };
    case 'guest':
      return {
        title: '게스트로 사용 중',
        description: '로그인하면 지금까지 작성한 내용을 계정에 연결할 수 있어요.',
        actionLabel: '로그인',
        showGuestRecoveryWarning: true,
      };
    case 'bootstrapping':
      return {
        title: '계정 정보를 확인하고 있어요',
        description: '잠시만 기다려 주세요.',
        actionLabel: '로그인',
        showGuestRecoveryWarning: false,
      };
    case 'error':
      return {
        title: '계정 정보를 확인하지 못했어요',
        description: authState.error.message,
        actionLabel: '로그인',
        showGuestRecoveryWarning: false,
      };
  }
}
