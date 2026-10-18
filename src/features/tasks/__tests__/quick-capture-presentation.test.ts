import { getQuickCaptureResultMessage } from '@/features/tasks/quick-capture-presentation';
import type { TaskQuickCaptureResponse, TaskResponse } from '@/types';

const today = '2026-10-18';

function response(
  overrides: Omit<Partial<TaskQuickCaptureResponse>, 'task'> = {},
  savedTask: Partial<TaskResponse> = {},
): TaskQuickCaptureResponse {
  return {
    parsed: true,
    originalText: '내일 3시 출시 회의',
    parsedDate: '2026-10-19',
    parsedTime: '15:00:00',
    parsedType: 'SCHEDULE',
    parsedRecurrenceFrequency: null,
    parsedByDays: [],
    timeZone: 'Asia/Seoul',
    ...overrides,
    task: {
      id: 1,
      type: 'SCHEDULE',
      status: 'TODAY',
      plannedDate: '2026-10-19',
      startAt: '2026-10-19T15:00:00',
      allDay: false,
      recurrenceRule: null,
      ...savedTask,
    } as TaskResponse,
  };
}

describe('빠른 등록 결과 문구', () => {
  test('저장한 일정의 날짜와 시간을 표시한다', () => {
    const message = getQuickCaptureResultMessage(response(), today);
    expect(message).toContain('2026년 10월 19일');
    expect(message).toContain('15:00');
    expect(message).not.toContain('오늘 할 일');
  });

  test('저장한 반복 규칙만 표시하고 파서의 반복 제안은 성과로 안내하지 않는다', () => {
    expect(
      getQuickCaptureResultMessage(response({}, { recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO' }), today),
    ).toContain('매주 월');
    expect(
      getQuickCaptureResultMessage(response({ parsedRecurrenceFrequency: 'WEEKLY' }), today),
    ).not.toContain('매주');
  });

  test('해석 여부와 무관하게 실제 기록함 저장 유형을 안내한다', () => {
    expect(
      getQuickCaptureResultMessage(
        response(
          { parsed: false },
          { type: 'TODO', status: 'INBOX', startAt: null, plannedDate: null },
        ),
        today,
      ),
    ).toBe('할 일을 기록함에 저장했어요.');
  });

  test('오늘로 옮긴 할 일은 실제 계획 날짜로 오늘 여부를 판단한다', () => {
    expect(
      getQuickCaptureResultMessage(
        response({}, { type: 'TODO', startAt: null, plannedDate: today }),
        today,
      ),
    ).toBe('오늘 할 일에 저장했어요.');
  });

  test('TODAY 상태여도 다른 날짜의 할 일을 오늘이라고 부르지 않는다', () => {
    const message = getQuickCaptureResultMessage(
      response({}, { type: 'TODO', startAt: null }),
      today,
    );
    expect(message).toContain('2026년 10월 19일 할 일');
    expect(message).not.toContain('오늘');
  });

  test('파서와 저장 결과가 다르면 저장된 날짜와 종일 유형을 따른다', () => {
    const message = getQuickCaptureResultMessage(
      response({}, { startAt: '2026-10-20T00:00:00', allDay: true }),
      today,
    );
    expect(message).toContain('2026년 10월 20일 · 종일 일정');
    expect(message).not.toContain('15:00');
  });

  test('아이디어나 날짜 없는 결과를 오늘 할 일로 안내하지 않는다', () => {
    expect(getQuickCaptureResultMessage(response({}, { type: 'IDEA' }), today)).toBe(
      '아이디어로 저장했어요.',
    );
    expect(
      getQuickCaptureResultMessage(
        response({}, { type: 'TODO', startAt: null, plannedDate: null }),
        today,
      ),
    ).toBe('할 일로 저장했어요.');
  });
});
