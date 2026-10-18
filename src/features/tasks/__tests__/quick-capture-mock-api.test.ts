import { mockApiClient } from '@/services/api/mock-api-client';
import type { TaskQuickCaptureResponse, TaskRecommendationResponse } from '@/types';

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

    const recommendations = await mockApiClient.get<TaskRecommendationResponse[]>(
      '/api/v1/tasks/today/recommendations',
    );
    expect(recommendations.map(({ task }) => task.id)).not.toContain(response.task.id);
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

  test('상대 날짜와 오후 시간을 일정으로 해석한다', async () => {
    const response = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      {
        text: '내일 오후 3시 출시 회의',
        referenceDate: '2026-08-14',
      },
    );

    expect(response).toMatchObject({
      parsed: true,
      parsedDate: '2026-08-15',
      parsedTime: '15:00:00',
      parsedType: 'SCHEDULE',
      task: {
        title: '출시 회의',
        type: 'SCHEDULE',
        startAt: '2026-08-15T15:00:00',
      },
    });
  });

  test.each([
    ['낼 오전 9시 치과', '2026-08-14', '09:00:00', '치과'],
    ['내일모레 10시 발표', '2026-08-15', '10:00:00', '발표'],
    ['낼모레 오후 3시 반 치과', '2026-08-15', '15:30:00', '치과'],
    ['담주 월요일 회고', '2026-08-17', null, '회고'],
    ['다담주 화요일 14:30 발표 준비', '2026-08-25', '14:30:00', '발표 준비'],
  ])('%s 표현을 백엔드와 같은 날짜·시간으로 해석한다', async (text, date, time, title) => {
    const response = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      {
        text,
        referenceDate: '2026-08-13',
      },
    );

    expect(response).toMatchObject({
      parsed: true,
      parsedDate: date,
      parsedTime: time,
      task: {
        title,
        type: 'SCHEDULE',
        allDay: time === null,
      },
    });
  });

  test('HH:mm 시간만 있으면 기준 날짜의 일정으로 해석한다', async () => {
    const response = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      {
        text: '18:45 저녁 약속',
        referenceDate: '2026-08-13',
      },
    );

    expect(response).toMatchObject({
      parsed: true,
      parsedDate: '2026-08-13',
      parsedTime: '18:45:00',
      task: {
        title: '저녁 약속',
        startAt: '2026-08-13T18:45:00',
        endAt: '2026-08-13T19:45:00',
      },
    });
  });

  test.each([
    ['8월 15일 여행 준비', '2026-08-15', '여행 준비'],
    ['2027년 1월 3일 귀국', '2027-01-03', '귀국'],
    ['8/16 회의', '2026-08-16', '회의'],
    ['금요일 병원', '2026-08-14', '병원'],
  ])('%s 날짜 표현을 일정으로 해석한다', async (text, date, title) => {
    const response = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      {
        text,
        referenceDate: '2026-08-13',
      },
    );

    expect(response).toMatchObject({
      parsed: true,
      parsedDate: date,
      parsedTime: null,
      task: { title, type: 'SCHEDULE', allDay: true },
    });
  });

  test('매주 요일을 가장 가까운 날짜의 반복 일정으로 해석한다', async () => {
    const response = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      {
        text: '매주 월요일 운동',
        referenceDate: '2026-08-14',
      },
    );

    expect(response).toMatchObject({
      parsed: true,
      parsedDate: '2026-08-17',
      parsedRecurrenceFrequency: 'WEEKLY',
      parsedByDays: ['MO'],
      task: { title: '운동', allDay: true, type: 'SCHEDULE' },
    });
  });
  test.each([
    ['오늘 영단어 30개', '2026-10-18'],
    ['내일 영단어 30개', '2026-10-19'],
  ])('TODO 선택과 %s는 시각 구간 없이 계획일로 저장한다', async (text, date) => {
    const response = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      {
        text,
        requestedType: 'TODO',
        referenceDate: '2026-10-18',
      },
    );
    expect(response).toMatchObject({
      parsed: true,
      parsedType: 'TODO',
      parsedDate: date,
      parsedTime: null,
      task: {
        type: 'TODO',
        plannedDate: date,
        targetDate: date,
        status: 'TODAY',
        startAt: null,
        endAt: null,
        allDay: false,
        unscheduled: true,
      },
    });
    if (date !== '2026-10-18') {
      const today = await mockApiClient.get<TaskQuickCaptureResponse['task'][]>(
        '/api/v1/tasks/today',
        {
          query: { date: '2026-10-18' },
        },
      );
      expect(today.map((task) => task.id)).not.toContain(response.task.id);
    }
  });

  test('날짜 없는 TODO 선택은 referenceDate가 있어도 기록함을 유지한다', async () => {
    const response = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      {
        text: '로그인 버튼 연결하기',
        requestedType: 'TODO',
        referenceDate: '2026-10-18',
      },
    );
    expect(response).toMatchObject({
      parsed: false,
      parsedType: 'TODO',
      task: { type: 'TODO', status: 'INBOX', plannedDate: null, startAt: null },
    });
  });

  test.each(['내일 오후 3시 새로운 생각', '매주 월요일 운동', '2026-02-30 99:99 새로운 생각'])(
    'IDEA 선택은 %s의 날짜나 시각을 해석하지 않고 보존한다',
    async (text) => {
      const response = await mockApiClient.post<TaskQuickCaptureResponse>(
        '/api/v1/tasks/quick-capture',
        {
          text,
          requestedType: 'IDEA',
          referenceDate: '2026-10-18',
        },
      );
      expect(response).toMatchObject({
        parsed: false,
        parsedType: 'IDEA',
        parsedDate: null,
        parsedTime: null,
        parsedRecurrenceFrequency: null,
        parsedByDays: [],
        task: {
          type: 'IDEA',
          title: text,
          plannedDate: null,
          startAt: null,
          status: 'INBOX',
          recurrenceSeriesId: null,
        },
      });
    },
  );

  test('긴 IDEA 문구는 설명에 전체를 보존한다', async () => {
    const text = '내일 새로운 아이디어를 생각해 보고 세부 내용을 아주 자세하게 적어 두기';
    const response = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      {
        text,
        requestedType: 'IDEA',
      },
    );
    expect(response.task.title).toHaveLength(30);
    expect(response.task.description).toBe(text);
  });

  test.each([
    ['TODO', '내일 오후 3시 공부'],
    ['TODO', '매주 월요일 운동'],
    ['SCHEDULE', '회의 준비'],
    ['UNKNOWN', '내일 공부'],
    [0, '내일 공부'],
    ['', '내일 공부'],
  ])('미지원 유형 조합 %s + %s는 생성하지 않는다', async (requestedType, text) => {
    const before = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      { text: '검증 전 기록' },
    );
    await expect(
      mockApiClient.post('/api/v1/tasks/quick-capture', {
        text,
        requestedType,
        referenceDate: '2026-10-18',
      }),
    ).rejects.toMatchObject({ status: 400, code: 10001 });
    const after = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      { text: '검증 후 기록' },
    );
    expect(after.task.id).toBe(before.task.id + 1);
  });

  test('SCHEDULE의 주간 반복은 task 원본에도 저장한다', async () => {
    const response = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      {
        text: '매주 월요일 운동',
        requestedType: 'SCHEDULE',
        referenceDate: '2026-10-18',
      },
    );
    const saved = await mockApiClient.get<TaskQuickCaptureResponse['task']>(
      `/api/v1/tasks/${response.task.id}`,
    );
    expect(saved.recurrenceSeriesId).toBe(response.task.id);
    expect(saved.recurrenceRule).toContain('BYDAY=MO');
    expect(saved.recurrence?.frequency).toBe('WEEKLY');
  });

  test('null 유형은 기존 자동 해석과 같은 종일 일정을 만든다', async () => {
    const response = await mockApiClient.post<TaskQuickCaptureResponse>(
      '/api/v1/tasks/quick-capture',
      {
        text: '내일 공부',
        requestedType: null,
        referenceDate: '2026-10-18',
      },
    );
    expect(response.task).toMatchObject({
      type: 'SCHEDULE',
      allDay: true,
      startAt: '2026-10-19T00:00:00',
      endAt: '2026-10-20T00:00:00',
    });
  });
});
