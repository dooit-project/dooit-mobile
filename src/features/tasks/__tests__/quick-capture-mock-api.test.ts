import { mockApiClient } from '@/services/api/mock-api-client';
import type { TaskQuickCaptureResponse } from '@/types';

describe('Mock task quick capture API', () => {
  test('파싱되지 않은 원문을 Inbox TODO로 저장한다', async () => {
    const originalText = '아이디어를 다음 회의에서 다시 검토하기';
    const response = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      {
        text: originalText,
        referenceDate: '2026-08-13',
        timeZone: 'Asia/Seoul',
        defaultCategory: '업무',
      },
    );

    expect(response).toMatchObject({
      parsed: false,
      originalText,
      parsedDate: null,
      parsedTime: null,
      parsedType: 'TODO',
      parsedRecurrenceFrequency: null,
      parsedByDays: [],
      timeZone: 'Asia/Seoul',
      task: {
        title: originalText,
        description: null,
        category: '업무',
        status: 'INBOX',
        type: 'TODO',
      },
    });
  });

  test('30자를 넘는 원문은 전체 내용을 description에 보존한다', async () => {
    const originalText =
      '아주 긴 빠른 등록 원문을 입력하면 제목은 제한하고 전체 내용은 설명에 보존해야 합니다';
    const response = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      { text: originalText },
    );

    expect(response.task.title).toHaveLength(30);
    expect(response.task.description).toBe(originalText);
  });
});
