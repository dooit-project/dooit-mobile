import { ApiClientError } from '@/services/api';

import {
  getWorkspaceAccessErrorPresentation,
  getWorkspaceActionErrorMessage,
} from '../workspace-error-presentation';

describe('Workspace 오류 안내', () => {
  test('404는 삭제·탈퇴 가능성을 설명하고 목록 복귀를 제안한다', () => {
    expect(
      getWorkspaceAccessErrorPresentation(
        new ApiClientError('WORKSPACE_NOT_FOUND', { kind: 'http', status: 404 }),
      ),
    ).toEqual({
      title: '공유 공간을 찾을 수 없어요',
      message: '삭제됐거나 더 이상 참여 중이지 않은 공간이에요.',
      canRetry: false,
      shouldReturnToList: true,
    });
  });

  test('403은 초대·권한 변경 가능성을 설명하고 목록 복귀를 제안한다', () => {
    expect(
      getWorkspaceAccessErrorPresentation(
        new ApiClientError('FORBIDDEN', { kind: 'http', status: 403 }),
      ),
    ).toEqual({
      title: '공유 공간에 접근할 수 없어요',
      message: '초대 상태나 멤버 권한이 변경됐을 수 있어요.',
      canRetry: false,
      shouldReturnToList: true,
    });
  });

  test('일시 오류는 다시 시도할 수 있다', () => {
    expect(
      getWorkspaceAccessErrorPresentation(new ApiClientError('offline', { kind: 'network' })),
    ).toMatchObject({ canRetry: true, shouldReturnToList: false });
  });

  test('변경 요청의 403과 404를 행동 가능한 문구로 변환한다', () => {
    expect(
      getWorkspaceActionErrorMessage(
        new ApiClientError('FORBIDDEN', { kind: 'http', status: 403 }),
      ),
    ).toContain('현재 권한');
    expect(
      getWorkspaceActionErrorMessage(
        new ApiClientError('WORKSPACE_NOT_FOUND', { kind: 'http', status: 404 }),
      ),
    ).toContain('목록을 새로고침');
  });
});
