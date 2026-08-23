import { ApiClientError } from '@/services/api/api-error';
import {
  createErrorLogEvent,
  getItemCountBucket,
} from '@/services/telemetry/error-reporting-policy';

describe('error reporting policy', () => {
  it('API 오류에서 허용된 구조화 정보만 만든다', () => {
    const error = new ApiClientError('할 일 제목이 포함된 서버 메시지', {
      kind: 'api',
      status: 422,
      code: 1001,
      cause: { title: '비공개 할 일' },
    });

    const event = createErrorLogEvent({
      feature: 'today',
      action: 'task.create',
      platform: 'android',
      error,
    });

    expect(event).toEqual({
      feature: 'today',
      action: 'task.create',
      platform: 'android',
      errorKind: 'api',
      httpStatus: 422,
      apiCode: 1001,
      retryCount: undefined,
      itemCountBucket: undefined,
    });
    expect(JSON.stringify(event)).not.toContain('비공개');
    expect(JSON.stringify(event)).not.toContain('서버 메시지');
  });

  it('동적 원문이 들어간 action은 전송하지 않는다', () => {
    const event = createErrorLogEvent({
      feature: 'search',
      action: 'search.제주도 여행 준비',
      platform: 'web',
      error: new Error('검색 결과 오류'),
    });

    expect(event.action).toBe('unknown');
    expect(event.errorKind).toBe('unexpected');
    expect(JSON.stringify(event)).not.toContain('제주도');
  });

  it('개수와 재시도 횟수를 제한된 범위로 정규화한다', () => {
    expect(getItemCountBucket(0)).toBe('0');
    expect(getItemCountBucket(10)).toBe('1-10');
    expect(getItemCountBucket(11)).toBe('11-50');
    expect(getItemCountBucket(51)).toBe('51+');

    expect(
      createErrorLogEvent({
        feature: 'workspace',
        action: 'task.list',
        platform: 'ios',
        retryCount: 99,
        itemCount: 12,
      }),
    ).toMatchObject({ retryCount: 10, itemCountBucket: '11-50' });
  });
});
