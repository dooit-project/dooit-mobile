import { ApiClientError, getUserFacingApiErrorMessage } from '@/services/api';

export type WorkspaceAccessErrorPresentation = {
  title: string;
  message: string;
  canRetry: boolean;
  shouldReturnToList: boolean;
};

export function getWorkspaceAccessErrorPresentation(
  error: unknown,
): WorkspaceAccessErrorPresentation {
  if (error instanceof ApiClientError && error.status === 404) {
    return {
      title: '공유 공간을 찾을 수 없어요',
      message: '삭제됐거나 더 이상 참여 중이지 않은 공간이에요.',
      canRetry: false,
      shouldReturnToList: true,
    };
  }

  if (error instanceof ApiClientError && error.status === 403) {
    return {
      title: '공유 공간에 접근할 수 없어요',
      message: '초대 상태나 멤버 권한이 변경됐을 수 있어요.',
      canRetry: false,
      shouldReturnToList: true,
    };
  }

  return {
    title: '공유 정보를 불러오지 못했어요',
    message: getUserFacingApiErrorMessage(error),
    canRetry: true,
    shouldReturnToList: false,
  };
}

export function getWorkspaceActionErrorMessage(error: unknown) {
  if (error instanceof ApiClientError && error.status === 403) {
    return '현재 권한으로 변경할 수 없어요. 멤버 권한을 다시 확인해 주세요.';
  }

  if (error instanceof ApiClientError && error.status === 404) {
    return '대상이 없거나 더 이상 이 공간에 접근할 수 없어요. 목록을 새로고침해 주세요.';
  }

  return getUserFacingApiErrorMessage(error);
}

export function getWorkspaceInvitationActionErrorMessage(error: unknown) {
  if (error instanceof ApiClientError && (error.status === 404 || error.status === 409)) {
    return '초대 상태가 이미 변경됐어요. 최신 초대 목록을 다시 확인해 주세요.';
  }

  return getUserFacingApiErrorMessage(error);
}
