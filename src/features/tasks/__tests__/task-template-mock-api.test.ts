import { mockApiClient } from '@/services/api/mock-api-client';
import type { TaskResponse, TaskTemplateResponse } from '@/types';

describe('Mock task template API', () => {
  test('템플릿을 생성·수정하고 Task에 적용한다', async () => {
    const created = await mockApiClient.post<TaskTemplateResponse>('/api/v1/task-templates', {
      title: '운동',
      type: 'TODO',
      category: '건강',
      allDay: false,
    });
    const updated = await mockApiClient.put<TaskTemplateResponse>(
      `/api/v1/task-templates/${created.id}`,
      {
        title: '아침 운동',
        type: 'TODO',
        category: '건강',
        allDay: false,
      },
    );
    const task = await mockApiClient.post<TaskResponse>(
      `/api/v1/task-templates/${created.id}/tasks`,
      { title: '월요일 운동' },
    );

    expect(updated.title).toBe('아침 운동');
    expect(task).toMatchObject({
      title: '월요일 운동',
      category: '건강',
      status: 'INBOX',
      type: 'TODO',
    });

    await mockApiClient.delete(`/api/v1/task-templates/${created.id}`);
    await expect(mockApiClient.get(`/api/v1/task-templates/${created.id}`)).rejects.toMatchObject({
      status: 404,
    });
  });
});
