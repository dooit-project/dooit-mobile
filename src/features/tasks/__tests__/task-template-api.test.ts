import { taskTemplateApi } from '@/features/tasks/task-template-api';
import { apiClient } from '@/services/api';

jest.mock('@/services/api', () => ({
  apiClient: {
    get: jest.fn(),
    delete: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

const getMock = apiClient.get as jest.Mock;
const deleteMock = apiClient.delete as jest.Mock;
const postMock = apiClient.post as jest.Mock;
const putMock = apiClient.put as jest.Mock;

describe('Task template API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('템플릿 CRUD endpoint를 호출한다', async () => {
    const request = { title: '주간 회의', type: 'SCHEDULE' as const, allDay: false };

    await taskTemplateApi.list();
    await taskTemplateApi.get(7);
    await taskTemplateApi.create(request);
    await taskTemplateApi.update(7, request);
    await taskTemplateApi.delete(7);

    expect(getMock).toHaveBeenNthCalledWith(1, '/api/v1/task-templates', { signal: undefined });
    expect(getMock).toHaveBeenNthCalledWith(2, '/api/v1/task-templates/7', {
      signal: undefined,
    });
    expect(postMock).toHaveBeenCalledWith('/api/v1/task-templates', request, {
      signal: undefined,
    });
    expect(putMock).toHaveBeenCalledWith('/api/v1/task-templates/7', request, {
      signal: undefined,
    });
    expect(deleteMock).toHaveBeenCalledWith('/api/v1/task-templates/7', {
      signal: undefined,
    });
  });

  test('템플릿 기반 Task 생성 endpoint를 호출한다', async () => {
    const request = { targetDate: '2026-08-17' as const, title: '월요일 운동' };

    await taskTemplateApi.createTask(7, request);

    expect(postMock).toHaveBeenCalledWith('/api/v1/task-templates/7/tasks', request, {
      signal: undefined,
    });
  });
});
