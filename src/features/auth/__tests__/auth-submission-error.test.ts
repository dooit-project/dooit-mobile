import { ApiClientError } from '@/services/api';

import { getAuthSubmissionErrorMessage } from '../auth-submission-error';

describe('getAuthSubmissionErrorMessage', () => {
  const networkError = new ApiClientError('network error', { kind: 'network' });

  it('게스트의 인증 요청 실패에는 데이터 유지와 재시도 안내를 추가한다', () => {
    expect(getAuthSubmissionErrorMessage(networkError, true)).toBe(
      '서버에 연결할 수 없어요. 네트워크 상태를 확인해 주세요. 게스트로 작성한 내용은 그대로 유지돼요. 입력이나 연결 상태를 확인한 뒤 다시 시도해 주세요.',
    );
  });

  it('정식 회원의 인증 요청 실패에는 공통 오류 문구만 표시한다', () => {
    expect(getAuthSubmissionErrorMessage(networkError, false)).toBe(
      '서버에 연결할 수 없어요. 네트워크 상태를 확인해 주세요.',
    );
  });
});
