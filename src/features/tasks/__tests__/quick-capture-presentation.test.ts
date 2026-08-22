import { getQuickCaptureResultMessage } from '@/features/tasks/quick-capture-presentation';
import type { TaskQuickCaptureResponse } from '@/types';

function response(overrides: Partial<TaskQuickCaptureResponse>): TaskQuickCaptureResponse {
  return {
    task: { status: 'INBOX' } as TaskQuickCaptureResponse['task'],
    parsed: true,
    originalText: '내일 3시 출시 회의',
    parsedDate: '2026-08-15',
    parsedTime: '15:00:00',
    parsedType: 'SCHEDULE',
    parsedRecurrenceFrequency: null,
    parsedByDays: [],
    timeZone: 'Asia/Seoul',
    ...overrides,
  };
}

describe('빠른 등록 결과 문구', () => {
  test('해석한 날짜와 시간을 읽기 쉬운 문구로 표시한다', () => {
    expect(getQuickCaptureResultMessage(response({}))).toContain('2026년 8월 15일');
    expect(getQuickCaptureResultMessage(response({}))).toContain('15:00');
  });

  test('반복 주기를 함께 표시한다', () => {
    expect(
      getQuickCaptureResultMessage(
        response({ parsedRecurrenceFrequency: 'WEEKLY', parsedTime: null }),
      ),
    ).toContain('매주 반복');
  });

  test('해석하지 못한 입력은 기록함 저장을 안내한다', () => {
    expect(getQuickCaptureResultMessage(response({ parsed: false }))).toBe(
      '날짜 정보 없이 기록함에 저장했어요.',
    );
  });

  test('오늘로 옮긴 결과는 현재 저장 위치를 안내한다', () => {
    expect(
      getQuickCaptureResultMessage(
        response({ task: { status: 'TODAY' } as TaskQuickCaptureResponse['task'] }),
      ),
    ).toBe('오늘 할 일에 저장했어요.');
  });
});
