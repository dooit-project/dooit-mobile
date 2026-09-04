import { mockApiClient } from '@/services/api/mock-api-client';
import type { TaskCategorySummaryResponse } from '@/types';

describe('Mock Task category summary API', () => {
  test('개인 Task를 상태별로 집계하고 미분류를 마지막에 둔다', async () => {
    await mockApiClient.post('/api/v1/tasks', {
      title: '문서 정리',
      category: '새 카테고리',
      type: 'TODO',
      allDay: false,
    });
    await mockApiClient.post('/api/v1/tasks', {
      title: '미분류 메모',
      type: 'TODO',
      allDay: false,
    });

    const summaries = await mockApiClient.get<TaskCategorySummaryResponse[]>(
      '/api/v1/tasks/categories',
    );
    expect(summaries.find(({ category }) => category === '새 카테고리')).toMatchObject({
      displayName: '새 카테고리',
      taskCount: 1,
      inboxCount: 1,
    });
    expect(summaries.at(-1)).toMatchObject({ category: null, displayName: '미분류' });
  });
});
