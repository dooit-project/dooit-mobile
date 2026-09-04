import { taskApi } from '@/features/tasks/task-api';
import { apiClient } from '@/services/api';

jest.mock('@/services/api', () => ({
  apiClient: {
    get: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

const getMock = apiClient.get as jest.Mock;
const deleteMock = apiClient.delete as jest.Mock;
const patchMock = apiClient.patch as jest.Mock;
const postMock = apiClient.post as jest.Mock;
const putMock = apiClient.put as jest.Mock;

describe('Task API', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue([]);
    deleteMock.mockReset();
    deleteMock.mockResolvedValue(null);
    patchMock.mockReset();
    patchMock.mockResolvedValue({ id: 1 });
    postMock.mockReset();
    postMock.mockResolvedValue({ id: 1 });
    putMock.mockReset();
    putMock.mockResolvedValue({ id: 1 });
  });

  test('제목 중심의 Task를 생성한다', async () => {
    const request = {
      title: '병원 예약',
      type: 'TODO' as const,
      allDay: false,
    };

    await taskApi.create(request);

    expect(postMock).toHaveBeenCalledWith('/api/v1/tasks', request, { signal: undefined });
  });

  test('자연어 빠른 등록 요청을 전용 endpoint로 전달한다', async () => {
    const request = {
      text: '내일 오후 3시 출시 회의',
      referenceDate: '2026-08-13' as const,
      timeZone: 'Asia/Seoul',
      defaultCategory: '업무',
    };

    await taskApi.quickCapture(request);

    expect(postMock).toHaveBeenCalledWith('/api/v1/tasks/quick-capture', request, {
      signal: undefined,
    });
  });

  test('반복 Task 생성 payload를 그대로 전달한다', async () => {
    const request = {
      title: '주간 회의',
      type: 'SCHEDULE' as const,
      allDay: false,
      startAt: '2026-07-07T09:00:00' as const,
      endAt: '2026-07-07T10:00:00' as const,
      recurrence: {
        frequency: 'WEEKLY' as const,
        interval: 1,
        byDays: ['TU'],
        recurrenceCount: 10,
      },
    };

    await taskApi.create(request);

    expect(postMock).toHaveBeenCalledWith('/api/v1/tasks', request, { signal: undefined });
  });

  test('Task 상세를 id로 조회한다', async () => {
    await taskApi.get(42);

    expect(getMock).toHaveBeenCalledWith('/api/v1/tasks/42', { signal: undefined });
  });

  test('개인 Task 카테고리 요약을 조회한다', async () => {
    await taskApi.getCategories();

    expect(getMock).toHaveBeenCalledWith('/api/v1/tasks/categories', { signal: undefined });
  });

  test('Task checklist CRUD와 재정렬 endpoint를 호출한다', async () => {
    await taskApi.getChecklistItems(42);
    await taskApi.createChecklistItem(42, { title: '자료 확인' });
    await taskApi.updateChecklistItem(42, 7, { title: '자료 재확인' });
    await taskApi.completeChecklistItem(42, 7, '2026-09-04T09:00:00');
    await taskApi.reopenChecklistItem(42, 7);
    await taskApi.reorderChecklistItems(42, { orderedItemIds: [8, 7] });
    await taskApi.deleteChecklistItem(42, 7);

    expect(getMock).toHaveBeenCalledWith('/api/v1/tasks/42/checklist-items', {
      signal: undefined,
    });
    expect(postMock).toHaveBeenCalledWith(
      '/api/v1/tasks/42/checklist-items',
      { title: '자료 확인' },
      { signal: undefined },
    );
    expect(putMock).toHaveBeenCalledWith(
      '/api/v1/tasks/42/checklist-items/7',
      { title: '자료 재확인' },
      { signal: undefined },
    );
    expect(patchMock).toHaveBeenCalledWith('/api/v1/tasks/42/checklist-items/7/done', undefined, {
      query: { completedAt: '2026-09-04T09:00:00' },
      signal: undefined,
    });
    expect(patchMock).toHaveBeenCalledWith(
      '/api/v1/tasks/42/checklist-items/7/done/cancel',
      undefined,
      { signal: undefined },
    );
    expect(putMock).toHaveBeenCalledWith(
      '/api/v1/tasks/42/checklist-items/order',
      { orderedItemIds: [8, 7] },
      { signal: undefined },
    );
    expect(deleteMock).toHaveBeenCalledWith('/api/v1/tasks/42/checklist-items/7', {
      signal: undefined,
    });
  });

  test('월간 조회 날짜를 YYYY-MM 형식으로 직렬화한다', async () => {
    await taskApi.list({ type: 'MONTH', date: '2026-07-14' });

    expect(getMock).toHaveBeenCalledWith('/api/v1/tasks', {
      query: { type: 'MONTH', date: '2026-07' },
      signal: undefined,
    });
  });

  test('Task를 수정한다', async () => {
    const request = {
      title: '운동 기록 정리',
      description: '러닝 기록 캡처 업로드',
      category: '건강',
      type: 'TODO' as const,
      allDay: true,
      startAt: null,
      endAt: null,
    };

    await taskApi.update(42, request);

    expect(putMock).toHaveBeenCalledWith('/api/v1/tasks/42', request, {
      query: { recurrenceScope: undefined },
      signal: undefined,
    });
  });

  test('반복 Task 수정 scope를 query로 전달한다', async () => {
    const request = {
      title: '회의 시간 변경',
      type: 'SCHEDULE' as const,
      allDay: false,
      startAt: '2026-07-14T10:00:00' as const,
      endAt: '2026-07-14T11:00:00' as const,
    };

    await taskApi.update(42, request, 'THIS_AND_FUTURE');

    expect(putMock).toHaveBeenCalledWith('/api/v1/tasks/42', request, {
      query: { recurrenceScope: 'THIS_AND_FUTURE' },
      signal: undefined,
    });
  });

  test('Task를 삭제한다', async () => {
    await taskApi.delete(42);

    expect(deleteMock).toHaveBeenCalledWith('/api/v1/tasks/42', {
      query: { recurrenceScope: undefined },
      signal: undefined,
    });
  });

  test('반복 Task 삭제 scope를 query로 전달한다', async () => {
    await taskApi.delete(42, 'ALL');

    expect(deleteMock).toHaveBeenCalledWith('/api/v1/tasks/42', {
      query: { recurrenceScope: 'ALL' },
      signal: undefined,
    });
  });

  test('Today 조회에 서울 기준 날짜를 전달한다', async () => {
    await taskApi.getToday('2026-06-24');

    expect(getMock).toHaveBeenCalledWith('/api/v1/tasks/today', {
      query: { date: '2026-06-24' },
      signal: undefined,
    });
  });

  test('Today 추천 조회에 서울 기준 날짜를 전달한다', async () => {
    await taskApi.getTodayRecommendations('2026-06-24');

    expect(getMock).toHaveBeenCalledWith('/api/v1/tasks/today/recommendations', {
      query: { date: '2026-06-24' },
      signal: undefined,
    });
  });

  test('로컬 알림 후보 조회 기간을 전달한다', async () => {
    await taskApi.getNotificationCandidates('2026-07-29', '2026-08-11');

    expect(getMock).toHaveBeenCalledWith('/api/v1/tasks/notification-candidates', {
      query: { from: '2026-07-29', to: '2026-08-11' },
      signal: undefined,
    });
  });

  test('완료 조회에 날짜를 전달한다', async () => {
    await taskApi.getDone('2026-06-24');

    expect(getMock).toHaveBeenCalledWith('/api/v1/tasks/done', {
      query: { date: '2026-06-24' },
      signal: undefined,
    });
  });

  test('지난 미완료 항목을 조회한다', async () => {
    await taskApi.getStale();

    expect(getMock).toHaveBeenCalledWith('/api/v1/tasks/stale', { signal: undefined });
  });

  test('기록함을 별도 query 없이 조회한다', async () => {
    await taskApi.getInbox();

    expect(getMock).toHaveBeenCalledWith('/api/v1/tasks/inbox', { signal: undefined });
  });

  test('통합 검색 query를 API 계약에 맞게 직렬화한다', async () => {
    await taskApi.search({
      q: '회의',
      statuses: ['TODAY', 'DONE'],
      taskTypes: ['TODO', 'SCHEDULE'],
      dateField: 'TARGET',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      sort: 'RELEVANT_DATE_DESC',
      limit: 20,
    });

    expect(getMock).toHaveBeenCalledWith('/api/v1/tasks/search', {
      query: {
        q: '회의',
        statuses: 'TODAY,DONE',
        taskTypes: 'TODO,SCHEDULE',
        dateField: 'TARGET',
        dateFrom: '2026-07-01',
        dateTo: '2026-07-31',
        sort: 'RELEVANT_DATE_DESC',
        limit: 20,
      },
      signal: undefined,
    });
  });

  test('Task 완료 endpoint를 호출한다', async () => {
    await taskApi.complete(42);

    expect(patchMock).toHaveBeenCalledWith('/api/v1/tasks/42/done', undefined, {
      signal: undefined,
    });
  });

  test('기록함 Task를 지정한 날짜의 Today로 이동한다', async () => {
    await taskApi.moveToToday(42, '2026-06-25');

    expect(patchMock).toHaveBeenCalledWith('/api/v1/tasks/42/today', undefined, {
      query: { date: '2026-06-25' },
      signal: undefined,
    });
  });

  test('Task를 기록함으로 이동한다', async () => {
    await taskApi.moveToInbox(42);

    expect(patchMock).toHaveBeenCalledWith('/api/v1/tasks/42/inbox', undefined, {
      signal: undefined,
    });
  });

  test('Today Task 실행 순서를 한 칸 이동한다', async () => {
    await taskApi.reorderToday(42, '2026-06-25', 'UP');

    expect(patchMock).toHaveBeenCalledWith('/api/v1/tasks/42/today-order', undefined, {
      query: { date: '2026-06-25', direction: 'UP' },
      signal: undefined,
    });
  });

  test('Task 미룬 이유를 저장한다', async () => {
    await taskApi.setDeferReason(42, 'WAITING_OTHER');

    expect(patchMock).toHaveBeenCalledWith('/api/v1/tasks/42/defer-reason', undefined, {
      query: { reason: 'WAITING_OTHER' },
      signal: undefined,
    });
  });

  test('Task 미룬 이유를 해제한다', async () => {
    await taskApi.clearDeferReason(42);

    expect(deleteMock).toHaveBeenCalledWith('/api/v1/tasks/42/defer-reason', { signal: undefined });
  });

  test('Task를 D-Day 목표에 연결한다', async () => {
    await taskApi.connectDdayGoal(42, 7);

    expect(patchMock).toHaveBeenCalledWith('/api/v1/tasks/42/dday-goal', undefined, {
      query: { ddayGoalId: 7 },
      signal: undefined,
    });
  });

  test('Task의 D-Day 목표 연결을 해제한다', async () => {
    await taskApi.disconnectDdayGoal(42);

    expect(deleteMock).toHaveBeenCalledWith('/api/v1/tasks/42/dday-goal', { signal: undefined });
  });

  test('완료 Task를 지정한 날짜의 Today로 다시 연다', async () => {
    await taskApi.reopenToday(42, '2026-06-25');

    expect(patchMock).toHaveBeenCalledWith('/api/v1/tasks/42/done/cancel', undefined, {
      query: { date: '2026-06-25' },
      signal: undefined,
    });
  });
});
